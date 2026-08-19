# SAP CAP + Fiori Elements Course Instructions

Resources

- [CAP Documentation](https://cap.cloud.sap/docs/)
- [Fiori Elements Documentation](https://ui5.sap.com/#/topic/03265b0408e2432c9571d6b3feb6b1fd)
- [YouTube playlist](https://www.youtube.com/playlist?list=PL6RpkC85SLQBHPdfHQ0Ry2TMdsT-muECx)

## Module 1 - CAP Foundations (Setup + CDS + Service Basics) ~1 day

Theory

- CAP Documentation ([Intro](http://cap.cloud.sap/docs/get-started/) + [Best Practices](https://cap.cloud.sap/docs/get-started/features#proven-best-practices))
- [OData Basics](https://www.odata.org/getting-started/understand-odata-in-6-steps/)

Practical tasks

0. [SAP CAP tutorial](https://developers.sap.com/tutorials/cp-apm-nodejs-create-service.html)
1. Create a new CAP project with cds init.
2. Create the data model with the exact entities and fields below.

Data model specification

```
Cars
- licensePlate (identifier)
- brand (required)
- model (required)
- year (required)
- dailyPrice (required)
- category (link to Category, required)

Customers
- ID (identifier) - String(10) that would be used later
- driverLicense (unique)
- email (unique)
- firstName (required)
- lastName (required)
- phone
- address

Rentals
- ID (identifier)
- startDate (required)
- endDate (required)
- totalPrice (virtual, calculated as the number of days rented × daily rental price)
- customer (link to Customers, required)
- car (link to Cars, required)

Maintenance
- ID (identifier)
- startDate (required)
- endDate (required)
- description (required)
- cost (required)
- car (link to Cars, required)

AvailabilityStatus (Available, Rented, ...)
- code (identifier)
- name
- criticality (integer, used for semantic coloring)

Category (Sedan, Crossover, ...)
- code (identifier)
- name
```

Define all the entities and their relationships.
Use `cuid` common aspect from `@sap/cds/common` for `Maintenance` and `Rentals` entries.
For `startDate` and `endDate` create an aspect.
Use appropriate data types for each field (e.g., String, Integer, Decimal, Date).

Relationships

- One Customer has many Rentals.
- One Car has many Rentals.
- One Car has many Maintenance records.
- One Car has one Category.
- No relation to Status yet.

3. Add sample data in db/data for each entity.
   - Provide at least 5 cars, 3 customers, 5 rentals, 5 maintenance records.
4. Expose a service with projections for Cars, Customers, Rentals, Maintenance.
5. Run `cds watch` and test OData metadata and queries.

Deliverable

- A running CAP service with correct data model and sample data.

## Module 2 - Service Logic + Validations + Custom Actions ~2 days

Theory

- [CAP event handlers](https://cap.cloud.sap/docs/guides/services/custom-code)
- [Custom actions](https://cap.cloud.sap/docs/get-started/bookshop#custom-actions)

Practical tasks

1. Add 2 custom actions for Cars: `rent` and `setToMaintenance`.
   - `rent` creates a Rental record and returns it.
     - Params: `startDate`, `endDate`, `customer_ID`.
   - `setToMaintenance` creates a Maintenance record and returns it.
     - Params: `startDate`, `endDate`, `description`, `cost`.

   Both actions validate:
   - startDate <= endDate.
   - maintenance and rental periods for the same car do not overlap.

2. Add handler to calculate `totalPrice` of a rent.
3. Add validations for Cars on `CREATE`, `UPDATE`:
   - year is not in the future.
   - year is within last 15 years.
   - dailyPrice > 0 (can be done programmatically or via annotation).
   - category must exist in the Category entity (can be done programmatically or via annotation).
   - Rentals and Maintenance cannot be created directly; custom actions mentioned above should be used (can be done programmatically or via annotation).

4. Add validations for Rentals and Maintenance for `UPDATE`:
   - startDate <= endDate.
   - maintenance and rental periods for the same car do not overlap.

5. Create a calculated `status_code` field in the Cars service projection using a CDS `case` expression:
   - If today is within a maintenance period: code `"UM"` (Under Maintenance).
   - Else if today is within a rental period: code `"RE"` (Rented).
   - Else: code `"AV"` (Available).

   Note: This is done inside the `projection` body of the `Cars` entity in the service CDS file, not in the DB schema and not in JavaScript. Use the `case / when / else / end` expression syntax. To check if a related record covers today, use `exists <association>[<filter>]` with the built-in `$now` pseudo-variable as the reference date.

   Also expose a `status` association derived from the computed `status_code` so the UI can navigate to the full status object.

Deliverable

- CAP service enforces business rules with clear error messages.

## Module 3 - Drafts + Fiori Elements ~2 days

Theory

- [Draft handling in CAP](https://cap.cloud.sap/docs/guides/uis/fiori#draft-support)
- [Fiori Elements overview](https://ui5.sap.com/#/topic/03265b0408e2432c9571d6b3feb6b1fd)

Useful Links

- [Fiori Elements examples by SAP](https://github.com/SAP-samples/fiori-elements-feature-showcase)
- [UI annotations spec](https://github.com/SAP/odata-vocabularies/blob/main/vocabularies/UI.md)

Practical tasks

1. Enable drafts for Cars.
2. Generate a Fiori Elements (List Report floorplan) app using the CAP service as data source using Fiori Application Generator.
3. Configure List Report for Cars:
   - Table name: `Cars`
   - Columns: `licensePlate`, `brand`, `model`, `year`, `dailyPrice`, `status`, `category`
   - Add filters: `status`, `category`, `year`.
   - Add value helps for `category` and `status` filters using the respective entities
     - `status` value help should be a dropdown
     - `category` value help should be a dialog with a table inside
4. Configure Object Page for Cars:
   - Add `model` as Title and `brand` as Description
   - Add 3 sections:
     - General Form with fields: `licensePlate`, `brand`, `model`, `year`, `dailyPrice`, `category`
     - Rentals table with columns: `startDate`, `endDate`, `customer (email)`, `totalPrice`
     - Maintenance table with columns: `startDate`, `endDate`, `description`, `cost`
   - Add `rent` and `setToMaintenance` actions to the header of Object Page
5. Add criticality for status with semantic colors for both list report and object page:
   - Available = green, Rented = yellow, Under Maintenance = red.
6. Add header facets with 2 data points: `dailyPrice` and `status`. They should be visible only in display mode (see `IsActiveEntity` property).
7. Hide custom actions (`rent`, `setToMaintenance`) from Object Page when in edit mode (see `IsActiveEntity` property).
8. Add side effects so status and respective table refresh after `rent` or `setToMaintenance` action.

UI annotations to be used:

- Header Info for titles
- LineItem for Cars list columns
- SelectionFields for list filters
- Facets and Field Groups for Object page sections
- Identification for header actions
- DataPoint for header facets
- SideEffects for action refresh

Deliverable

- List Report for Cars with draft-enabled create flow. Object Page with associated tables, semantic status colors, responsive header facets and action buttons, and live-refreshing status after actions.

## Module 4 - Authentication + Role-Based Access ~1 day

Theory

- [CAP security](https://cap.cloud.sap/docs/guides/security/)

Practical tasks

1. Configure authentication with mocked users for local development. User IDs should match the IDs from Customers table defined earlier, except for admin.
2. Enforce role-based access:
   - User can:
     - read Cars, Categories, Statuses
     - rent a Car
     - read only their Rentals
     - read Customer info about themselves only
   - Admin can do everything

3. Add new singleton entity to the service called `Configuration`. It should return information about the user in the following format

```json
{
  "userId": "admin",
  "isAdmin": true
}
```

4. Based on this entity hide CRUD buttons, `setToMaintenance` action and the whole `Maintenance` section on the UI for Users (explore `$edmJson`/`$Path` syntax).

Deliverable

- Auth-protected app where Users and Admins see a different UI and can only perform actions allowed by their role.

## Module 5 - Advanced Features ~2 days

Theory

- [Fiori Elements Extensions](https://ui5.sap.com/#/topic/a892eb8ae1fb498a9bc6c5194432e820)
- [Custom Events](https://cap.cloud.sap/docs/guides/events/core-concepts#emitters-and-receivers)
- [Consuming External Services](https://cap.cloud.sap/docs/guides/integration/calesi#importing-apis)

Practical tasks

1. Add a Fiori Elements extension. Replace the `rent` button rendered via the annotations with a custom UI button:
   - Register the custom button via `manifest.json` so it appears before the annotation-driven `setToMaintenance` button. The `setToMaintenance` button keeps its existing visibility rules (hidden for non-admins and in edit mode) unchanged.
   - It should open a dialog with `sap.m.DateRangeSelection` to be able to pick the range of dates in the control instead of specifying it in 2 different fields. Also if the button is pressed by `User` we should not show an input for `customer_ID` as it should be taken from the logged-in user automatically.
   - On the backend, update the `rent` action handler: if the caller has the `User` role, ignore the `customer_ID` parameter and derive it from `req.user.id` instead.

2. Add `Rental.Created` event to the service. Emit a custom event after a rental is created:
   - In the `rent` action handler, after inserting the rental, emit a `Rental.Created` as projection on `Rentals` entity.
   - Register a handler for this event that counts how many rentals the car has had in the last 12 months. If the count reaches a threshold of 10, automatically create a scheduled Maintenance record starting the day after the rental ends for 1 day with description "[Auto] Scheduled maintenance after high usage", no cost.
   - Update side effects annotation to refresh `Maintenance` table

3. Consume a mock external S/4 service to provide value helps for `brand` and `model`:
   - An EDMX metadata file for the external `S4VehicleCatalog` service is provided separately. Use `cds import` to generate the CDS interface from it.
   - Wire a local mock implementation and expose both `VehicleBrands` and `VehicleModels` entities through `CarService`.
   - Add `Common.ValueList` on `Cars.brand` pointing to `CarBrands`; show `code` and `name`, output `name` into `brand`.
   - Add `Common.ValueList` on `Cars.model` pointing to `CarModels`; show `code`, `brandName`, and `name`, output `name` into `model`.
   - Connect the two value helps using `ValueListParameterInOut` on `brandName` ↔ `brand`: selecting a brand pre-filters the model list; selecting a model writes the brand name back into `brand`.

   > **Note on remote service limitations**: for external/remote services CAP cannot resolve associations on them using path expressions like `brand.name` — there are no foreign keys in the generated CSN. Because of this, the `brandName` field needed for filtering and display does not exist on `VehicleModels` out of the box. To work around this, denormalize `brandName` into the `CarModels` projection yourself. One approach is to use a `mixin` on `VehicleBrands` to compute `brandName` as a flat column. This is a common pattern when consuming external services that you cannot modify.

Deliverable

- Custom rent dialog with role-aware UX, automated maintenance scheduling via in-process events, and external service consumption with UI value helps.
