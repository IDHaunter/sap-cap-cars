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
})