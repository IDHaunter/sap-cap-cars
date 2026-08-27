using { sap.cap.cars.catalog as db } from '../db/schema-vehicle-catalog';

@path: '/vehicle-catalog'
service VehicleCatalogService {

    entity VehicleBrands as projection on db.VehicleBrands;

    entity VehicleModels as projection on db.VehicleModels;

}