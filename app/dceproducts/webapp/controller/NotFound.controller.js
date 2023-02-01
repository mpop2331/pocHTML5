sap.ui.define([
		"be/deloitte/dce/dceproducts/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("be.deloitte.dce.dceproducts.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);