using { sap.cap.cars as db } from '../db/schema';

service CarsService {

  entity Cars as projection on db.Cars actions {
    action rent(
      startDate   : Date,
      endDate     : Date,
      customer_ID : String(10)
    ) returns Rentals;

    action setToMaintenance(
      startDate   : Date,
      endDate     : Date,
      description : String(200),
      cost        : Decimal(9,2)
    ) returns Maintenance;
  };

  entity Customers    as projection on db.Customers;
  entity Rentals      as projection on db.Rentals;
  entity Maintenance  as projection on db.Maintenance;

}
