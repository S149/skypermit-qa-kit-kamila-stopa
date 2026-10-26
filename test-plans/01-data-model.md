# Test Plan #TP001

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/01-data-model.md

## Introduction

This plan covers `01-data-model.md` ("Data Model"): seven entities (`Operator`, `Pilot`, `Aircraft`, `Zone`, `FlightRequest`, `ReviewAction`, `AuditLog`), their fields, keys and constraints, the enumerations, the two values that are derived and never stored, and the time handling rules. The matching Supabase schema is kept in `supabase/migrations/`, and the document and the migrations must stay in sync.

## Goals

Verify that the schema and the system behaviour match the data model:

- G1. General rules of the model.
  - G1.1. There are seven entities: `Operator`, `Pilot`, `Aircraft`, `Zone`, `FlightRequest`, `ReviewAction`, `AuditLog`.
  - G1.2. `Zone` is read-only reference data, not written by ordinary product flows. It is populated outside the app (`supabase/seed.sql`), not through a create-zone form.
  - G1.3. `AuditLog` is append-only: no update or delete path is exposed, in the API or in the UI.
  - G1.4. The schema in `supabase/migrations/0001_init.sql` and the additive migrations `0002_flight_request_rule_reference.sql`, `0003_operator_auth.sql`, `0004_operators_id_is_auth_user.sql` match this document; if one changes, the other changes. [OPEN QUESTION: which fields are required or nullable, and which have default values, is not stated except where a field is described as nullable or populated only in some case]
- G2. `Operator`: the account under which everything else is registered. Operators log in through Supabase Auth.
  - G2.1. `id`: UUID, primary key, FK to `auth.users(id)` on delete cascade. It is set at registration to the Supabase Auth user's own id, so the operator row is keyed by its auth identity and is not a separately generated value. `0003_operator_auth.sql` added a second `user_id` column; `0004_operators_id_is_auth_user.sql` collapsed the two back into `id` alone.
  - G2.2. `legal_name`, `phone`, `address_line`, `city`, `postal_code`, `registered_on` (date) exist.
  - G2.3. `national_id` is unique.
  - G2.4. `email` is unique.
  - G2.5. `authorisation_level` is an enumeration (G9.1).
  - G2.6. `status` is an enumeration (G9.2).
- G3. `Pilot`: a certified person, registered under one operator.
  - G3.1. `id`: UUID, primary key. `operator_id`: FK to `Operator`.
  - G3.2. `full_name` exists.
  - G3.3. `national_id` is unique.
  - G3.4. `rating` is an enumeration (G9.3).
  - G3.5. `certified_on` (date) is the source of the derived currency status (G10.1).
  - G3.6. `status` is an enumeration (G9.4).
- G4. `Aircraft`: the drone itself.
  - G4.1. `id`: UUID, primary key. `operator_id`: FK to `Operator`.
  - G4.2. `manufacturer`, `model`, `registered_on` (date) exist.
  - G4.3. `serial_number` is unique.
  - G4.4. `mtom_grams` is the source of the derived weight band (G10.2).
  - G4.5. `status` is an enumeration (G9.5).
- G5. `Zone`: a named airspace volume (read-only reference data, G1.2).
  - G5.1. `code`: text, primary key. `name` exists.
  - G5.2. `zone_class` is an enumeration (G9.6).
  - G5.3. `ceiling_metres` exists.
  - G5.4. `permitted_bands` holds the weight bands that may fly in the zone, from the fixed `C0`-`C3` taxonomy (`docs/06-business-rules.md` §3).
  - G5.5. `required_authorisation_level` is an enumeration from the same set as `Operator.authorisation_level` (G9.1).
  - G5.6. `curfew_start` and `curfew_end` (time) exist.
  - G5.7. `active` (boolean) exists.
- G6. `FlightRequest`: a single requested flight, the centre of gravity of the system.
  - G6.1. `id`: UUID, primary key. FKs: `operator_id` to `Operator`, `pilot_id` to `Pilot`, `aircraft_id` to `Aircraft`, `zone_code` to `Zone`.
  - G6.2. `window_start` is timestamptz, UTC. `window_end` is timestamptz, UTC, and must be after `window_start`.
  - G6.3. `requested_altitude_metres` exists.
  - G6.4. `flight_purpose` is free text, capped at 2,000 characters. The cap is enforced in both the API layer and the DB (`char_length` check constraint).
  - G6.5. `state` is an enumeration defined in `02-state-machine.md`.
  - G6.6. `rejection_reason` is populated only on rejection.
  - G6.7. `failing_gate` is populated only on gate-failure rejection; it is an enumeration (G9.7).
  - G6.8. `rule_reference` is populated only on gate-failure rejection, alongside `failing_gate`. It was added in `0002_flight_request_rule_reference.sql` so that a rejected request's rule citation survives past the original `422` response, per the detail view in `docs/04-frontend-spec.md`.
  - G6.9. `submitted_at`, `decided_at` and `decided_by` (reviewer identity string) exist.
