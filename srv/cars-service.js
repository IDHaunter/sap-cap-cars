const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const { Cars, Rentals, Maintenance } = this.entities

    // ------------------- Cars ---------------------

    this.before(['NEW', 'CREATE', 'UPDATE'], ['Cars', 'Cars.drafts'], (req) => {
        validateCarYear(req)
        validateDailyPrice(req)
    })

    // Fiori's object page reads rentals via $expand, which never triggers the
    // after('READ', 'Rentals') handler below, so totalPrice must be computed
    // here too, reusing the car's own dailyPrice already present on the row.
    this.after('READ', 'Cars', (cars) => {
        const carList = Array.isArray(cars) ? cars : [cars]
        for (const car of carList) {
            for (const rental of car?.rentals ?? []) {
                rental.totalPrice = calculateTotalPrice(rental.startDate, rental.endDate, car.dailyPrice)
            }
        }
    })

    // ------------------- Rentals ------------------

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
     * Rent a car impossible using the standard handler.
     */
    this.before('CREATE', 'Rentals', (req) => {
        req.reject(
            400,
            'Rentals must be created using the rent action'
        )
    })

    // Object page/list report only $select the columns referenced by UI annotations,
    // so car_licensePlate must be forced in or totalPrice can't be computed below.
    this.before('READ', 'Rentals', (req) => {
        const { columns } = req.query.SELECT
        if (columns && !columns.some(c => c.ref?.[0] === 'car_licensePlate')) {
            columns.push({ ref: ['car_licensePlate'] })
        }
    })

    /**
     * Computes totalPrice for each read Rental as (number of days rented) × (car's dailyPrice).
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

    // ------------------- Maintenance ------------------

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
     * Do a maintenance impossible using the standard handler.
     */
    this.before('CREATE', 'Maintenance', (req) => {
        req.reject(
            400,
            'Maintenance records must be created using the setToMaintenance action'
        )
    })

})

//------------------- Helper Functions ------------------

/*
* Validates that the car year is not in the future and not older than 15 years.
*/
function validateCarYear(req) {

    const { year } = req.data

    // On UPDATE, year may not be provided.
    if (year === undefined) return

    const currentYear = new Date().getFullYear()
    const oldestAllowedYear = currentYear - 15

    if (year > currentYear) {
        req.reject(
            400,
            `Car year cannot be in the future`
        )
    }

    if (year < oldestAllowedYear) {
        req.reject(
            400,
            `Car year must be within the last 15 years`
        )
    }
}

/*
* Validates that the dailyPrice is greater than zero.
*/
function validateDailyPrice(req) {

    const { dailyPrice } = req.data

    // On UPDATE, dailyPrice may not be provided.
    if (dailyPrice === undefined) return

    if (dailyPrice <= 0) {
        req.reject(
            400,
            'dailyPrice must be greater than zero'
        )
    }
}

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