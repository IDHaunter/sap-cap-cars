# CLAUDE.md

## Project

`sap-cap-cars` — a learning/practice project for the SAP CAP + Fiori Elements course. It's a car rental app built step by step following `course_instructions.md`, with a running setup log in `how_to_sap_cap.md`.

## Tech Stack

- **SAP CAP (Cloud Application Programming Model)** on **Node.js**
- **CDS** for data modeling (`db/schema.cds`) and service definitions (`srv/*.cds`)
- **SAP Fiori Elements** for the UI (`app/`)
- **SQLite** (`@cap-js/sqlite`) as the local/dev database
- CDS tooling: `@sap/cds-dk`

## Project Structure

- `db/` — CDS data model (`schema.cds`) and CSV seed data (`db/data/<namespace>-<entity>.csv`)
- `srv/` — OData service definitions (`.cds`) and Node.js service logic (`.js`)
- `app/` — Fiori Elements UI apps
- `course_instructions.md` — full course curriculum/spec to follow (do not override it)
- `how_to_sap_cap.md` — step-by-step log of what's been done so far

## Working Conventions

- **Follow SAP best practices** for CAP and Fiori development (naming conventions, CDS modeling idioms, service layering, use of annotations over custom code where possible). Reference the [CAP Documentation](https://cap.cloud.sap/docs/) and its best-practices guidance when in doubt.
- CSV seed files must be named `<namespace>-<entity>.csv` matching `schema.cds`, with all columns present.
- Service Definition & Implementation: The CDS service definition and its custom JavaScript/TypeScript handler must share the exact same base name and reside in the same folder.
Example: service.cds and service.js (or service.ts)
- UI Annotations Isolation: All Fiori/UI annotations must be separated into a dedicated CDS file using the -ui suffix. Example: service-ui.cds
- Common commands: `cds watch` (run dev server), `cds deploy --to sqlite` (rebuild local DB).
