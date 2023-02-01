/*global location history */
sap.ui.define([
	"be/deloitte/dce/dceproducts/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"be/deloitte/dce/dceproducts/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/export/Spreadsheet"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, ODataModel, Export, ExportTypeCSV, Fragment, Sorter,
	MessageBox, MessageToast, Spreadsheet) {
	"use strict";

	return BaseController.extend("be.deloitte.dce.dceproducts.controller.Worklist", {

		formatter: formatter,

		//My fist git comment

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel, iOriginalBusyDelay;

			//this.getRouter().getRoute("worklist").attachPatternMatched(this._onObjectMatched, this);

			var oTable = this.byId("tabProducts");
			oTable.setSticky(["ColumnHeaders", "HeaderToolbar"]);
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			//set the groupers function
			this._mGroupFunctions = {
				ID: function (oContext) {
					var name = oContext.getProperty("ID");
					return {
						key: name,
						text: name
					};
				},
				Description: function (oContext) {
					var name = oContext.getProperty("Description");
					return {
						key: name,
						text: name
					};
				},
				UploadedOn: function (oContext) {
					var sDate = oContext.getProperty("UploadedOn");
					var name;
					if (sDate !== null) {
						var time = sDate.toTimeString().split(":");
						var date = sDate.toJSON().split("T")[0];
						name = date + " " + time[0] + ":" + time[1];
					} else {
						name = "Not Classified";
					}
					return {
						key: name,
						text: name
					};
				},
				UploadedBy: function (oContext) {
					var name = oContext.getProperty("UploadedBy");
					return {
						key: name,
						text: name
					};
				},
				FileName: function (oContext) {
					var name = oContext.getProperty("FileName");
					return {
						key: name,
						text: name
					};
				}
			};

			var bModel = new JSONModel();
			var bHeaders = {
				"Content-Type": "application/json",
				"Accept": "application/json"
			};
			var bodyJSON = {};
			var bodyTwo = JSON.stringify(bodyJSON);
			var client;
			var that = this;
			
			//de aici
			//client = bModel.getData().Client;
			var aSorters = [];
			aSorters.push(new Sorter("ID", false));
			//that.byId("tabProducts").getBinding("items").sort(aSorters);
			/*
			bModel.loadData("/v2/catalog/getCurrentUser()", bodyTwo, true, "GET", null, false, bHeaders);
			bModel.attachRequestCompleted(function (bResult) {
				if (bResult.getParameter("success") === true) {
					client = bModel.getData().Client;
					if (client.Active === "0") {
						that.byId("colList").setType("Inactive");
						that.byId("tabProducts").setMode("None");
						MessageToast.show(client.Client + " is currently inactive.\nFunctionality is limited.", {
							duration: "7000",
							width: "25em",
							autoClose: false,
							closeOnBrowserNavigation: true
						});
					} else {
						var role = parseInt(client.Role);
						if (role < 3) {
							that.byId("tabProducts").setMode("None");
						}
					}
				} else {
					MessageBox.error("Error during getting the current client");
				}
				var aSorters = [];
				aSorters.push(new Sorter("ID", false));
				//that.byId("tabProducts").getBinding("items").sort(aSorters);
			});*/
		},

		_onObjectMatched: function (oEvent) {
			var aSorters = [];
			aSorters.push(new Sorter("ID", false));
			this.byId("tabProducts").getBinding("items").sort(aSorters);
			var startupParams = this.getOwnerComponent().getComponentData().startupParameters; // get Startup params from Owner Component
			if ((startupParams.productID && startupParams.productID[0])) {
				this.getRouter().navTo("object", {
					objectId: startupParams.productID[0] // read product ID. Every parameter is placed in an array therefore [0] holds the value
				}, true);
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent);
		},

		onSearch: function (oEvent) {
			var aFilters = this._getFilters();

			this.byId("tabProducts").getBinding("items").filter(aFilters);
		},

		/**
		 * Event handler filter clearing.
		 * @public
		 */
		onFBClear: function () {
			this.byId("fbsfProdId").setValue("");
			this.byId("fbsfProdDesc").setValue("");
			this.byId("fbsfUpOn").setValue(null);
			this.byId("fbsfUpBy").setValue("");
			this.byId("fbsfFName").setValue("");

			this.byId("tabProducts").getBinding("items").filter([]);
		},

		/**
		 * Event handler for the sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "sort";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "be.deloitte.dce.dceproducts.view.Fragments.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog: function (oEvent) {
			this._applySortGroup(oEvent);
		},

		/**
		 * Event handler to show the filter dialog.
		 * @public
		 */
		onFilterBtnPress: function () {
			var fb = this.byId("mainFilterBar");
			fb.showFilterDialog();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oEvent) {
			var objectid = oEvent.getSource().getBindingContextPath().split("'")[1];
			this.getRouter().navTo("object", {
				objectId: objectid
			});
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			// apply sorter to binding
			// (grouping comes before sorting)
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this._mGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this.byId("tabProducts").getBinding("items").sort(aSorters);
		},
		/**
		 * Download Excel file with the classifications
		 * @public
		 */
		onDownload: function () {
			var that = this;
			var oModel = this.getView().getModel();
			var dModel = new JSONModel();

			var sorters = [];
			var mySorter = new sap.ui.model.Sorter("ID", false);
			sorters.push(mySorter);

			oModel.read("/Products", {
				sorters: sorters,
				filters: this._getFilters(),
				urlParameters: {
					"$expand": "Attributes"
				},
				success: function (oData, oResponse) {
					oModel.read("/ClientAttributes", {
						success: function (oData2, oResponse2) {
							for (var si = 0; si < oData.results.length; si++) {
								oData.results[si].UploadedOn = that.formatterDate(oData.results[si].UploadedOn);
								oData.results[si].Description = formatter.specialChar(oData.results[si].Description);
								if (oData2.results.length > 0) {
									var attribute = oData.results[si].Attributes.results;
									for (var j = 0; j < attribute.length; j++) {
										var name = attribute[j].Name;
										oData.results[si][name] = attribute[j].Value;
									}
								}
							}
							dModel.setData(oData.results);

							var headers = that.getCsvHeader(oData2.results);
							var aColumns = [];

							$.each(headers, function (i, head) {
								aColumns.push({
									label: head.description,
									property: head.id
								});
							});

							var mSettings = {
								workbook: {
									columns: aColumns,
									context: {
										sheetName: "Products"
									}
								},
								fileName: "Products.xlsx",
								dataSource: dModel.getData(),
								showProgress: false
							};
							var oSpreadsheet = new sap.ui.export.Spreadsheet(mSettings);
							oSpreadsheet.build();
						}
					});
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
					MessageBox.error("Error during the download!");
				}
			});
		},
		formatterDate: function (sDate) {
			if (sDate) {
				var time = sDate.toTimeString().split(":");
				var date = sDate.toJSON().split("T")[0];
				return date + " " + time[0] + ":" + time[1];
			} else {
				return "";
			}
		},
		/**
		 * Create the header of the spreadsheet
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		getCsvHeader: function (attributes) {
			var headers = [];
			var head = {};
			head.id = "ID";
			head.description = "ID";
			headers.push(head);

			var head = {};
			head.id = "Description";
			head.description = "Description";
			headers.push(head);

			if (attributes.length > 0) {
				for (var i = 0; i < attributes.length; i++) {
					var head = {};
					head.id = attributes[i].Name;
					head.description = attributes[i].Name;
					headers.push(head);
				}
			}

			var head = {};
			head.id = "FileName";
			head.description = "FileName";
			headers.push(head);

			var head = {};
			head.id = "UploadedBy";
			head.description = "UploadedBy";
			headers.push(head);

			var head = {};
			head.id = "UploadedOn";
			head.description = "UploadedOn";
			headers.push(head);

			return headers;
		},

		/**
		 * Download the product list
		 * @public
		 */
		onDownloadCSV: function () {
			var oModel = this.getView().getModel();
			var dModel = new JSONModel();

			var sorters = [];
			var mySorter = new sap.ui.model.Sorter("ID", false);
			sorters.push(mySorter);

			oModel.read("/Products", {
				sorters: sorters,
				filters: this._getFilters(),
				success: function (oData, oResponse) {
					dModel.setData(oData.results);

					var oExport = new sap.ui.core.util.Export({
						// Type that will be used to generate the content. Own ExportType's can be created to support other formats
						exportType: new sap.ui.core.util.ExportTypeCSV({
							separatorChar: ";"
						}),

						// Pass in the model created above
						models: dModel,

						// binding information for the rows aggregation 
						rows: {
							path: "/"
						},

						// column definitions with column name and binding info for the content
						columns: [{
							name: "Product",
							template: {
								content: {
									path: "ID"
								}
							}
						}, {
							name: "Description",
							template: {
								content: {
									path: "Description"
								}
							}
						}, {
							name: "Uploaded On",
							template: {
								content: {
									path: "UploadedOn"
								}
							}
						}, {
							name: "Uploaded By",
							template: {
								content: {
									path: "UploadedBy"
								}
							}
						}, {
							name: "File Name",
							template: {
								content: {
									path: "FileName"
								}
							}
						}]
					});

					oExport.generate().done(function (sContent) {
						//console.log(sContent);
					}).always(function () {
						this.destroy();
					});

					oExport.saveFile().always(function () {
						this.destroy();
					});
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
					MessageBox.error("Error during the download!");
				}
			});
		},
		/**
		 * Filter the product list
		 * @private
		 */
		_getFilters: function () {
			var aFilters = [];

			var pid = this.byId("fbsfProdId").getValue().trim();
			if (pid.length > 0) {
				aFilters.push(new Filter({
					path: "CIID",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: pid.toUpperCase()
				}));
			}

			var pdesc = this.byId("fbsfProdDesc").getValue().trim();
			if (pdesc.length > 0) {
				pdesc = formatter.noSpecialChar(pdesc);
				aFilters.push(new Filter({
					path: "CIDescription",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: pdesc.toUpperCase()
				}));
			}

			var upOn = this.byId("fbsfUpOn");
			if (upOn.getFrom()) {
				aFilters.push(new Filter({
					path: "UploadedOn",
					operator: sap.ui.model.FilterOperator.BT,
					value1: upOn.getFrom(),
					value2: upOn.getTo()
				}));
			}

			var upBy = this.byId("fbsfUpBy").getValue().trim();
			if (upBy.length > 0) {
				aFilters.push(new Filter({
					path: "CIUploadedBy",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: upBy.toUpperCase()
				}));
			}

			var fName = this.byId("fbsfFName").getValue().trim();
			if (fName.length > 0) {
				aFilters.push(new Filter({
					path: "CIFileName",
					operator: sap.ui.model.FilterOperator.Contains,
					value1: fName.toUpperCase()
				}));
			}

			return aFilters;
		},
		onDelete: function () {
			var that = this;
			var oModel = new JSONModel();
			var sHeaders = {
				"Content-Type": "application/json",
				"Accept": "application/json"
			};
			that.getView().setBusy(true);
			var oTable = this.byId("tabProducts");
			var selItems = oTable.getSelectedItems();
			var GUID, Products = [],
				aBody = {};

			MessageBox.confirm("Do you want to delete those products? ", {
				actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
				icon: MessageBox.Icon.WARNING,
				onClose: function (oAction) {
					if (oAction === "YES") {
						for (var i = 0; i < selItems.length; i++) { //delete by scheme or not?
							GUID = selItems[i].getBindingContext().getProperty("GUID");
							Products.push({
								"GUID": GUID,
								"ProductID": selItems[i].getBindingContext().getProperty("ID")
							});
						}
						aBody = {
							"Products": Products
						};
						var body = JSON.stringify(aBody);
						that.getView().setBusy(false);
						oModel.loadData("/dce/env/services/dispatcher.xsjs/Product", body, true, "DELETE", null, false, sHeaders);

						oModel.attachRequestCompleted(function (oResult) {
							that.getView().setBusy(false);
							if (oResult.getParameter("success") === true) {
								oTable.getBinding("items").refresh();
								that.byId("btnDelete").setEnabled(false);
								MessageToast.show("Products are successfully deleted");
							} else {
								MessageBox.error("Error during deletion!");
							}
							that.onTabSelectChange();
						});
					} else {
						that.getView().setBusy(false);
						return;
					}
				}
			});
		},
		/**
		 * Change Ui when selecting items
		 * @public
		 */
		onTabSelectChange: function () {
			var oPage = this.byId("idPage");
			var oTable = this.byId("tabProducts");
			var btnDel = this.byId("btnDelete");
			if (oTable.getSelectedItems().length === 0) {
				btnDel.setEnabled(false);
				oPage.setShowFooter(false);
				btnDel.setVisible(false);
			} else {
				btnDel.setType("Reject");
				btnDel.setEnabled(true);
				oPage.setShowFooter(true);
				btnDel.setVisible(true);
			}
		}
	});
});