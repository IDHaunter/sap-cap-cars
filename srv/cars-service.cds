using { sap.cap.cars as db } from '../db/schema';

service CarsService {

  entity Cars         as projection on db.Cars;
  entity Customers    as projection on db.Customers;
  entity Rentals      as projection on db.Rentals;
  entity Maintenance  as projection on db.Maintenance;

}
