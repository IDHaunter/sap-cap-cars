using CarsService as service from '../../srv/cars-service';

 // Object Page for Cars

annotate service.Cars with @(

    // Title text and subtitle at the top of the page
    UI.HeaderInfo : {
        TypeName : 'Car',            // singular entity name
        TypeNamePlural : 'Cars',     // plural entity name
        Title : {
            Value : model,           // dynamic: shows the record's "model" field
        },
        Description : {
            Value : brand,           // dynamic: shows the record's "brand" field
        },
    },

    // Defines compact metric/KPI tiles displayed in the header zone
    UI.HeaderFacets : [
        {
            $Type : 'UI.ReferenceFacet', // This is not a data facet. It is a pointer to another annotation
            ID : 'DailyPriceFacet',
            Target : '@UI.DataPoint#DailyPrice', // The annotation path this facet resolves to
            ![@UI.Hidden] : { $edmJson : { $Not : [ { $Path : 'IsActiveEntity' } ] } },
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'StatusFacet',
            Target : '@UI.DataPoint#Status',
            ![@UI.Hidden] : { $edmJson : { $Not : [ { $Path : 'IsActiveEntity' } ] } },
        },
    ],

    // Target for Facet 1
    UI.DataPoint #DailyPrice : {
        Value : dailyPrice,
        Title : 'Daily Price',
    },

    // Target for Facet 2
    UI.DataPoint #Status : {
        Value : status.name,
        Criticality : status.criticality,
        Title : 'Status',
    },

    // "Edit" / "Save" button 
    UI.UpdateHidden : {
        $edmJson : {
            $Not : {
                $Path : '/Configuration/isAdmin'
            }
        }
    },

    // "Delete" / "Remove" button on a List Page row action or Object Page.
    UI.DeleteHidden : {
        $edmJson : {
            $Not : {
                $Path : '/Configuration/isAdmin'
            }
        }
    },

    // Buttons
    UI.Identification : [
        
        {
            $Type : 'UI.DataFieldForAction', // renders as an action button
            Action : 'CarsService.rent',     // calls the OData action "rent"
            Label : 'Rent',                  // button text
            ![@UI.Hidden] : {                // ← hides the button when true
                $edmJson : {
                    $Not : [
                        { $Path : 'IsActiveEntity' }       // ← path on the DATA RECORD
                    ]
                }
            }
        },

        {
            $Type : 'UI.DataFieldForAction',
            Action : 'CarsService.setToMaintenance',
            Label : 'Set to Maintenance',

            ![@UI.Hidden] : {
                $edmJson : {
                    $Not : {
                        $Path : '/Configuration/isAdmin'    // ← path on a CONFIG MODEL
                    }
                }
            }
        },
    ],

    UI.FieldGroup #GeneratedGroup : {

        $Type : 'UI.FieldGroupType',

        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'licensePlate',
                Value : licensePlate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'brand',
                Value : brand,
            },
            {
                $Type : 'UI.DataField',
                Label : 'model',
                Value : model,
            },
            {
                $Type : 'UI.DataField',
                Label : 'year',
                Value : year,
            },
            {
                $Type : 'UI.DataField',
                Label : 'dailyPrice',
                Value : dailyPrice,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Status',
                Value : status.name,
                Criticality : status.criticality,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Category',
                Value : category.name,
            },
        ],
    },

    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'RentalsFacet',
            Label : 'Rentals',
            Target : 'rentals/@UI.LineItem',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'MaintenanceFacet',
            Label : 'Maintenance',
            Target : 'maintenances/@UI.LineItem',
        },
    ],
);

annotate service.Rentals with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Start Date',
            Value : startDate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'End Date',
            Value : endDate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Customer',
            Value : customer.email,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Total Price',
            Value : totalPrice,
        },
    ],
);

annotate service.Maintenance with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Start Date',
            Value : startDate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'End Date',
            Value : endDate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Description',
            Value : description,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Cost',
            Value : cost,
        },
    ],
);

//  List Report for Cars

annotate service.Cars with @(

    UI.SelectionFields : [
        status_code,
        category_code,
        year,
    ],

    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'License Plate',
            Value : licensePlate,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Brand',
            Value : brand,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Model',
            Value : model,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Year',
            Value : year,
        },
        {
            $Type : 'UI.DataField',
            Label : 'DailyPrice',
            Value : dailyPrice,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Status',
            Value : status.name,
            Criticality : status.criticality,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Category',
            Value : category.name,
        },
    ],

    // "+" (Create / New / Add) button on a List Page (overview page).
    UI.CreateHidden : {
        $edmJson : true
    },
);

// Filters for cars

annotate service.Cars with {
    status_code @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'AvailabilityStatus',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : status_code,
                ValueListProperty : 'code',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'name',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'criticality',
            },
        ],
    } @Common.ValueListWithFixedValues : true;

    category @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Category',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : category_code,
                ValueListProperty : 'code',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'name',
            },
        ],
    };
};