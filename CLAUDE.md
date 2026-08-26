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
- `course_instructions.md` — full course description (do not use it, it is for humans)
- `how_to_sap_cap.md` — step-by-step log of what's been done so far (do not use it, it is for humans)

## Working Conventions

- **Follow SAP best practices** for CAP and Fiori development (naming conventions, CDS modeling idioms, service layering, use of annotations over custom code where possible). Reference the [CAP Documentation](https://cap.cloud.sap/docs/) and its best-practices guidance when in doubt.
- CSV seed files must be named `<namespace>-<entity>.csv` matching `schema.cds`, with all columns present.
- Service Definition & Implementation: The CDS service definition and its custom JavaScript/TypeScript handler must share the exact same base name and reside in the same folder.
Example: service.cds and service.js (or service.ts)
- Common commands: `cds watch` (run dev server), `cds deploy --to sqlite` (rebuild local DB).
- Do not make commits ("git add" and "git commit" and "git push" are prohibited).  

## Custom Action Handler Style

- Register handlers via `module.exports = cds.service.impl(async function () { ... })`, destructuring needed entities from `this.entities` once at the top.
- Destructure the bound entity's key directly from `req.params[0]` (e.g. `const { licensePlate } = req.params[0]`), and the action's parameters from `req.data`.
- Use `req.reject(statusCode, message)` for validation failures, not `req.error(...)` — `reject` throws immediately and halts the handler, so no manual `return` is needed after it.
- Extract shared validation logic (e.g. date-range checks, overlap checks) into small top-level helper functions with a short JSDoc comment describing intent, and call them from each handler.
