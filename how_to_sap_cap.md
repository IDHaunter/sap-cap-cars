# HOW TO SAP CAP FROM SCRATCH

## INITIAL STEPS

1. Install Node.js and npm 

- https://nodejs.org/en/download

2. Install SAP CAP CLI

- npm i -g @sap/cds-dk

3. Create a new project

- cds init sap-cap-cars

4. initialize git and link to remote repo

- git init
- git remote add origin git@github-idhaunter:IDHaunter/sap-cap-cars.git 

5. install extension "SAP CDS" for Visual Studio Code (ctrl+shif+x) and extensions

- SAP Fiori Tools - Application Modeler
- SAP Fiori Tools - Guided Development
- SAP Fiori Tools - Service Modeler
- SAP Fiori Tools - XML annotation Language Server
- SAP Fiori Tools - Extension Pack

6. Correct readme.md and create initial git commit

- git add -A
- git commit -m "Initial commit"
- git push --set-upstream origin main

## DB SCHEMA (SQLite)

7. Create an independent git branch

- git checkout -b "feat/db-schema-sqlite"
- git push --set-upstream origin feat/db-schema-sqlite

8. create a DB schema ( db/schema.cds ) 

- There describe the entities and add associations.

9. to populate schema with data create a data folder in db foldder and add there `namespace-entity.scv` files

- WARNING: `<namespace>` and `<entity>` must be taken from schema.cds file. All columns must present.

10. Install sqlite as develop dependency (not regular sqlite3)

- npm install @cap-js/sqlite -D

11. Prepare database:

- cds deploy --to sqlite

12. Try to compile and see the result at http://localhost:4004

- cds watch

13. Install any DB viewer like DBeaver and check DB entries of db.sqlite

## ODATA + custom exits

14. Create ODATA layer: 

- srv/cars-service.cds

15. Create a nodeJS layer with addintional logic:

- srv/cars-service.js

16. Check ODATA layer:

- cds watch
- http://localhost:4004/odata/v4/cars/$metadata
- http://localhost:4004/odata/v4/cars/Cars
- http://localhost:4004/odata/v4/catalog/Customers
- ...

## ADDITIONAL

### Install HANA CLI

npm install -g hana-cli
hana-cli --version

### Install CF client

brew trust cloudfoundry/tap
brew install cloudfoundry/tap/cf-cli@8
