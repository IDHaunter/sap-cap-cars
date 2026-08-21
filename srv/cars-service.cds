using { sap.cap.cars as db } from '../db/schema';

service CarsService {

  @odata.draft.enabled
  entity Cars as projection on db.Cars {
    *,
    case
      when exists maintenances[startDate <= $now and endDate >= $now] then 'UM'
      when exists rentals[startDate <= $now and endDate >= $now]      then 'RE'
      else 'AV'
    end as status_code : String(2),
    status : Association to AvailabilityStatus on status.code = status_code
  } actions {
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

  entity Customers           as projection on db.Customers;
  entity Rentals             as projection on db.Rentals;
  entity Maintenance         as projection on db.Maintenance;
  entity AvailabilityStatus  as projection on db.AvailabilityStatus;

}