- G7. `ReviewAction`: audit record of one reviewer decision.
  - G7.1. `id`: UUID, primary key. `flight_request_id`: FK to `FlightRequest`. `created_at` exists.
  - G7.2. `reviewer_id` comes from the `X-Reviewer-Id` header.
  - G7.3. `action` is an enumeration (G9.8).
  - G7.4. `note` is required when `action` is `REJECT`.
- G8. `AuditLog`: record of every state transition, on any entity. Fields: `id` (UUID, primary key), `entity_type` (for example `"FlightRequest"`), `entity_id`, `from_state` (nullable, for creation events), `to_state`, `actor`, `created_at`.
- G9. Enumerations hold exactly their documented values.
  - G9.1. `Operator.authorisation_level` (and `Zone.required_authorisation_level`): `L1`, `L2`, `L3`, in ascending privilege.
  - G9.2. `Operator.status`: `ACTIVE`, `SUSPENDED`.
  - G9.3. `Pilot.rating`: `R_BASIC`, `R_ADVANCED`, `R_BVLOS`.
  - G9.4. `Pilot.status`: `ACTIVE`, `INACTIVE`.
  - G9.5. `Aircraft.status`: `ACTIVE`, `RETIRED`.
  - G9.6. `Zone.zone_class`: `OPEN`, `CONTROLLED`, `RESTRICTED`.
  - G9.7. `FlightRequest.failing_gate`: `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`.
  - G9.8. `ReviewAction.action`: `APPROVE`, `REJECT`.
- G10. Derived values are computed at read time and never stored. Persisting either one creates a staleness bug the moment its input field is corrected.
  - G10.1. Pilot currency, derived from `certified_on`: computed at the moment it is checked, and exposed as a derived field on the pilot `GET` endpoint.
  - G10.2. Aircraft weight band, derived from `mtom_grams`: computed at read time. Correcting a registered mass recalculates the band immediately; flight authorisations already issued are not revisited.
  - G10.3. The actual thresholds for both are in `docs/06-business-rules.md` §2-§3 (pilot currency: 18 months, `OH-1` §2.3; weight bands: `OH-1` §3).
- G11. Time handling.
  - G11.1. `window_start` and `window_end` are stored and compared in UTC.
  - G11.2. Zone availability (curfew) is defined against local zone time. The conversion from UTC happens at evaluation time, inside the `TIME_WINDOW` gate, never at write time.

## Risks

- R1. The document and the migrations drifting apart (G1.4).
- R2. `Operator.id` not equal to the Supabase Auth user id (a separately generated value), or the second `user_id` column added by `0003` still present (G2.1).
- R3. A derived value (pilot currency, weight band) persisted and going stale (G10).
- R4. An update or delete path exposed for `AuditLog` (G1.3).
- R5. The `flight_purpose` cap enforced in only one of the API layer and the DB (G6.4).
- R6. `Zone` written by an ordinary product flow (G1.2).
- R7. The curfew converted to UTC at write time instead of at evaluation time (G11.2).
- R8. The rule citation of a rejected request lost after the original `422` response (G6.8).

## In Scope / Out Of Scope

### In Scope

- S1. The seven entities, their fields, keys, uniqueness and foreign keys (G1-G8)
- S2. Enumerations and their values (G9)
- S3. Derived, never stored values (G10)
- S4. Time handling (G11)
- S5. Schema and document sync with `supabase/migrations/0001`-`0004` (G1.4)

### Out Of Scope

- O1. Operator login and authorisation behaviour: `01-data-model.md` (entity `Operator`) hands it to `docs/03-api-contract.md`, section "Authentication & authorisation". That document is not part of the input.
- O2. The values of the pilot currency threshold and the weight band thresholds, and the meaning of the `C0`-`C3` taxonomy: `01-data-model.md` (sections "Derived, never stored" and entity `Zone`) hands them to `docs/06-business-rules.md` §2-§3. That document is not part of the input.
- O3. The values of `FlightRequest.state`: `01-data-model.md` (entity `FlightRequest`, field `state`) hands them to `02-state-machine.md`. That document is not part of the input.

## Entry Criteria / Environments

### Entry Criteria

- EN1. Requirements, test goals are clear for testers
- EN2. All test environments and test tools are ready and can be used
- EN3. Test data / test documentation are available and can be used
- EN4. Test cases are ready and can be used

### Environments

- OS: Microsoft Windows 11 Pro (version 10.0.26200)
- Browser: Chrome (latest version)

## Exit Criteria / Tools

### Exit Criteria

- EX1. Test time was finished
- EX2. More than 85% of all test cases were passed
- EX3. Test Report is ready and can be provided to stakeholders

### Tools

- SVC: GitHub
- Test design: Claude Code
- Supabase (Supabase Auth, `auth.users`, migrations `supabase/migrations/0001`-`0004`, `supabase/seed.sql`), as named in the documentation
- Pilot `GET` endpoint (derived currency status), as named in the documentation

## Schedule and Estimations / People

### Schedule and Estimations

- Start date: [OPEN QUESTION: not provided]
- End date: [OPEN QUESTION: not provided]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation not provided]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation not provided]
- Testing: [OPEN QUESTION: estimation not provided]
- Create Test Report: [OPEN QUESTION: estimation not provided]

### People

Kamila Stopa, Senior Test Engineer
