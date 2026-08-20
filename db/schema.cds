namespace sap.cap.cars;

using { cuid } from '@sap/cds/common';

aspect DatePeriod {
  startDate : Date @mandatory;
  endDate   : Date @mandatory;
}

entity Category {
  key code : String(10);
  name     : String(50);
}

entity Cars {
  key licensePlate : String(20);
  brand            : String(50)  @mandatory;
  model            : String(50)  @mandatory;
  year             : Integer     @mandatory;
  dailyPrice       : Decimal(9,2) @mandatory @assert.range: [(0), _];
  category         : Association to Category @mandatory;
  rentals          : Association to many Rentals on rentals.car = $self;
  maintenances     : Association to many Maintenance on maintenances.car = $self;
}

@assert.unique: {
  licenseForDriver: [driverLicense],
  emailForDriver: [email]
}
entity Customers {
  key ID         : String(10);
  driverLicense  : String(20) @mandatory;
  email          : String(100) @mandatory;
  firstName      : String(50) @mandatory;
  lastName       : String(50) @mandatory;
  phone          : String(20);
  address        : String(200);
  rentals        : Association to many Rentals on rentals.customer = $self;
}

entity Rentals : cuid, DatePeriod {
  virtual totalPrice : Decimal(9,2); // is not existed in DB, computed in srv layer: days rented × car.dailyPrice
  customer           : Association to Customers @mandatory;
  car                : Association to Cars @mandatory;
}

entity Maintenance : cuid, DatePeriod {
  description : String(200) @mandatory;
  cost        : Decimal(9,2) @mandatory;
  car         : Association to Cars @mandatory;
}

entity AvailabilityStatus {
  key code    : String(10);
  name        : String(50);
  criticality : Integer;
}
