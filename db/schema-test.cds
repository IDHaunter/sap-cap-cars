namespace sap.cars.test;

using { cuid, managed, Currency } from '@sap/cds/common';

// Define the custom type with enum values
type OrderStatus : String enum {
    New        = 'N';
    InProcess  = 'P';
    Completed  = 'C';
    Cancelled  = 'X';
}

aspect Tenant {
  tenant_ID : String(8) @mandatory;
}

entity Order: cuid, managed, Tenant {
    number : Integer @mandatory;
    status: OrderStatus @mandatory default 'N';

    // Virtual or computed field to map status to UI criticality numbers:
    // 0 = Neutral/None, 1 = Negative/Red, 2 = Critical/Yellow, 3 = Positive/Green
    virtual criticality : Integer;

    orderItems: Composition of many OrderItem on orderItems.order = $self;
}

entity OrderItem {
    key order          : Association to Order;
    key positionNumber : Integer @mandatory;
    @Measures.ISOCurrency: currency
    price              : Decimal(15, 2);
    count              : Decimal(9, 3);
    currency           : Currency @mandatory;
}