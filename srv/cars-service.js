const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const { Cars, Rentals, Maintenance, CarBrands, CarModels } = this.entities

    // ----- Singltone for user authentication ------

    this.on('READ', 'Configuration', async (req) => {

        console.log('USER:', req.user);
        console.log('USER ID:', req.user.id);
        const isAdmin = req.user.is('Admin');
        console.log('isAdmin:', isAdmin);

        return {
            ID: 'config',
            userId: req.user.id,
            isAdmin: isAdmin
        }
    })

    // ------------------- CarModels & CarBrands --------

    const vehicleBrandsMock = [
        { code: 'TOYOTA', name: 'Toyota' },
        { code: 'HONDA', name: 'Honda' },
        { code: 'FORD', name: 'Ford' },
        { code: 'VOLKSWAGEN', name: 'Volkswagen' }
    ]

    const vehicleModelsMock = [
        { code: 'COROLLA', name: 'Corolla', brand_code: 'TOYOTA' },
        { code: 'CAMRY', name: 'Camry', brand_code: 'TOYOTA' },
        { code: 'CR-V', name: 'CR-V', brand_code: 'HONDA' },
        { code: 'F-150', name: 'F-150', brand_code: 'FORD' },
        { code: 'EXPLORER', name: 'Explorer', brand_code: 'FORD' },
        { code: 'GOLF', name: 'Golf', brand_code: 'VOLKSWAGEN' }
    ]

    this.on('READ', 'CarBrands', async (req) => {
        if (req.query.SELECT) {
            return vehicleBrandsMock
        }
    })

    this.on('READ', 'CarModels', async (req) => {
        const models = vehicleModelsMock.map(m => ({
            ...m,
            brandName: vehicleBrandsMock.find(b => b.code === m.brand_code)?.name
        }))

        if (req.query.SELECT) {
            return models
        }
    })

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

        // Users may only rent for themselves, so their customer_ID is derived
        // from the logged-in user rather than trusted from the request.
        const resolvedCustomerId = req.user.is('User') ? req.user.id : customer_ID

        validatePeriod(req, startDate, endDate)
        await validateAvailability(req, Rentals, Maintenance, licensePlate, startDate, endDate)

        const rental = {
            startDate,
            endDate,
            customer_ID: resolvedCustomerId,
            car_licensePlate: licensePlate
        }

        await INSERT.into(Rentals).entries(rental)

        // EMIT CUSTOM EVENT 
        // Get the created rental with all fields
        const createdRental = await SELECT.one
            .from(Rentals)
            .where({ ID: rental.ID })
        
        // Log event creation
        console.log(`[Emition] Rental.Created with ID = ${createdRental.ID}`)     

        // Emit event with the rental data
        await this.emit('Rental.Created', createdRental)

        return createdRental
    })


    /**
     * REGISTER EVENT HANDLER for Rental.Created event
     */

    this.on('Rental.Created', async (event) => {

        const rentalData = event.data

        console.log(`[Handler] Rental.Created with rentalData =\n${JSON.stringify(rentalData, null, 2)}`)
        
        // Get the car's license plate
        const licensePlate = rentalData.car_licensePlate

        // Unique description for the auto scheduled maintenance
        const autoDescription = '[Auto] Scheduled maintenance after high usage'
        
        // Calculate the date 12 months ago from the rental star
        const twelveMonthsAgo = new Date(rentalData.startDate)
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
        const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0]

        // Find the date of last auto scheduled maintenance
        const maintananceRow = await SELECT.one
        .from(Maintenance)
        .columns('max(startDate) as maxStartDate')
        .where({
            car_licensePlate: licensePlate,
            description: autoDescription,
            startDate: {
                '>=': twelveMonthsAgoStr,
                '<=': rentalData.startDate
            }
        })

        const lastAutoScheduledMaintenance = maintananceRow?.maxStartDate
        
        // Calculate the effective lower limit (either last maintanance or 12 months ago)
        let minStartDate = twelveMonthsAgoStr
        if (lastAutoScheduledMaintenance && lastAutoScheduledMaintenance > twelveMonthsAgoStr) {
            minStartDate = lastAutoScheduledMaintenance
        }
        
        // Count rentals in the last 12 months for this car before rent date
        const rentals = await SELECT
            .from(Rentals)
            .where({
                car_licensePlate: licensePlate,
                startDate: {
                    '>=': minStartDate,
                    '<=': rentalData.startDate
                }
            })
        
        const rentalCount = rentals.length
        console.log(`[Handler] Rental.Created - ${rentalCount} rentals for car ${licensePlate} in last 12 months`)
        
        // If threshold reached (10 or more rentals), schedule maintenance
        if (rentalCount >= 10) {
            // Calculate maintenance start date (day after rental ends)
            const rentalEndDate = new Date(rentalData.endDate)

            // Maintenance should normally start on the day after
            // the rental ends.
            const initialMaintenanceDate = new Date(rentalEndDate)
            initialMaintenanceDate.setDate(initialMaintenanceDate.getDate() + 1)

            // Because the next day may beb buisy we must find the first available day.
            const maintenanceStartDate = await findNextAvailableMaintenanceDate(
                Rentals,
                Maintenance,
                licensePlate,
                initialMaintenanceDate
            )
            
            // Format date as YYYY-MM-DD
            const startDateStr = maintenanceStartDate
            const endDateStr = maintenanceStartDate     // Same day for 1 day maintenance

            // Create maintenance record
            const maintenance = {
                startDate: startDateStr,
                endDate: endDateStr,
                description: autoDescription,
                cost: 0, // No cost for auto-scheduled maintenance
                car_licensePlate: licensePlate
            }
            
            await INSERT.into(Maintenance).entries(maintenance)
            
            // Log for debugging
            console.log(`[Auto] Scheduled maintenance for car ${licensePlate} from ${startDateStr} to ${endDateStr} due to ${rentalCount} rentals in last 12 months`)
        }
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

/**
 * Finds the next available day for a one-day automatic maintenance.
 *
 * The candidate date is considered unavailable if it overlaps
 * with an existing rental or maintenance for the same car.
 *
 * @param {object} Rentals - Rentals entity
 * @param {object} Maintenance - Maintenance entity
 * @param {string} licensePlate - Car license plate
 * @param {string|Date} initialDate - Date from which to start searching
 * @returns {Promise<string>} Available date in YYYY-MM-DD format
 */
async function findNextAvailableMaintenanceDate(
    Rentals,
    Maintenance,
    licensePlate,
    initialDate
) {

    // Start searching from the provided date
    let candidate = new Date(initialDate)

    while (true) {

        // Convert candidate date to YYYY-MM-DD format
        const candidateStr = candidate.toISOString().split('T')[0]

        // Check whether the car is already rented on the candidate date.
        const rentalConflict = await SELECT.one
            .from(Rentals)
            .where({
                car_licensePlate: licensePlate,
                startDate: { '<=': candidateStr },
                endDate: { '>=': candidateStr }
            })

        // Check whether the car already has maintenance
        // scheduled for the candidate date.
        const maintenanceConflict = await SELECT.one
            .from(Maintenance)
            .where({
                car_licensePlate: licensePlate,
                startDate: { '<=': candidateStr },
                endDate: { '>=': candidateStr }
            })

        // If there is no rental and no maintenance on this date,
        // the date is available.
        if (!rentalConflict && !maintenanceConflict) {
            return candidateStr
        }

        // The candidate date is occupied.
        // Move to the next day and check again.
        candidate.setDate(candidate.getDate() + 1)
    }
}