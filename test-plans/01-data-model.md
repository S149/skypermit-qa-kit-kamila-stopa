# Test Plan #TP001

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: `../skypermit/docs/01-data-model.md`

## Introduction
The data model consists of seven entities: Operator, Pilot, Aircraft, Zone, FlightRequest, ReviewAction and AuditLog. Zone is read-only reference data (not written by ordinary product flows). AuditLog is append-only. The matching Supabase schema is in `supabase/migrations/0001_init.sql` plus the additive migrations `0002_flight_request_rule_reference.sql`, `0003_operator_auth.sql` and `0004_operators_id_is_auth_user.sql`. The document and these files must stay in sync: if one is changed, the other must be changed too. Operators log in through Supabase Auth.

## Goals
- Verify that the schema matches the documented entities, fields, primary keys, foreign keys, uniqueness constraints and enumerations, and that the document and the migrations stay in sync.
- Verify Operator: `id` is a UUID primary key and a foreign key to `auth.users(id)` with on delete cascade, set at registration to the Supabase Auth user's own id (the operator row is keyed by its auth identity, not by a separately generated value), with no separate `user_id` column (`0003` added one, `0004` collapsed the two back into `id` alone). Other fields: `legal_name`, `national_id` (unique), `email` (unique), `phone`, `address_line`, `city`, `postal_code`, `authorisation_level`, `registered_on` (date), `status`.
- Verify Pilot: `id` (UUID, primary key), `operator_id` (FK to Operator), `full_name`, `national_id` (unique), `rating`, `certified_on` (date, source of the derived currency status), `status`. A pilot is registered under one operator.
- Verify Aircraft: `id` (UUID, primary key), `operator_id` (FK to Operator), `manufacturer`, `model`, `serial_number` (unique), `mtom_grams` (source of the derived weight band), `registered_on` (date), `status`.
- Verify Zone: `code` (text, primary key), `name`, `zone_class`, `ceiling_metres`, `permitted_bands`, `required_authorisation_level`, `curfew_start` (time), `curfew_end` (time), `active` (boolean). `permitted_bands` holds only weight bands from the fixed `C0`–`C3` taxonomy. `required_authorisation_level` is from the same set as `Operator.authorisation_level`.
- Verify that Zone is read-only reference data: populated and edited outside ordinary app flows, not written by ordinary product flows and not created via a create-zone form.
- Verify FlightRequest: `id` (UUID, primary key); FKs `operator_id`, `pilot_id`, `aircraft_id`, `zone_code`; `window_start` and `window_end` (timestamptz, UTC); `requested_altitude_metres`; `flight_purpose`; `state`; `rejection_reason`; `failing_gate`; `rule_reference`; `submitted_at`; `decided_at`; `decided_by` (reviewer identity string).
- Verify ReviewAction (audit record of one reviewer decision): `id` (UUID, primary key), `flight_request_id` (FK to FlightRequest), `reviewer_id` (taken from the `X-Reviewer-Id` header), `action`, `note`, `created_at`.
- Verify AuditLog (record of every state transition, on any entity): `id` (UUID, primary key), `entity_type` (for example `"FlightRequest"`), `entity_id`, `from_state`, `to_state`, `actor`, `created_at`.
- Verify uniqueness of `Operator.national_id`, `Operator.email`, `Pilot.national_id` and `Aircraft.serial_number`.
- Verify that each enumeration holds exactly its documented values: `Operator.authorisation_level` (`L1`, `L2`, `L3`, ascending privilege), `Operator.status` (`ACTIVE`, `SUSPENDED`), `Pilot.rating` (`R_BASIC`, `R_ADVANCED`, `R_BVLOS`), `Pilot.status` (`ACTIVE`, `INACTIVE`), `Aircraft.status` (`ACTIVE`, `RETIRED`), `Zone.zone_class` (`OPEN`, `CONTROLLED`, `RESTRICTED`), `FlightRequest.failing_gate` (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`), `ReviewAction.action` (`APPROVE`, `REJECT`).
- Verify the conditional rules: `rejection_reason` is populated only on rejection; `failing_gate` is populated only on gate-failure rejection; `rule_reference` is populated only on gate-failure rejection, alongside `failing_gate`; `ReviewAction.note` is required when `action` is `REJECT`; `AuditLog.from_state` is nullable (creation events).
- Verify that `window_end` must be after `window_start`.
- Verify that `rule_reference` is persisted on the `FlightRequest` (added in `0002`), so a rejected request's rule citation survives past the original `422` response.
- Verify that pilot currency and aircraft weight band are derived at read time and never stored. Pilot currency is computed at the moment it is checked and exposed as a derived field on the pilot `GET` endpoint.
- Verify that correcting a registered `mtom_grams` recalculates the weight band immediately and does not revisit flight authorisations already issued.
- Verify that `window_start` / `window_end` are stored and compared in UTC, that curfew is defined against local zone time, and that the UTC conversion happens at evaluation time inside the `TIME_WINDOW` gate, never at write time.
- Verify that `flight_purpose` is free text capped at 2,000 characters, enforced in both the API layer and the DB (`char_length` check constraint).
- Verify that AuditLog records every state transition on any entity and that no update or delete path for it is exposed in the API or the UI.
- [OPEN QUESTION: the document gives no data type, format, length limit or nullability for fields other than `flight_purpose` (for example `legal_name`, `national_id`, `phone`, `address_line`, `ceiling_metres`, `mtom_grams`, `requested_altitude_metres`); what must be validated]
- [OPEN QUESTION: the document does not say whether `ReviewAction.note` is allowed or ignored when `action` is `APPROVE`]
- [OPEN QUESTION: the document does not say when `submitted_at`, `decided_at` and `decided_by` are populated, or whether they are cleared]
- [OPEN QUESTION: curfew is evaluated against "local zone time", but the document does not say which timezone each zone uses]
- [OPEN QUESTION: the document does not say how `permitted_bands` is stored (a list or a single text value) or whether the `C0`–`C3` restriction is enforced by a DB constraint]

## Risks
- The document and the migrations drift apart.
- Pilot currency or weight band gets persisted and becomes stale when its input field (`certified_on`, `mtom_grams`) is corrected.
- Correcting a registered mass recalculates the weight band immediately, but flight authorisations already issued are not revisited.
- Curfew is defined against local zone time; converting from UTC at write time instead of at evaluation time gives wrong results.
- `Operator.id` is the Supabase Auth user id, not a separately generated value; a leftover `user_id` column (from `0003`) or a mismatching `id` breaks the link to `auth.users`.
- The `flight_purpose` limit is enforced in only one of the two layers.
- A `rule_reference` is lost after the original `422` response if it is not persisted (the reason `0002` exists).
- An update or delete path for AuditLog is exposed in the API or the UI.
- Zone data is written through an ordinary product flow or a create-zone form.
- A conditional field (`rejection_reason`, `failing_gate`, `rule_reference`) is populated outside the case the document allows.

## In Scope / Out Of Scope
**In Scope:**
- **Entities and fields:** Operator, Pilot, Aircraft, Zone, FlightRequest, ReviewAction, AuditLog, with the fields, keys, constraints and notes listed in Goals.
- **Enumerations:** the eight enumerations listed in Goals.
- **Derived, never stored:** pilot currency (from `certified_on`) and aircraft weight band (from `mtom_grams`).
- **Time handling:** UTC storage and comparison of the flight window; UTC to local zone time conversion at evaluation time, inside the `TIME_WINDOW` gate, never at write time.
- **Constraints on text:** `flight_purpose` cap of 2,000 characters in both the API layer and the DB.
- **Append-only and read-only data:** AuditLog (no update or delete path in the API or the UI) and Zone (reference data).
- **Schema/document sync:** `supabase/migrations/0001_init.sql`, `0002_flight_request_rule_reference.sql`, `0003_operator_auth.sql`, `0004_operators_id_is_auth_user.sql` against this document.

**Out Of Scope** (each item is handed to another document by `01-data-model.md`):
- The actual thresholds for pilot currency (18 months, `OH-1` §2.3) and weight bands (`OH-1` §3): `docs/06-business-rules.md` §2–§3 (section "Derived, never stored").
- The `C0`–`C3` weight band taxonomy used by `Zone.permitted_bands`: `docs/06-business-rules.md` §3 (entity "Zone").
- The FlightRequest `state` values and transitions: `02-state-machine.md` (entity "FlightRequest").
- Authentication and authorisation of operators: `docs/03-api-contract.md`, "Authentication & authorisation" section (entity "Operator").
- The detail view of a rejected request: `docs/04-frontend-spec.md` (field `rule_reference`).
- Populating and editing zones: `supabase/seed.sql` (entity "Zone").

## Entry Criteria / Environments
Entry Criteria:
1. Requirements, test goals are clear for testers
2. All test environments and test tools are ready and can be used
3. Test data / test documentation are available and can be used
4. Test cases are ready and can be used

Environments:
- OS: Microsoft Windows 11 Pro (10.0.26200)
- Browser: Chrome (latest version)

## Exit Criteria / Tools
Exit Criteria:
1. Test time was finished
2. More than 85% of all test cases were passed
3. Test Report is ready and can be provided to stakeholders

Tools:
- SVC: GitHub
- Test design: Claude Code
- Supabase (database schema and migrations, Supabase Auth)
- API layer

## Schedule and Estimations / People
Schedule and Estimations:
- Start date / End date: [OPEN QUESTION: start and end dates]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation]
- Testing: [OPEN QUESTION: estimation]
- Create Test Report: [OPEN QUESTION: estimation]

People: Kamila Stopa, Senior Test Engineer
