using CarsService as service from '../../srv/cars-service';

 // Object Page for Cars

annotate service.Cars with @(
    UI.HeaderInfo : {
        TypeName : 'Car',
        TypeNamePlural : 'Cars',
        Title : {
            Value : model,
        },
        Description : {
            Value : brand,
        },
    },

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