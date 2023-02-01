sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	"sap/ui/model/odata/ODataModel"
], function(Object, MessageToast, ODataModel) {
	"use strict";
	return Object.extend("AddTariffCode", {
		
		_getDialog: function() {
			if (!this._oDialog) { this._oDialog = sap.ui.xmlfragment("be.deloitte.dce.dceproducts.view.Fragments.AddTariffCode", this); }
			return this._oDialog;
		},
		
		open: function(oView, boolean) {
			var oDialog = this._getDialog();
			this.oView = oView;
			this.oController = oView.getController();
			oView.addDependent(oDialog);
			oDialog.open();
			if (boolean) {
				oDialog.setBusy(true);
			}
		},
		
		onCloseTariffDialog: function() {
			var table = this._getDialog().getContent()[0];
			var headerToolBar = table.getHeaderToolbar();
			var oButton = headerToolBar.getContent()[0];
			if (oButton !== undefined) {
				oButton.setVisible(false);
			}
			this._getDialog().close();
		},
		
		onDetailPress: function(oEvent) {
			var number = oEvent.getSource().getCells()[0].getTitle();
			var ns = this.oView.getModel("NumberingSchemes").oData.numSchemes;
			oEvent.getSource().getParent().mAggregations.headerToolbar.getContent()[0].setVisible(true);
			
			for(var i = 0; i < ns.length; i++){
				if(number === ns[i].Ccngn){
					if(ns[i].Code === null){
						this.fetchNumSchemes(ns[i].Id, "EN");
					} else{
						var input = this.oView.byId("ifCustomsCode");
						input.setValue(number);
						this.onCloseTariffDialog();
					} 
				}
			}
		},
		
		getPromise: function (oModel, pathToTestForData) {
			var deferred = $.Deferred();
			if (oModel.getProperty(pathToTestForData))
				deferred.resolve(); //Data already loaded
			else
				oModel.attachRequestCompleted(deferred.resolve); //Waiting for the event
			return deferred.promise();
		},
		
		onPressGoUp: function(oEvent){
			var pid = this.oView.getModel("NumberingSchemes").oData.numSchemes[0].ParentId;	
			var ppid = "00" + pid.substr(0, pid.length -2);
			if(ppid === "0000000000"){
				ppid = "";
				oEvent.getSource().setVisible(false);
			}
			this.fetchNumSchemes(ppid, "EN");
		},
		
		fetchNumSchemes: function(pid, lang){
			var that = this;
			var bodyJSON = {
				"ParentID": pid,
				"Language": lang
			};
			var body = JSON.stringify(bodyJSON);
			var oModel = new sap.ui.model.json.JSONModel();
			var sHeaders = {
				"Content-Type": "application/json",
				"Accept": "application/json"
			};
			
			oModel.loadData("/dce/env/services/dispatcher.xsjs/NumberingSchemeCode?language=EN", body, true, "POST", null, false, sHeaders);
			var modelPromise = this.getPromise(oModel, "/numSchemes");
			modelPromise.done(function() {
				that.oView.setModel(oModel, "NumberingSchemes");
			});
		}
	});
});
