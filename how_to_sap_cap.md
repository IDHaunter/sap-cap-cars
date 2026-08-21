# HOW TO SAP CAP FROM SCRATCH

## Module 1 - CAP Foundations (Setup + CDS + Service Basics)

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

14. Use https://excalidraw.com/ to see the data in a nice way

15. Create ODATA layer with projections for Cars, Customers, Rentals, Maintenance:

- srv/cars-service.cds

16. Check ODATA layer:

- cds watch
- http://localhost:4004/odata/v4/cars/$metadata
- http://localhost:4004/odata/v4/cars/Cars
- http://localhost:4004/odata/v4/catalog/Customers
- ...

17. Commit, push and merge to main

- git add -A
- git commit -m "feat: db schema complete"
- git checkout main
- git merge feat/db-schema-sqlite
- git push

## Module 2 - Service Logic + Validations + Custom Actions

16. Create an independent git branch for the service logic:

- git checkout -b "feat/odata-service"
- git push --set-upstream origin feat/odata-service

17. Create a nodeJS layer with addintional logic and add 2 custom actions for Cars: `rent` and `setToMaintenance`:

- srv/cars-service.js

18. Add additional configuration in package.json to have persistant database instead of in-memory database:

```
  "cds": {
    "requires": {
      "db": {
        "kind": "sqlite",
        "credentials": {
          "url": "db.sqlite"
        }
      }
    }
  }
```

- cds deploy --to sqlite:db.sqlite

19. Create a postMan collection and test new fuctionalities:

- js_sap-cap-cars.postman_collection.json

20. Create a handler for rental price calculation this.after('READ', 'Rentals' ...) and others

21. Create tests for the service in tests/cars.test.js:

- npm add -D @cap-js/cds-test
- npm install
- in pakage.json add a script like this:

```
  "scripts": {
    "test": "cds test --profile test"
  }
```

- in pakage.json create a test in memory configuration like this:

```
  "cds": {
    "requires": {
      "db": {
        "kind": "sqlite",
        "credentials": {
          "url": "db.sqlite"
        }
      }
    },
    "[test]": {
      "requires": {
        "db": {
          "kind": "sqlite",
          "credentials": {
            "url": ":memory:"
          }
        }
      }
    }
  }
```

- nmp test

22. Create a Hook for claude to automaticaly run test on every change

## Module 3 - Drafts + Fiori Elements

23. Add draft annotation @odata.draft.enabled in cars-service.cds and rebuid database, check the service and databse: new entities and tables must be created automatically

- cds deploy --to sqlite:db.sqlite

24. Create fiori app using Fiori Application Generator

- Ctrl+Shift+P → Fiori: Open Application Generator
- List Report Object Page
- Use a Local CAP Project
- sap.cap.cars (fiori namespace)
- /Users/user/dev/js/sap-cap-cars/app  (folder for app)
- accept Virtual Endpoints = Yes and set others to No
- try "cds watch"

25. After creation you may face with versions problems like "This application uses '@sap/cds' version 6.8, which is not compatible with the installed '@sap/cds-dk' version 10." then upgrade:

- npm install @sap/cds@latest

26. Run fiori app:

- cds watch ( at http://localhost:4004 you will see the links to all fiori apps)

## ADDITIONAL - BTP DEPLOYMENT

### Install HANA CLI

npm install -g hana-cli
hana-cli --version

### Install CF client

brew trust cloudfoundry/tap
brew install cloudfoundry/tap/cf-cli@8
