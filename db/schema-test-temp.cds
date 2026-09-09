namespace sap.cars.students;

using { cuid, Currency } from '@sap/cds/common';

entity Students : cuid
{
    name : String(100) not null;
    email : String(100);
}

@assert.unique: {
  courseName: [name]
}
entity Courses : cuid
{
    name : String(100) @mandatory;
    currency : Currency @mandatory;
    @Measures.ISOCurrency: currency.code
    cost : Decimal(15,2);
}

entity Enrollments : cuid
{
    student : Association to one Students;
    course : Association to one Courses;
    registeredAt : DateTime not null;
    status : EnrollmentStatus not null default 'A';
    certificate : Composition of one Certificates on certificate.enrollment = $self;
}

type EnrollmentStatus : String enum
{
    Active = 'A';
    Completed = 'C';
    Cancelled = 'X';
}

@assert.unique: {
  certificateNumber: [number]
}
entity Certificates 
{
    issuedAt : DateTime not null @mandatory;
    number : Integer not null @mandatory;
    key enrollment : Association to one Enrollments;
}
