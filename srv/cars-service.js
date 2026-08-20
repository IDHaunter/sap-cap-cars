const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const { Cars, Rentals, Maintenance } = this.entities

    /**
     * Rent a car.
     */
    this.on('rent', 'Cars', async (req) => {

        const { startDate, endDate, customer_ID } = req.data
        const { licensePlate } = req.params[0]

        validatePeriod(req, startDate, endDate)
        await validateAvailability(req, Rentals, Maintenance, licensePlate, startDate, endDate)

        const rental = {
            startDate,
            endDate,
            customer_ID,
            car_licensePlate: licensePlate
        }

        await INSERT.into(Rentals).entries(rental)

        return SELECT.one
            .from(Rentals)
            .where({ ID: rental.ID })
    })


    /**
     * Put a car into maintenance.
     */
    this.on('setToMaintenance', 'Cars', async (req) => {

        const { startDate, endDate, description, cost } = req.data
        const { licensePlate } = req.params[0]

        validatePeriod(req, startDate, endDate)
        await validateAvailability(req, Rentals, Maintenance, licensePlate, startDate, endDate)

        const maintenance = {
            startDate,
            endDate,
            description,
            cost,
            car_licensePlate: licensePlate
        }

        await INSERT.into(Maintenance).entries(maintenance)

        return SELECT.one
            .from(Maintenance)
            .where({ ID: maintenance.ID })
    })
})


/**
 * Validates a rental or maintenance period.
 * Rejects the request if startDate is after endDate.
 */
function validatePeriod(req, startDate, endDate) {
    if (startDate > endDate) {
        req.reject(
            400,
            'startDate must be before or equal to endDate'
        )
    }
}


/**
 * Validates that the car is available for rent 
 * or maintenance during the given period.
 */
async function validateAvailability(
    req,
    Rentals,
    Maintenance,
    licensePlate,
    startDate,
    endDate
) {

    const rental = await SELECT.one
        .from(Rentals)
        .where({
            car_licensePlate: licensePlate,
            startDate: { '<=': endDate },
            endDate: { '>=': startDate }
        })

    if (rental) {
        req.reject(
            409,
            `Car ${licensePlate} is already rented during this period`
        )
    }

    const maintenance = await SELECT.one
        .from(Maintenance)
        .where({
            car_licensePlate: licensePlate,
            startDate: { '<=': endDate },
            endDate: { '>=': startDate }
        })

    if (maintenance) {
        req.reject(
            409,
            `Car ${licensePlate} is under maintenance during this period`
        )
    }
}