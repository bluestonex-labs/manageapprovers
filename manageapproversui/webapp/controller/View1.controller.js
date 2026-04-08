sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, BusyIndicator, MessageBox) {
        "use strict";

        return Controller.extend("uk.co.brakes.rf.manageapproversui.controller.View1", {
            onInit: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                this.appModulePath = jQuery.sap.getModulePath(appPath);

                this.getOwnerComponent().getRouter().getRoute("RouteView1").attachPatternMatched(this._onManageRouteMatched, this);

                //Create JSON Model for available plants
                var oPlantsModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oPlantsModel, "oPlantsModel");

                var oApproversModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oApproversModel, "oApproversModel");

                this.fetchPlants();
            },

            _onManageRouteMatched: function (oEvent) {
            },
            getSelectedPlant:function(){
                var plantElement = this.getView().byId("plantCombobox");
                var selectedPlant  = plantElement.getSelectedKey();
                return selectedPlant;
            },
            filterApprovers:function(){
                var selectedPlant  = this.getSelectedPlant();


                var username = this.getView().byId("userNameInput").getValue();
        
                this.getApproverList(selectedPlant,username);
                
            },
   /*         onAddApprover: function (oEvent) {                               //to add a new row
                var oItem = new sap.m.ColumnListItem({
                    cells: [new sap.m.ComboBox({
                                placeholder:"Select Plant",
                                items: {
                                    path: "oPlantsModel>/",
                                    template: new sap.ui.core.Item({
                                    key: "{oPlantsModel>Plant}",
                                    text: "{oPlantsModel>Plant} - {oPlantsModel>Description}"
                                    })
                                }
                    }), 
                    new sap.m.Input(), 
                    new sap.m.Text(), 
                    new sap.m.Text(), 
                    new sap.m.Text(),
                    new sap.m.Button({
                        icon: "sap-icon://delete",
                        type: "Reject",
                        press: [this.remove, this]
                    }),
                    new sap.m.Button({
                        icon: "sap-icon://accept",
                        type: "Accept",
                        press: [this.acceptApprover, this]
                    })]
                });

                var oTable = this.getView().byId("approversTable");
                oTable.addItem(oItem);
            },

            remove: function (oEvent) {
                var oTable = this.getView().byId("approversTable");
                oTable.removeItem(oEvent.getSource().getParent());
            },


            acceptApprover: function (oEvent) {
                var oRow = oEvent.getSource().getParent();
                var aCells = oRow.getCells();
                this.createApprover(oRow);
                for (var i = 0; i < aCells.length; i++) {
                    if (oEvent.getSource().getParent().getCells()[i] instanceof sap.m.Input) {
                        aCells[i].setEditable(false);
                    } else if (oEvent.getSource().getParent().getCells()[i].getIcon() === "sap-icon://accept") {
                        oEvent.getSource().getParent().getCells()[i].setVisible(false);
                    }
                }
            },*/

            fetchPlants: function () {
                var that = this;
                var sDest = "/brakesgwpp";
                var url = this.appModulePath + sDest + "/sap/opu/odata/sap/ZRF_GOODS_RECEIPT_NB_SRV/PlantsSet";
                BusyIndicator.show(500);
                $.ajax({
                    url: url,
                    type: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        that.getView().getModel("oPlantsModel").setData(oData.d.results);
                        var oPlantsModel = that.getView().getModel("oPlantsModel");
                        that.getView().byId("plantCombobox").setModel(oPlantsModel, "oPlantsModel");
                        if (oData.d.results.length > 0) {
                            that.setDefaultPlant();
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        var err = textStatus;
                        MessageBox.error("An error occurred while fetching the plants data.")
                    }
                }, this);
            },

            setDefaultPlant: function (oEvent) {
                BusyIndicator.show(500);
                this.sUserPlant = "";
                var aPlants = this.getView().byId("plantCombobox").getItems();
                for (var i = 0; i < aPlants.length; i++) {
                    var sPath = aPlants[i].oBindingContexts.oPlantsModel.sPath;
                    if (this.getView().getModel("oPlantsModel").getProperty(sPath).DefaultPlant == 'X') {
                        this.getView().byId("plantCombobox").setSelectedKey(aPlants[i].getProperty("key"));
                        this.sUserPlant = aPlants[i].getProperty("key");
                        break;
                    } else {
                        this.getView().byId("plantCombobox").setSelectedKey(aPlants[0].getProperty("key"));
                        this.sUserPlant = aPlants[0].getProperty("key");
                        break;
                    }
                }
                this.getApproverList(this.sUserPlant,null);
                BusyIndicator.hide();
            },

            getApproverList: function (sPlant,username) {
                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                var filter="";

                if(sPlant && username){
                    username = username.toUpperCase();
                    filter=filter+"PLANT eq '"+sPlant+"' and (contains(APPR_FNAME,'"+username+"') or contains(APPR_FNAME,'"+username.toLowerCase()+"') or contains(APPR_LNAME,'"+username+"') or contains(APPR_LNAME,'"+username.toLowerCase()+"'))";
                }else{
                    if(sPlant){
                        filter=filter+"PLANT eq '"+sPlant+"'";
                    }else if(username){
                        username = username.toUpperCase();
                        filter=filter+"APPR_FNAME contains '"+username+"' OR APPR_LNAME contains '"+username+"'";
                    }
                }

                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?$filter=" + filter;
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    //contentType: "application/json",
                    data: {
                        $format: 'json'
                    },
                    success: function (oData, response) {
                        var res = oData.value;
                        res.forEach(function (arrayItem) {
                            arrayItem.APPR_FNAME_L = arrayItem.APPR_FNAME.toUpperCase();
                            arrayItem.APPR_LNAME_L = arrayItem.APPR_LNAME.toUpperCase();
                            console.log(arrayItem);
                        });
                        that.getView().getModel("oApproversModel").setData(res);
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approvers could not be fetched");
                    }
                }, that);
            },
            addEditNewApprover:function(oEvent){
                var source = oEvent.getSource();
                var operation="";
                var data = {};
                
                if(source.getId().includes("btnAdd")){
                    operation= "ADD";
                    data.plant = this.getSelectedPlant(),
                    data.title="Add Approver";
                    data.approver="";
                    data.fname = "";
                    data.lname = "";
                    data.email = "";
                    data.approverIDInputEnabled=true;
                    data.showUserDetailsBtnEnabled=true;
                    //data.id="";
                    data.showConfirm=false;
                    data.operation="POST";
                    data.showApproverDetails=false;//this.controlVisibilityOfUserDetails(false);

                }else{
                    operation= "EDIT";
                    var path = oEvent.getSource().getParent().getBindingContextPath();
                    var model = this.getView().getModel("oApproversModel");
                    var modelData = model.getData();
                    var contextData = modelData[path.split('/')[1]];
                    data.plant = contextData.PLANT;
                    data.title="Edit Approver";
                    data.approver=contextData.APPR_ID;
                    data.fname = contextData.APPR_FNAME;
                    data.lname = contextData.APPR_LNAME;
                    data.email = contextData.APPR_EMAIL;
                    data.approverIDInputEnabled=false;
                    data.showUserDetailsBtnEnabled=false;
                    data.id=contextData.ID;
                    data.showConfirm=true;
                    data.operation="PUT";
                    data.showApproverDetails=true;//this.controlVisibilityOfUserDetails(true);
                }
                var dialogModel = new sap.ui.model.json.JSONModel(data);
                this.getView().setModel(dialogModel,"approverDialogModel");
                if (!this._oDialog) {
                    sap.ui.core.Fragment.load({
                        name: "uk.co.brakes.rf.manageapproversui.fragments.AddEditApprover",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialog = oDialog;
                        this.getView().addDependent(this._oDialog);
                        this._oDialog.setModel(dialogModel);
                        this._oDialog.open();
                    }.bind(this));
                } else {
                    this._oDialog.open();
                }
            },

            addEditApproverDialogClose: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                }
    
                this._oDialog = null;
            },

            addEditApproverDialogConfirm:function(){
                this.editApprover();
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                }
    
                this._oDialog = null;
            },
            controlVisibilityOfUserDetails:function(visible){
                sap.ui.getCore().byId("vbApproverDetails").setVisible(visible);
                sap.ui.getCore().byId("plantAddEdit").setVisible(visible);
            },
            onApproverChange:function(oEvent){
                var inputEle = oEvent.getSource();
                var newApprover = inputEle.getValue();

                //hide user details card and plant
                this.controlVisibilityOfUserDetails(false);
            },

            fetchApproverDetails:function(){
                var approverID = sap.ui.getCore().byId("ipDialogApproverID").getValue();
                if(approverID){
                    approverID = approverID.toUpperCase();
                }else{
                    MessageBox.error("Approver ID is mandatory");
                    return;
                }
                var sDest = "/brakesgwpp";
                var sUrl = this.appModulePath + sDest + "/sap/opu/odata/sap/ZRF_GOODS_RECEIPT_NB_SRV/UserSet('"+approverID+"')";
                var that = this;
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    contentType: "application/json",
                    dataType: "json",
                    success: function (oData, response) {
                        console.log(oData);
                        that.controlVisibilityOfUserDetails(true);
                        var fname= oData.d.FirstName;
                        var lname= oData.d.LastName;
                        var name= fname +" "+ lname;
                        var email = oData.d.EmailID;
                        //sap.ui.getCore().byId("ttDialogApproverName").setText(name);
                        sap.ui.getCore().byId("ttDialogApproverFName").setText(fname);
                        sap.ui.getCore().byId("ttDialogApproverLName").setText(lname);
                        sap.ui.getCore().byId("ttDialogApproverEmail").setText(email);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        MessageBox.error("Approvers could not be fetched");
                        that.controlVisibilityOfUserDetails(false);
                    }
                }, that);
            },

            populateApproverPayload:function(ops){
                var sEmailid = sap.ui.getCore().byId("ttDialogApproverEmail").getText();
                var sFname = sap.ui.getCore().byId("ttDialogApproverFName").getText();
                var sLname = sap.ui.getCore().byId("ttDialogApproverLName").getText();
                var sId = sap.ui.getCore().byId("ipDialogApproverID").getValue();
                var sPlant = sap.ui.getCore().byId("plantComboboxAddEdit").getSelectedKey();
                var sPlantDesc = sap.ui.getCore().byId("plantComboboxAddEdit")._getSelectedItemText();
                var model = this.getView().getModel("approverDialogModel");
                var data = model.getData();

                var oApproverPayload = {
                    "APPR_EMAIL" : sEmailid,
                    "APPR_FNAME" : sFname,
                    "APPR_ID" : sId?sId.toUpperCase():"",
                    "APPR_LEVEL" : "1",
                    "APPR_LNAME" : sLname,
                    "PLANT" : sPlant,
                    "PLANT_DESC" : sPlantDesc//,
                    //"ID":ops==="edit"?data.id: null
                };

                if(ops==="edit"){
                    oApproverPayload.ID = data.id;
                }
                return oApproverPayload;
            },

            createApprover: function () {
                BusyIndicator.show();
  

                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers";
                var oApproverPayload = that.populateApproverPayload("add");
                $.ajax({
                    url: sUrl,
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oApproverPayload),
                    /* data: {
                        $format: 'json'
                    }, */
                    success: function (oData, response) {
                        //that.getView().getModel("oApproversModel").setData(oData.value);\

                        if (that._oDialog) {
                            that._oDialog.close();
                            that._oDialog.destroy();
                        }
            
                        that._oDialog = null;

                        that.getApproverList(that.getSelectedPlant(),null);
                        BusyIndicator.hide();
                        sap.m.MessageToast.show("Approver added successfully.");

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approver could not be added.");
                    }
                }, that);
            },

            deleteApproverPayload:function(oRow){

                

                //var oRow = parent;

                var sPlantDesc = oRow.getCells()[0].getText();
                var sPlant = sPlantDesc.split('-')[0];
                var sId = oRow.getCells()[1].getText();
                var sFname = oRow.getCells()[2].getText();
                var sLname = oRow.getCells()[3].getText();
                var sEmailid = oRow.getCells()[4].getText();
                var sID = oRow.getCells()[7].getText();
                var oDeleteApproverPayload = {
                    "APPR_EMAIL" : sEmailid,
                    "APPR_FNAME" : sFname,
                    "APPR_ID" : sId?sId.toUpperCase():"",
                    "APPR_LEVEL" : "1",
                    "APPR_LNAME" : sLname,
                    "PLANT" : sPlant,
                    "PLANT_DESC" : sPlantDesc,
                    "ID":sID
                };
                return oDeleteApproverPayload;
            },

            deleteApproverConfirmation: function (oEvent) {
                var parent = oEvent.getSource().getParent();
                var that = this;
                MessageBox.confirm("Please confirm if you really want to delete this approver. This cannot be undone.", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === "OK") {
                            that.deleteApprover(parent);
                        }else{
                            return;
                        }
                    }
                });
            },

            deleteApprover: function (oRow) {
                BusyIndicator.show();
            

                var sPlantDesc = oRow.getCells()[0].getText();
                //var sPlant = sPlantDesc.split('-')[0];
                var sApproverId = oRow.getCells()[1].getText();
                var sFname = oRow.getCells()[2].getText();
                var sLname = oRow.getCells()[3].getText();
                var sEmailid = oRow.getCells()[4].getText();
                var sApproverLevel=1;

                var sPlant = sPlantDesc.split('-')[0].trim();
                var sID= oRow.getCells()[7].getText();

                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                //var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?PLANT="+sPlant;
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers(ID="+sID+",PLANT='"+sPlant+"',APPR_LEVEL='"+sApproverLevel+"',APPR_ID='"+sApproverId+"')";
                var oDeleteApproverPayload = that.deleteApproverPayload(oRow);
                $.ajax({
                    url: sUrl,
                    type: "DELETE",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oDeleteApproverPayload),
                    /* data: {
                        $format: 'json'
                    }, */
                    success: function (oData, response) {
                        //that.getView().getModel("oApproversModel").setData(oData.value);\
                        that.getApproverList(that.getSelectedPlant(),null);
                        sap.m.MessageToast.show("Approver deleted successfully.");
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approver could not be deleted.");
                    }
                }, that);
            },
            deleteApprover1: function (oEvent) {
                BusyIndicator.show();
                var oRow = oEvent.getSource().getParent();

                var sPlantDesc = oRow.getCells()[0].getText();
                //var sPlant = sPlantDesc.split('-')[0];
                var sApproverId = oRow.getCells()[1].getText();
                var sFname = oRow.getCells()[2].getText();
                var sLname = oRow.getCells()[3].getText();
                var sEmailid = oRow.getCells()[4].getText();
                var sApproverLevel=1;

                var sPlant = sPlantDesc.split('-')[0].trim();
                var sID= oRow.getCells()[7].getText();

                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                //var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?PLANT="+sPlant;
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers";
                var oDeleteApproverPayload = that.deleteApproverPayload(oEvent);
                $.ajax({
                    url: sUrl,
                    type: "DELETE",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oDeleteApproverPayload),
                    /* data: {
                        $format: 'json'
                    }, */
                    success: function (oData, response) {
                        //that.getView().getModel("oApproversModel").setData(oData.value);\
                        that.getApproverList(that.getSelectedPlant(),null);
                        sap.m.MessageToast.show("Approver deleted successfully.");
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approver could not be deleted.");
                    }
                }, that);
            },

            editApprover:function(){
                BusyIndicator.show();
                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                //var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?PLANT="+sPlant;  
                var oEditApproverPayload = that.populateApproverPayload("edit");
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers(ID="+oEditApproverPayload.ID+",PLANT='"+oEditApproverPayload.PLANT+"',APPR_LEVEL='"+oEditApproverPayload.APPR_LEVEL+"',APPR_ID='"+oEditApproverPayload.APPR_ID+"')";
              
                $.ajax({
                    url: sUrl,
                    type: "PUT",
                    contentType: "application/json",
                    dataType: "json",
                    data: JSON.stringify(oEditApproverPayload),
                    /* data: {
                        $format: 'json'
                    }, */
                    success: function (oData, response) {
                        //that.getView().getModel("oApproversModel").setData(oData.value);\
                        that.getApproverList(that.getSelectedPlant(),null);
                        sap.m.MessageToast.show("Approver updated successfully.");
                        //oTable.removeItem(oRow);
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approver could not be updated.");
                    }
                }, that);
            }
        });
    });
