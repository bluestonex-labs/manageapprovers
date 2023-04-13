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
                this.getView().setModel(oPlantsModel, "oApproversModel");

                this.fetchPlants();
            },

            _onManageRouteMatched: function (oEvent) {
            },

            onAddApprover: function (oEvent) {                               //to add a new row
                var oItem = new sap.m.ColumnListItem({
                    cells: [new sap.m.Input(), new sap.m.Input(), new sap.m.Input(), new sap.m.Input(), new sap.m.Input(),
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
            },

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
                this.getApproverListForLoggedInPlant(this.sUserPlant);
                BusyIndicator.hide();
            },

            getApproverListForLoggedInPlant: function (sPlant) {
                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?PLANT=" + "GT10";
                $.ajax({
                    url: sUrl,
                    type: "GET",
                    //contentType: "application/json",
                    data: {
                        $format: 'json'
                    },
                    success: function (oData, response) {
                        that.getView().getModel("oApproversModel").setData(oData.value);
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approvers could not be fetched");
                    }
                }, that);
            },

            createApprover: function (oRow) {
                BusyIndicator.show();
                var sPlant = oRow.getCells()[0].getValue();
                var sFname = oRow.getCells()[1].getValue();
                var sLname = oRow.getCells()[2].getValue();
                var sId = oRow.getCells()[3].getValue();
                var sEmailid = oRow.getCells()[4].getValue();
                var that = this;
                var sDest = "/bsxcpeaexperience";
                this.sApproverId = "";
                this.sApproverMail = "";
                var sUrl = this.appModulePath + sDest + "/cpea-experience/Approvers?PLANT=" + "GT10";
                var oApproverPayload = {
                    "APPR_EMAIL" : sEmailid,
                    "APPR_FNAME" : sFname,
                    "APPR_ID" : sId,
                    "APPR_LEVEL" : "1",
                    "APPR_LNAME" : sLname,
                    "PLANT" : sPlant,
                    "PLANT_DESC" : "plant description"
                };
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
                        that.getApproverListForLoggedInPlant(that.sUserPlant);
                        var oTable = that.getView().byId("approversTable");
                        oTable.removeItem(oRow);
                        BusyIndicator.hide();

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        BusyIndicator.hide();
                        MessageBox.error("Approvers could not be fetched");
                    }
                }, that);
            }
        });
    });
