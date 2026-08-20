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

        return this.run(SELECT.one
            .from(Rentals)
            .where({ ID: rental.ID }))
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


    /**
     * Computes totalPrice for each read Rental as
     * (number of days rented) × (car's dailyPrice).
     */
    this.after('READ', 'Rentals', async (rentals) => {
        /*
        // We may recieve one rental
          {
              ID: '...',
              startDate: '2026-08-20',
              endDate: '2026-08-25',
              car_licensePlate: 'AB1111CD'
          }

         // Or or an array
         [
              { ID: '1', ... },
              { ID: '2', ... },
              { ID: '3', ... }
          ] 

        */

        //Make sure we have an array 
        const rentalList = Array.isArray(rentals) ? rentals : [rentals]
        if (rentalList.length === 0) return

        // Take every rental and extract its car_licensePlate in a unique set, 
        // then convert it back to an array
        const licensePlates = [...new Set(rentalList.map(rental => rental.car_licensePlate))]

        // Load all cars with ONE query by the unique licensePlates
        /*
        cars = [
            {
                licensePlate: 'AAA',
                dailyPrice: 50
            },
            {
                licensePlate: 'BBB',
                dailyPrice: 70
            }
        ]
        */
        const cars = await SELECT
          .from(Cars)
          .columns('licensePlate', 'dailyPrice')
          .where({
              licensePlate: { in: licensePlates }
          })
        
        // Create a lookup object like { licensePlate1: dailyPrice1, licensePlate2: dailyPrice2, ... }
        const dailyPriceByLicensePlate = Object.fromEntries(
            cars.map(car => [car.licensePlate, car.dailyPrice])
        )

        // Calculate the total price for each rental and store it in the rental object
        for (const rental of rentalList) {
            const dailyPrice = dailyPriceByLicensePlate[rental.car_licensePlate]
            rental.totalPrice = calculateTotalPrice(rental.startDate, rental.endDate, dailyPrice)
        }
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


/**
 * Calculates the total price of a rental as the number of days
 * rented (inclusive of both startDate and endDate) × dailyPrice.
 */
function calculateTotalPrice(startDate, endDate, dailyPrice) {
    const daysRented = (new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000) + 1
    return daysRented * dailyPrice
}