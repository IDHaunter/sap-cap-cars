sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
], function (MessageToast, MessageBox, Fragment, JSONModel) {
    "use strict";

    let pDialog;

    function getRentDialog() {
        if (!pDialog) {
            pDialog = Fragment.load({
                name: "sap.cap.cars.cars.ext.fragment.RentDialog",
                controller: CustomActions
            });
        }
        return pDialog;
    }

    function formatDate(oDate) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${oDate.getFullYear()}-${pad(oDate.getMonth() + 1)}-${pad(oDate.getDate())}`;
    }

    const CustomActions = {

        onRent: async function (oContext) {
            const oDialog = await getRentDialog();
            oDialog._oCarContext = oContext;

            const isAdmin = await oContext.getModel()
                .bindContext("/Configuration")
                .requestObject("isAdmin");

            oDialog.setModel(new JSONModel({
                startDate: null,
                endDate: null,
                customerId: "",
                isAdmin
            }), "rent");

            oDialog.open();
        },

        onRentConfirm: async function (oEvent) {
            const oDialog = oEvent.getSource().getParent();
            const oRentData = oDialog.getModel("rent").getData();
            const oCarContext = oDialog._oCarContext;

            if (!oRentData.startDate || !oRentData.endDate) {
                MessageBox.error("Please select both start and end dates.");
                return;
            }

            const oOperation = oCarContext.getModel().bindContext(
                "CarsService.rent(...)",
                oCarContext
            );

            oOperation.setParameter("startDate", formatDate(oRentData.startDate));
            oOperation.setParameter("endDate", formatDate(oRentData.endDate));
            if (oRentData.isAdmin) {
                oOperation.setParameter("customer_ID", oRentData.customerId);
            }

            try {
                await oOperation.execute();
                MessageToast.show("Car rented successfully");
                oDialog.close();
                oCarContext.getBinding().refresh();
            } catch (oError) {
                MessageBox.error(oError.message || "Failed to rent the car.");
            }
        },

        onRentCancel: function (oEvent) {
            oEvent.getSource().getParent().close();
        }
    };

    return CustomActions;
});
