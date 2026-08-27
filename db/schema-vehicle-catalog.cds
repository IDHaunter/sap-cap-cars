namespace sap.cap.cars.catalog;

//this DB is not used in application, it is just to create EDMX file

entity VehicleBrands {
    key code : String(20);
    name     : String(50);

    models   : Composition of many VehicleModels on models.brand = $self;
}

entity VehicleModels {
    key code : String(20);
    name     : String(50);

    brand    : Association to VehicleBrands;
}