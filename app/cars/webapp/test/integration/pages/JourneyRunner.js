sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"sap/cap/cars/cars/test/integration/pages/CarsList.gen",
	"sap/cap/cars/cars/test/integration/pages/CarsObjectPage.gen"
], function (JourneyRunner, CarsListGenerated, CarsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('sap/cap/cars/cars') + '/test/flp.html#app-preview',
        pages: {
			onTheCarsListGenerated: CarsListGenerated,
			onTheCarsObjectPageGenerated: CarsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

