namespace sap.cars.test;

using { cuid, managed, Currency } from '@sap/cds/common';

// Define the custom type with enum values
type OrderStatus : String enum {
    New        = 'N';
    InProcess  = 'P';
    Completed  = 'C';
    Cancelled  = 'X';
}

type PaymentMethod : String enum {
    Cash       = 'C';
    BankCard   = 'B';
    PayPal     = 'P';
}

aspect Tenant {
  tenantId : String(8) @mandatory not null;
}

entity Order: cuid, managed, Tenant {

    number : Integer @mandatory not null;

    @title: 'Order Status'
    status: OrderStatus @mandatory default 'N' not null;

    // Virtual or computed field to map status to UI criticality numbers:
    // 0 = Neutral/None, 1 = Negative/Red, 2 = Critical/Yellow, 3 = Positive/Green
    virtual criticality : Integer;

    payment : Composition of one Payment on payment.order = $self;

    orderItems: Composition of many OrderItem on orderItems.order = $self;
}

entity OrderItem {
    key order          : Association to Order;
    key positionNumber : Integer @mandatory not null;

    itemIncome : Association to ItemIncome;

    count              : Decimal(9, 3);
}

entity Payment {
    key order     : Association to Order;
    
    amount        : Decimal(15, 2) @mandatory;
    currency      : Currency @mandatory;
    paymentMethod : PaymentMethod;
    paidAt        : Timestamp;
}

entity ItemIncome {
    key documentId     : UUID ;
    key itemNumber     : Integer ;

    currency      : Currency @mandatory;
    @title: 'Unit Price'                                         // label 
    @description: 'Price of one unit in the selected currency'   // hint 
    @Measures.ISOCurrency: currency.code
    price              : Decimal(15, 2);

    count              : Decimal(9, 3);
}