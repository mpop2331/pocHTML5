sap.ui.define([
	"be/deloitte/dce/dceproducts/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"be/deloitte/dce/dceproducts/model/formatter",
	"sap/ui/model/odata/ODataModel"
], function (
	BaseController,
	JSONModel,
	History,
	MessageBox,
	MessageToast,
	Filter,
	formatter,
	ODataModel
) {
	"use strict";

	return BaseController.extend("be.deloitte.dce.dceproducts.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			this.setModel(oViewModel, "objectView");

			var aActions = [{
				"Text": "Delete",
				"Icon": "sap-icon://delete",
				"Key": "delete"
			}, {
				"Text": "Edit",
				"Icon": "sap-icon://edit",
				"Key": "edit"
			}];
			var oActionsModel = new JSONModel();
			oActionsModel.setData(aActions);
			this.getView().setModel(oActionsModel, "actionsModel");

		},

		getPromise: function (oModel, pathToTestForData) {
			var deferred = $.Deferred();
			if (oModel.getProperty(pathToTestForData))
				deferred.resolve(); //Data already loaded
			else
				oModel.attachRequestCompleted(deferred.resolve); //Waiting for the event

			return deferred.promise();
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Products", {
					GUID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
			var aFilters = [];
			aFilters.push(new Filter({
				path: "ProductGUID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sObjectId
			}));
			this.byId("tList").getBinding("items").filter(aFilters);

			var aFilters2 = [];
			aFilters2.push(new Filter({
					path: "ProductGUID",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sObjectId
				}));
			aFilters2.push(new Filter({
					path: "Active",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: 1
				}));
			// this.byId("tabAttributes").getBinding("items").filter(aFilters2);
			var aFilterCriteriaAttrs = [];
			var aOtherAttrs = [];
			var oModel = this.getView().getModel();
			var that = this;
			oModel.read("/Attributes", {
				filters: aFilters2,
				success: function(oData) {
					oModel.read("/ClientAttributes", {
						success: function(oData2) {
							oData2.results.forEach(function(obj) {
								if(obj.ViewAttribute !== null && obj.ViewAttribute < 10) {
									oData.results.forEach(function(obj2) {
										if(obj.Name === obj2.Name) {
											aFilterCriteriaAttrs.push(obj2);
										}
									}); 
								} else {
									oData.results.forEach(function(obj2) {
										if(obj.Name === obj2.Name) {
											aOtherAttrs.push(obj2);
										}
									}); 
								}
							});
							
							var oFilterAttrsModel = new JSONModel();
							oFilterAttrsModel.setData(aFilterCriteriaAttrs);
							that.getView().setModel(oFilterAttrsModel, "filterCriteriaAttrsModel");
							var oOtherAttrsModel = new JSONModel();
							oOtherAttrsModel.setData(aOtherAttrs);
							that.getView().setModel(oOtherAttrsModel, "otherAttrsModel");
						}
					});
				}
				
			});
		},
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent);
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var that = this;
			this.getView().bindElement({
				path: sObjectPath
			});
		},

		onNavBack: function () {
			this.getRouter().navTo("worklist", {}, true);
		},
		/**
		 * Add a comment to the product
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onPost: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var Product = this.getView().getBindingContext().getObject();
			var that = this;

			var bodyJSON = {
				"ProductGUID": Product.GUID,
				"Source": "Product",
				"Comment": sValue
			};
			var body = JSON.stringify(bodyJSON);

			var oModel = new sap.ui.model.json.JSONModel();
			var sHeaders = {
				"Content-Type": "application/json",
				"Accept": "application/json"
			};

			oModel.loadData("/dce/env/services/dispatcher.xsjs/Comment", body, true, "POST", null, false, sHeaders);
			oModel.attachRequestCompleted(function (oResult) {
				if (oResult.getParameter("success") === true) {
					MessageToast.show("Comment Saved");
					that.getView().getElementBinding().refresh(true);
				}
			});
			oModel.attachRequestFailed(function (oResponse) {
				MessageBox.error("Error!");
			});
		},
		onEdit: function (oEvent) {
			var oModel = new JSONModel();
			var sHeaders = {
				"Content-Type": "application/json",
				"Accept": "application/json"
			};
			var oList = this.byId("listComment");
			var aBody = {};
			var commentGuid = oEvent.getSource().getBindingContext().getObject();
			var sNewComment = oEvent.getSource().getParent().getContent()[1].getValue();

			aBody = {
				"GUID": commentGuid.GUID,
				"Comment": sNewComment,
				"User": commentGuid.User

			};

			var body = JSON.stringify(aBody);
			oModel.loadData("/dce/env/services/dispatcher.xsjs/Comment?action=edit", body, true, "PUT", null, false, sHeaders);
			oModel.attachRequestCompleted(function (oResponse) {
				if(oResponse.getParameter("success") === true) {
					MessageToast.show("Comment saved.");
					oList.getBinding("items").refresh();
				} else {
					MessageBox.show("Error during the update of the comment!");
				}
			});

			oEvent.getSource().getParent().getContent()[1].setVisible(false);
			oEvent.getSource().getParent().getContent()[2].setVisible(false);
			oEvent.getSource().getParent().getContent()[3].setVisible(false);
		},
		onDelete: function (oEvent) {
			var oModel = new JSONModel();
			var sHeaders = {
				"Content-Type": "application/json",
				"Accept": "application/json"
			};
			var oList = this.byId("listComment");
			var aBody = {};
			var commentGuid = oEvent.getSource().getBindingContext().getObject();

			aBody = {
				"GUID": commentGuid.GUID
			};
			var body = JSON.stringify(aBody);
			oModel.loadData("/dce/env/services/dispatcher.xsjs/Comment", body, true, "DELETE", null, false, sHeaders);
			oModel.attachRequestCompleted(function (oResponse) {
				oList.getBinding("items").refresh();
			});
		},

		onActionPressed: function (oEvent) {
			var sAction = oEvent.getSource().getKey();

			if (sAction === "delete") {
				this.onDelete(oEvent);
			} else if (sAction === "edit") {
				this.onEditPressed(oEvent);
			}
		},

		onEditPressed: function (oEvent) {
			// this.byId("commentInput").setVisible(true);
			// this.byId("commentSaveButton").setVisible(true);
			// this.byId("commentCancelButton").setVisible(true);
			oEvent.getSource().getParent().getParent().getContent()[1].setVisible(true);
			oEvent.getSource().getParent().getParent().getContent()[2].setVisible(true);
			oEvent.getSource().getParent().getParent().getContent()[3].setVisible(true);
		},

		onCancel: function (oEvent) {
			// this.byId("commentInput").setVisible(false);
			// this.byId("commentSaveButton").setVisible(false);
			// this.byId("commentCancelButton").setVisible(false);
			oEvent.getSource().getParent().getContent()[1].setVisible(false);
			oEvent.getSource().getParent().getContent()[2].setVisible(false);
			oEvent.getSource().getParent().getContent()[3].setVisible(false);
		}

	});
});