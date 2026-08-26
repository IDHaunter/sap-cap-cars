sap.ui.define([
    "sap/m/MessageToast"
], function (MessageToast) {
    "use strict";

    return {
        onTest: function (oContext, aSelectedContexts) {
            MessageToast.show("Rent Custom button pressed!");
        }
    };
});