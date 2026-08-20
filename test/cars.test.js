const cds = require('@sap/cds')

const { POST, expect } = cds.test()

describe('Cars', () => {

    it('should create a valid car', async () => {

        const response = await POST('/odata/v4/cars/Cars', {
            licensePlate: 'TEST001',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2023,
            dailyPrice: 50,
            category_code: 'SEDAN'
        })

        expect(response.status).to.equal(201)
    })


    it('rejects a car with a future year', async () => {

        try {
            await POST('/odata/v4/cars/Cars', {
                licensePlate: 'TEST-FUTURE',
                brand: 'Toyota',
                model: 'Corolla',
                year: new Date().getFullYear() + 1,
                dailyPrice: 50,
                category_code: 'SEDAN'
            })

            throw new Error('Request should have been rejected')

        } catch (error) {
            expect(error.status).to.equal(400)
            expect(error.message).to.include('Car year cannot be in the future')
        }
    })


    it('rejects a car older than 15 years', async () => {

        await expect(
            POST('/odata/v4/cars/Cars', {
                licensePlate: 'TEST-OLD',
                brand: 'Toyota',
                model: 'Corolla',
                year: new Date().getFullYear() - 16,
                dailyPrice: 50,
                category_code: 'SEDAN'
            })
        ).to.be.rejectedWith('Car year must be within the last 15 years')
    })


    it('rejects a car with zero daily price', async () => {

        await expect(
            POST('/odata/v4/cars/Cars', {
                licensePlate: 'TEST-PRICE-ZERO',
                brand: 'Toyota',
                model: 'Corolla',
                year: 2023,
                dailyPrice: 0,
                category_code: 'SEDAN'
            })
        ).to.be.rejectedWith('dailyPrice')
    })

    
    it('rejects a car with negative daily price', async () => {

        await expect(
            POST('/odata/v4/cars/Cars', {
                licensePlate: 'TEST-PRICE-NEGATIVE',
                brand: 'Toyota',
                model: 'Corolla',
                year: 2023,
                dailyPrice: -10,
                category_code: 'SEDAN'
            })
        ).to.be.rejectedWith('dailyPrice')
    })


    it('rejects a car with non-existing category', async () => {

        await expect(
            POST('/odata/v4/cars/Cars', {
                licensePlate: 'TEST-INVALID-CATEGORY',
                brand: 'Toyota',
                model: 'Corolla',
                year: 2023,
                dailyPrice: 50,
                category_code: 'DOES-NOT-EXIST'
            })
        ).to.be.rejected
    })


})