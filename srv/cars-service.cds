using { sap.cap.cars as db } from '../db/schema';

using { S4VehicleCatalog } from './external/S4VehicleCatalog';

@odata @mcp
@requires: 'authenticated-user'
service CarsService {

  entity CarBrands as projection on S4VehicleCatalog.VehicleBrands;
  entity CarModels as projection on S4VehicleCatalog.VehicleModels;

  @odata.draft.enabled
  @restrict: [
    { grant: 'READ', to: ['User', 'Admin']},
    { grant: '*', to: ['Admin']}
  ]
  entity Cars as projection on db.Cars {
    *,
    case
      when exists maintenances[startDate <= $now and endDate >= $now] then 'UM'
      when exists rentals[startDate <= $now and endDate >= $now]      then 'RE'
      else 'AV'
    end as status_code : String(2),
    status : Association to AvailabilityStatus on status.code = status_code
  } actions {
    @Common.SideEffects #RentEffect : {
        TargetEntities : [
            'rentals',
            'maintenances'
        ],
        TargetProperties : [
            'status_code',
            'status/name',
            'status/criticality'
        ]
    }
    @restrict : [
      { grant: 'EXECUTE', to: ['User', 'Admin'] }
    ]
    action rent(
      startDate   : Date,
      endDate     : Date,
      customer_ID : String(10) @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Customers',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : customer_ID,
                ValueListProperty : 'ID'
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'firstName'
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'lastName'
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'email'
            }
        ]
    }
    ) returns Rentals;

    @Common.SideEffects #MaintenancesEffect : {
        TargetProperties : [
            'status_code',
            'status/name',
            'status/criticality'
        ],
        TargetEntities : [
            'maintenances'
        ]
    }
    @restrict : [
      { grant: 'EXECUTE', to: ['Admin'] }
    ]
    action setToMaintenance(
      startDate   : Date,
      endDate     : Date,
      description : String(200),
      cost        : Decimal(9,2)
    ) returns Maintenance;
  };

  @restrict: [
    { grant: 'READ', to: ['User', 'Admin'] },
    { grant: '*', to: ['Admin'] }
  ]
  entity Category            as projection on db.Category;
  
  @restrict: [
    {
      grant: 'READ',
      to: ['User'],
      where: 'ID = $user.id'
    },
    {
      grant: '*',
      to: ['Admin']
    }
  ]
  entity Customers           as projection on db.Customers;
  
  @restrict: [
    {
      grant: 'READ',
      to: ['User'],
      where: 'customer_ID = $user.id'
    },
    {
      grant: '*',
      to: ['Admin']
    }
  ]
  entity Rentals             as projection on db.Rentals;
  
  @restrict: [
    { grant: 'READ', to: ['User', 'Admin']},
    { grant: '*', to: ['Admin'] }
  ]
  entity Maintenance         as projection on db.Maintenance;
  
  @restrict: [
    { grant: 'READ', to: ['User', 'Admin']},
    { grant: '*', to: ['Admin'] }
  ]
  entity AvailabilityStatus  as projection on db.AvailabilityStatus;

  //dynamically generated entity for the currently authenticated user
  @odata.singleton
  @cds.persistence.skip
  entity Configuration {
      key ID : String;
      userId : String;
      isAdmin : Boolean;
  }

}