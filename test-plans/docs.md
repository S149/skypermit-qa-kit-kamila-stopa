# Test Plan #TP004

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: `../skypermit/docs/` (`01-data-model.md`, `02-state-machine.md`, `03-api-contract.md`, `04-frontend-spec.md`, `05-open-questions.md`, `06-business-rules.md`, `07-clarifications.md`, `08-uml-diagrams.md`)

## Introduction
Skypermit is an application for requesting and approving drone flights. Operators register and log in (Supabase Auth, session cookie), register their pilots and aircraft, and create flight requests in a zone and time window. A request is checked by a fixed pipeline of four gates (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`), after which it goes to a reviewer queue where a reviewer (identified only by the `X-Reviewer-Id` header, not a login) approves or rejects it. The documentation describes seven entities (Operator, Pilot, Aircraft, Zone, FlightRequest, ReviewAction, AuditLog), a seven-state request lifecycle, a REST API under `/api/v1` (16 numbered endpoints; authentication endpoints unnumbered, with `POST /operators` doubling as registration and endpoint 1; `GET /pilots` and `GET /aircraft` added later), a two-role frontend (operator portal and reviewer queue) with a `data-testid` contract, and the business rules behind each gate. `06-business-rules.md` is a compilation of rules from source documents (`OH-1` v2.0, `ZC-2026.1` as amended by `A-7`, `TSD-4`, `API-REF`) and is a companion to a document called "SkyPermit — System Reference" (which defines persisted fields, states, endpoints and response contracts but excludes decision logic). It reflects the corpus as of the dates of its sources: `TSD-4` and `ZC-2026.1` effective 2026-01-01, `A-7` effective 2026-02-10, `OH-1` v2.0 effective 2026-01-15. `07-clarifications.md` records the rules owner's answers and governs where it conflicts with the literal wording of `06-business-rules.md`; `05-open-questions.md` is the canonical status of open questions. `08-uml-diagrams.md` is derived from `01-data-model.md` and `02-state-machine.md`; if they disagree, those two are the source of truth. This plan covers the whole application as described in all eight documents.

## Goals
**Data model (`01-data-model.md`)**
- Verify that the schema matches the documented entities (Operator, Pilot, Aircraft, Zone, FlightRequest, ReviewAction, AuditLog), fields, primary keys, foreign keys, uniqueness constraints and enumerations, and that the document and the migrations (`0001_init.sql`, `0002_flight_request_rule_reference.sql`, `0003_operator_auth.sql`, `0004_operators_id_is_auth_user.sql`) stay in sync.
- Verify that `Operator.id` is the Supabase Auth user's id (UUID, FK to `auth.users(id)`, on delete cascade), with no separate `user_id` column.
- Verify the entity fields: Operator (`legal_name`, `national_id`, `email`, `phone`, `address_line`, `city`, `postal_code`, `authorisation_level`, `registered_on`, `status`); Pilot (`operator_id`, `full_name`, `national_id`, `rating`, `certified_on`, `status`); Aircraft (`operator_id`, `manufacturer`, `model`, `serial_number`, `mtom_grams`, `registered_on`, `status`); Zone (`code` text primary key, `name`, `zone_class`, `ceiling_metres`, `permitted_bands`, `required_authorisation_level`, `curfew_start`, `curfew_end`, `active`); FlightRequest (`operator_id`, `pilot_id`, `aircraft_id`, `zone_code`, `window_start`, `window_end`, `requested_altitude_metres`, `flight_purpose`, `state`, `rejection_reason`, `failing_gate`, `rule_reference`, `submitted_at`, `decided_at`, `decided_by`); ReviewAction (`flight_request_id`, `reviewer_id` from the `X-Reviewer-Id` header, `action`, `note`, `created_at`); AuditLog (`entity_type`, `entity_id`, `from_state`, `to_state`, `actor`, `created_at`).
- Verify uniqueness of `Operator.national_id`, `Operator.email`, `Pilot.national_id` and `Aircraft.serial_number`.
- Verify the enumerations: `Operator.authorisation_level` (`L1`, `L2`, `L3`, ascending privilege), `Operator.status` (`ACTIVE`, `SUSPENDED`), `Pilot.rating` (`R_BASIC`, `R_ADVANCED`, `R_BVLOS`), `Pilot.status` (`ACTIVE`, `INACTIVE`), `Aircraft.status` (`ACTIVE`, `RETIRED`), `Zone.zone_class` (`OPEN`, `CONTROLLED`, `RESTRICTED`), `Zone.required_authorisation_level` (same set as `Operator.authorisation_level`), `FlightRequest.failing_gate` (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`), `ReviewAction.action` (`APPROVE`, `REJECT`).
- Verify the conditional rules: `rejection_reason` populated only on rejection; `failing_gate` and `rule_reference` populated only on gate-failure rejection, together; `ReviewAction.note` required when `action` is `REJECT`; `AuditLog.from_state` nullable for creation events; `window_end` after `window_start`.
- Verify that `rule_reference` is persisted on the FlightRequest (`0002`), so the citation survives past the original `422` response.
- Verify that pilot currency and aircraft weight band are derived at read time and never stored; correcting `mtom_grams` recalculates the band immediately and does not revisit flight authorisations already issued; pilot currency is exposed as a derived field on the pilot `GET` endpoint.
- Verify that `window_start` / `window_end` are stored and compared in UTC and the UTC-to-zone-local conversion for curfew happens at evaluation time inside the `TIME_WINDOW` gate, never at write time (there is no stored "curfew in UTC" value to drift out of sync with the zone record).
- Verify that `flight_purpose` is free text limited to 2,000 characters in both the API layer and the DB (`char_length` check constraint).
- Verify that Zone is read-only reference data (populated outside ordinary app flows, `supabase/seed.sql`, no create-zone form) and that AuditLog is append-only with no update or delete path in the API or the UI.
- [OPEN QUESTION: `01-data-model.md` says `failing_gate` and `rule_reference` are populated only on gate-failure rejection, but `02-state-machine.md` says `REJECTED` (including refusal by a reviewer) has `failing_gate` and `rejection_reason` populated, and `08-uml-diagrams.md` says `failing_gate` + `rejection_reason` (+ `rule_reference`) are populated on gate failure; what is `failing_gate` after a reviewer rejection]
- [OPEN QUESTION: `01-data-model.md` gives no data type, format, length limit or nullability for fields other than `flight_purpose`; whether `ReviewAction.note` is allowed on `APPROVE`; when `submitted_at`, `decided_at` and `decided_by` are populated; how `permitted_bands` is stored]

**State machine (`02-state-machine.md`)**
- Verify that a `FlightRequest` is in exactly one of seven states (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`) at any time, and that the diagram and the transition table agree.
- Verify every legal transition: `DRAFT`→submit→`SUBMITTED`→`UNDER_REVIEW` (gates pass, automatic) or `REJECTED` (gates fail, automatic); `UNDER_REVIEW`→approve→`APPROVED` (reviewer-only, writes a `ReviewAction` row); `UNDER_REVIEW`→reject→`REJECTED` (reviewer-only, `note` required); `APPROVED`→complete→`COMPLETED` (maintenance endpoint only); cancel from `DRAFT`, `SUBMITTED`, `UNDER_REVIEW` and `APPROVED`.
- Verify that every `(from, action)` pair not listed returns `409`, including `submit` from `UNDER_REVIEW` and any transition out of the terminal states `REJECTED`, `CANCELLED`, `COMPLETED` (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED` are non-terminal).
- Verify that `SUBMITTED` is never observed at rest (gates run synchronously inside submit), that gate pass / fail are automatic outcomes and not caller-invoked actions, and that no gates have run for a `DRAFT`.
- Verify that `COMPLETED` is set only by the maintenance completion endpoint and never inferred from elapsed time.
- Verify the cancellation deadline: cancelling an `APPROVED` request is allowed only up to 2 hours before `window_start`; closer than that, the cancel endpoint returns `409` (a state-transition rejection, not a gate failure; source `TSD-4 §6` via `06-business-rules.md` §5).
- Verify the aircraft schedule overlap check counts only `APPROVED` and `UNDER_REVIEW` requests (`DRAFT`, `REJECTED`, `CANCELLED`, `COMPLETED` are invisible to it), so a request that passed `validate` can still fail at `submit` if another request for the same aircraft was approved in the interim (expected behaviour).
- Verify that every write to `FlightRequest.state` goes through one place in the code and every state change is also logged by the database trigger (`0001_init.sql`).
- [OPEN QUESTION: `02-state-machine.md` says the aircraft overlap check runs inside the `AIRCRAFT` / `TIME_WINDOW` gates, while `06-business-rules.md` §1.4 places it only in `TIME_WINDOW` (and `06-business-rules.md` §1.2 lists no overlap rule under `AIRCRAFT`); which `failing_gate` is returned for an overlap]
- [OPEN QUESTION: `06-business-rules.md` §5 says a cancellation attempted closer than 2 hours before `window_start` is rejected and "the request must proceed or be handled by reviewer action instead", but `02-state-machine.md` has no reviewer action on an `APPROVED` request (approve / reject exist only from `UNDER_REVIEW`); what reviewer action is meant]
- [OPEN QUESTION: `02-state-machine.md` and `08-uml-diagrams.md` say `SUBMITTED` → cancel is possible "in a narrow window" and also that `SUBMITTED` is never observed at rest; how can this transition be exercised in a test]
- [OPEN QUESTION: the maintenance completion endpoint (path, method, caller) and the behaviour at exactly 2 hours before `window_start` are not defined; `03-api-contract.md` gives the `409` body only as "conflict detail", with no structure]

**API contract (`03-api-contract.md`)**
- Verify the base path `/api/v1` (JSON in, JSON out, Next.js route handlers under `app/api/v1/...`).
- Verify the authentication endpoints (`POST /operators`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` returning the profile or `401`), that registration creates the Supabase Auth user and the Operator profile in one request and signs the caller in, and that the original endpoints keep numbers 1–16 with authentication endpoints unnumbered.
- Verify that registration always creates an operator at `L1` and `authorisation_level` is not self-service.
- Verify server-derived enforcement: operator-scoped endpoints derive `operator_id` from the session, accept it neither as request field nor query param, and never trust a client claim about the acting operator; no session gives `401`, another operator's resource gives `403`.
- Verify all 16 numbered endpoints: `POST /operators`, `GET /operators/{id}`, `POST /pilots`, `GET /pilots/{id}` (with derived currency), `POST /aircraft`, `GET /aircraft/{id}` (with derived weight band), `GET /zones`, `GET /zones/{code}`, `POST /flight-requests`, `POST /flight-requests/{id}/submit`, `GET /flight-requests/{id}`, `GET /flight-requests` (filters `state`, `zone_code`, date range), `POST /flight-requests/{id}/validate`, `POST /flight-requests/{id}/cancel`, `POST /flight-requests/{id}/approve`, `POST /flight-requests/{id}/reject`.
- Verify `GET /pilots` and `GET /aircraft` list only the logged-in operator's own records, each row with the same derived field as the single-entity `GET`, with no `operator_id` query param.
- Verify reviewer-or-owner reads (single `GET` of pilot / aircraft / operator / flight-request, and `validate`) and list scoping of `GET /flight-requests` (forced to the session's operator without reviewer header; unscoped, with optional filters including `operator_id`, when a reviewer header is present); owner-only endpoints (`submit`, `cancel`).
- Verify that zones have no create / update endpoints.
- Verify that `validate` runs every gate exactly as `submit` would, in the same order, never changes state, and that both call one shared gate-pipeline function.
- Verify that approve and reject require `X-Reviewer-Id` (`400` if missing), write a `ReviewAction` row and move the state; reject requires a note.
- Verify the error statuses `400`, `401`, `403`, `404`, `409`, `422` and their meanings (`401`: no session and no reviewer header; `403`: wrong operator's resource, and, per `03-api-contract.md`, the `SUSPENDED`-operator precondition; `409`: cannot be attempted at all; `422`: attempted and refused by a business rule).
- Verify the `422` body: `failing_gate`, `rule_reference` (real values only, verbatim, never invented; `TSD-4 §3.2` in the contract example is illustrative only) and `message` (specific, written for an operator).
- [OPEN QUESTION: `03-api-contract.md` defines every `422` as naming a failing gate, but `06-business-rules.md` §1.2 and §3 say an aircraft above 30,000 g is refused with `422` at registration as a non-gate precondition (`rule_reference` `OH-1 §3`); what body does that `422` carry]
- [OPEN QUESTION: `03-api-contract.md` lists the `SUSPENDED`-operator precondition under `403`, while `05-open-questions.md` §1 and `07-clarifications.md` item 3 say its status code and body are undefined (`403` only a proposed placeholder); what must be returned. Also, `03-api-contract.md` says "write endpoints" while `05-open-questions.md` §1 and `07-clarifications.md` item 3 name create / submit / approve; which endpoints are covered, and whose status applies to `approve`, which is a reviewer action]
- [OPEN QUESTION: `03-api-contract.md` defines `401` as "no operator session and no `X-Reviewer-Id`" but says reviewer endpoints return `400` when `X-Reviewer-Id` is missing; which status applies when there is neither a session nor a header on a reviewer endpoint]
- [OPEN QUESTION: `03-api-contract.md` and `06-business-rules.md` say gates stop at the first failure and `validate` runs the pipeline exactly as `submit` would, but `03-api-contract.md` and `04-frontend-spec.md` say the reviewer detail view shows "all four gate results" and the operator sees "per-gate pass/fail" from `validate`, and `08-uml-diagrams.md` says `validate` returns per-gate results; are gates after the first failure reported]
- [OPEN QUESTION: success status codes and bodies are not defined (`08-uml-diagrams.md` says only "200/201"); request/response field schemas, pagination, sort order and the date-range parameter names of `GET /flight-requests`, the `404` body, the login failure response, and whether the zone endpoints require a session or header are not defined]

**Business rules (`06-business-rules.md`, `07-clarifications.md`, `05-open-questions.md`)**
- Verify the fixed gate order `PILOT` → `AIRCRAFT` → `ZONE` → `TIME_WINDOW`, stopping at the first failure, with `failing_gate` naming the first gate to fail only (`API-REF` §5).
- `PILOT` gate (both conditions must hold): rating must cover the zone class (`R_BASIC` → `OPEN`; `R_ADVANCED` → `OPEN`, `CONTROLLED`; `R_BVLOS` → `OPEN`, `CONTROLLED`, `RESTRICTED`; `OH-1 §2.1`), evaluated independently of the zone gate; certification current for 18 months from `certified_on`, no grace period (one day past 18 months is not current), checked against `window_start` and not submission time (`OH-1 §2.3`); currency is never stored, computed when checked.
- `AIRCRAFT` gate: the derived weight band must be one of the zone's `permitted_bands` (`ZC-2026.1 §2`); the check belongs to `AIRCRAFT`, not `ZONE`, despite the literal "fails the zone gate" wording of `ZC-2026.1` §2 (a corpus error, per `07-clarifications.md` item 1; implemented in `lib/gates/aircraft-gate.ts`, not `lib/gates/zone-gate.ts`); this gate is a real check, not a stub.
- Weight bands, upper bound inclusive: `C0` 0–900 g, `C1` above 900–3,500 g, `C2` above 3,500–12,000 g, `C3` above 12,000–30,000 g; exactly 900 g is `C0`, 3,500 g is `C1`, 12,000 g is `C2`; no `C4` / `C5`; `Zone.permitted_bands` only uses `C0`–`C3` and nothing outside it is valid (`OH-1` v2.0 §3).
- Registration of an aircraft with `mtom_grams` above 30,000 g is refused with `422` at the `/aircraft` write, before the aircraft record or any gate exists; `rule_reference` `OH-1 §3` (`API-REF` §4); no such aircraft can reach a flight request.
- `ZONE` gate: `requested_altitude_metres` ≤ `ceiling_metres` (`ZC-2026.1 §2`, explicit); operator `authorisation_level` ≥ zone `required_authorisation_level` (`L1` < `L2` < `L3`, `OH-1 §4`, independent of pilot rating and aircraft band, confirmed by the rules owner); inactive zone fails any flight request (`ZC-2026.1 §4`, inferred, citation not fully confirmed).
- `TIME_WINDOW` gate: lead time ≥ 6 hours between submission and `window_start` (`TSD-4 §2.1`); ≤ 60 days advance booking (`TSD-4 §2.2`, restated `OH-1` §5); duration 15–240 minutes inclusive at both ends, `window_end` strictly after `window_start` (`TSD-4 §3`); no part of the window inside the zone's curfew, evaluated minute by minute across the whole window and not only at the endpoints, curfews crossing midnight being one continuous period (`TSD-4 §4`); no overlap with another `APPROVED` or `UNDER_REVIEW` request for the same aircraft, windows touching at a boundary (one ends 14:00, next starts 14:00) not overlapping (`TSD-4 §5`).
- Verify curfew values per zone: `KBP-CTR-3` and `ODS-CTR-5` 23:00–05:00 (`A-7` §1 narrows the `ZC-2026.1` general 22:00–06:00; `A-7` §4 states the amendment governs); `LVV-RST-2` and `ZTM-RST-7` 22:00–06:00 (`ZC-2026.1` §3, unamended); `DNI-OPN-1` and `KHR-OPN-4` none.
- Verify the zone catalogue of six zones, all active: `KBP-CTR-3` (Kyiv Boryspil Corridor 3, `CONTROLLED`, 120 m, C0–C2, `L2`), `ODS-CTR-5` (Odesa Corridor 5, `CONTROLLED`, 90 m, C0–C2, `L2`), `LVV-RST-2` (Lviv Restricted 2, `RESTRICTED`, 60 m, C0–C1, `L3`), `ZTM-RST-7` (Zhytomyr Restricted 7, `RESTRICTED`, 45 m, C0, `L3`), `DNI-OPN-1` (Dnipro Open 1, `OPEN`, 120 m, C0–C3, `L1`), `KHR-OPN-4` (Kharkiv Open 4, `OPEN`, 120 m, C0–C3, `L1`).
- Verify the `zone_class` pilot-rating mapping: `OPEN` accepts any rating, `CONTROLLED` requires `R_ADVANCED` or `R_BVLOS`, `RESTRICTED` requires `R_BVLOS`.
- Verify the `rule_reference` value per condition: `OH-1 §2.1` (rating does not cover zone class), `OH-1 §2.3` (certification not current), `ZC-2026.1 §2` (weight band not permitted, `AIRCRAFT`; shared citation, disambiguated by `failing_gate`), `ZC-2026.1 §2` (altitude exceeds ceiling, `ZONE`), `OH-1 §4` (authorisation level too low), `ZC-2026.1 §4` (zone inactive), `TSD-4 §2.1` (lead time), `TSD-4 §2.2` (too far in advance), `TSD-4 §3` (duration), `A-7 §1` (curfew, `KBP-CTR-3` / `ODS-CTR-5`), `ZC-2026.1 §3` (curfew, other zones), `TSD-4 §5` (overlap), `OH-1 §3` (registration, not a gate).
- Verify that `Aircraft.status = RETIRED` and `Pilot.status = INACTIVE` are not tied to any gate (left unwired; `05-open-questions.md` row 2, `07-clarifications.md` item 2).
- Verify that `Operator.status = SUSPENDED` is a precondition on write operations (create, submit, approve), not a gate outcome, and is never returned as a `422` with a `failing_gate` (`07-clarifications.md` item 3).
- Verify that values from the unadopted `CR-1` proposal and from superseded `OH-1` v1.4 (24-month currency, 4,000 g `C1`/`C2` boundary) are not used.
- Verify that where `07-clarifications.md` conflicts with the literal wording of `06-business-rules.md`, the behaviour follows `07-clarifications.md`, and that the statuses in `05-open-questions.md` (rows 1–3 resolved, rows 4–5 open, neither blocking gate implementation) are reflected.
- [OPEN QUESTION: `06-business-rules.md` says that where the compilation and a source document (`OH-1`, `ZC-2026.1`, `TSD-4`, `A-7`, `API-REF`) disagree, the source document governs (with the `AIRCRAFT` / `ZONE` assignment as the one stated exception); the source documents are not provided, so the rules can only be verified against the compilation]
- [OPEN QUESTION: `05-open-questions.md` §2 says the `rule_reference` `ZC-2026.1 §4` for an inactive zone is not fully confirmed; is it the authoritative value for a `422` body]
- [OPEN QUESTION: `06-business-rules.md` §1.4 cites `TSD-4 §4` as the source of the curfew rule, while §6 gives `A-7 §1` and `ZC-2026.1 §3` as the `rule_reference` values for a curfew failure and does not list `TSD-4 §4`; which value goes into the `422` body is stated only by §6]
- [OPEN QUESTION: `06-business-rules.md` §1.1 cites only `OH-1 §2.1` for the rating-to-zone-class mapping, while §4 cites `ZC-2026.1 §2` and `OH-1 §2.1` for the same mapping; which citation applies]
- [OPEN QUESTION: curfews are defined in zone-local time (`01-data-model.md` "Time handling", `06-business-rules.md` §1.4) but the documentation does not state which timezone each zone uses; it also does not say from which moment the 60-day advance-booking limit is measured (`06-business-rules.md` §1.4 says only "≤ 60 days before `window_start`"; the 6-hour lead time is stated as measured from submission)]

**Frontend (`04-frontend-spec.md`)**
- Verify the two roles and the role switcher in the header (operator / reviewer); styling is intentionally minimal and visual design is not the goal.
- Verify operator login (`/login`) and register (`/register`) pages; registration is a single combined form (email, password and Operator profile fields such as `legal_name`, `national_id`), creates both together, logs the operator in immediately, and has no `authorisation_level` field (registration starts at `L1`).
- Verify the operator portal requires login and manages only its own pilots, aircraft and requests (enforced server-side via the session; "the current operator" comes from the session).
- Verify the registry pages for pilots and aircraft, each with a create form.
- Verify the request creation form: zone picker fed from `GET /zones`, pilot and aircraft pickers scoped to the current operator, window start / end inputs, altitude input, free-text purpose field.
- Verify that the pickers are not pre-filtered against business rules: an operator can select a combination that cannot pass; rules are enforced only at `validate` and `submit`, never while the form is being filled in.
- Verify the "Check before submitting" button: calls `POST /flight-requests/{id}/validate` and shows a per-gate pass/fail result without changing state.
- Verify the "My requests" list, filterable by state, and the request detail view showing rejection reason and rule reference when applicable.
- Verify the reviewer queue: pending requests table (state = `UNDER_REVIEW`), sortable by submission time; detail view showing all four gate results (from `validate`); approve and reject actions; reject requires a note (mapped to the required `note` field of `POST /flight-requests/{id}/reject`).
- Verify the `data-testid` contract: every interactive element carries a stable `data-testid` (for example `flight-request-submit-button`) that is not renamed unless the element changes into something else; `operator-id-input` no longer exists (not renamed, removed); `operator-login-link` and `operator-register-link` are shown when logged out; `operator-session-info` and `operator-logout-button` are shown when logged in.
- Verify the reviewer identity is only an `X-Reviewer-Id` header typed into the header UI, not a login.

**Diagrams (`08-uml-diagrams.md`)**
- Verify that the diagrams are consistent with `01-data-model.md` and `02-state-machine.md`.
- Verify the ER diagram relationships: Operator registers Pilot and Aircraft and owns FlightRequest; Pilot, Aircraft and Zone each relate to FlightRequest; FlightRequest is decided by ReviewAction; `AuditLog` has no FK and is keyed by `(entity_type, entity_id)`; Zone is read-only reference data.
- Verify the state diagram: `[*]` → `DRAFT` on create, the same transitions as the table, `REJECTED` / `CANCELLED` / `COMPLETED` as final states, and the notes that `SUBMITTED` is transient and `REJECTED` is terminal with `failing_gate` + `rejection_reason` (+ `rule_reference`) on gate failure; any pair not drawn returns `409`.
- Verify the gate-pipeline sequence: load FlightRequest, Pilot, Aircraft, Zone; run gates in order, a failing gate yields `422 {failing_gate, rule_reference, message}`; the submit endpoint writes the state (`UNDER_REVIEW` or `REJECTED`) plus an AuditLog entry; the validate endpoint returns per-gate results with no state change.
- [OPEN QUESTION: `08-uml-diagrams.md` shows the pipeline producing a `422 {failing_gate, ...}` and then the submit endpoint writing the state (`UNDER_REVIEW` or `REJECTED`) and answering "200/201 with new state"; whether a failed submit returns `422` or a success status with state `REJECTED` is not defined in `03-api-contract.md` or `02-state-machine.md`]

## Risks
- The documentation and migrations drift apart; the UML file drifts from the data model and state machine.
- Pilot currency or weight band is persisted and goes stale; correcting `mtom_grams` changes the band but authorisations already issued are not revisited.
- Curfew is converted from UTC at write time instead of at evaluation time, or evaluated only at window endpoints rather than minute by minute; curfews crossing midnight are split.
- Boundary errors: exactly 900 / 3,500 / 12,000 / 30,000 g; exactly 15 or 240 minutes; exactly 6 hours lead time; exactly 60 days; exactly 18 months; windows touching at a boundary treated as overlapping; cancel exactly 2 hours before `window_start`.
- Pilot currency is checked against submission time instead of `window_start`; a 24-month (superseded `OH-1` v1.4) value or the 4,000 g boundary is used.
- Values from the unadopted `CR-1` proposal leak into the implementation.
- The weight-band check is placed in `ZONE` (following the literal wording of `ZC-2026.1 §2`) instead of `AIRCRAFT`.
- The shared citation `ZC-2026.1 §2` (weight band and altitude) is treated as a unique identifier instead of keying off `failing_gate`.
- The base catalogue curfew is used for `KBP-CTR-3` / `ODS-CTR-5` instead of the `A-7` amendment.
- `failing_gate` names a later gate, or several gates, instead of only the first one that failed.
- `401` / `403` and `409` / `422` are mixed up; a `SUSPENDED` operator is returned as a `422` with a `failing_gate`.
- The `Operator.status = SUSPENDED` response shape is undefined in the documentation (row 4 of `05-open-questions.md`): any status code a tester sees there is a placeholder, not a verified expectation.
- The citation `ZC-2026.1 §4` for an inactive zone is not fully confirmed (row 5 of `05-open-questions.md`): it cannot be treated as authoritative in a `422` body.
- `Aircraft.status = RETIRED` or `Pilot.status = INACTIVE` is wrongly tied to a gate.
- A client-supplied `operator_id` is trusted; a reviewer header grants access to owner-only actions; `GET /flight-requests` leaks other operators' requests; the reviewer header is a static label, so any caller can supply it.
- A transition not listed is accepted instead of returning `409`; `SUBMITTED` is observed at rest; `COMPLETED` is set from elapsed time or by a non-maintenance endpoint.
- State writes bypass the single place in the code, or the application audit write and the database trigger disagree.
- A request that passes `validate` fails at `submit` because another request for the same aircraft was approved in the interim (documented as expected behaviour, not a bug).
- `validate` and `submit` diverge because gate logic is duplicated.
- An aircraft above 30,000 g gets registered, or is refused with the wrong status or `rule_reference`.
- An update or delete path for AuditLog or a write path for Zone is exposed in the API or the UI.
- `data-testid` values are renamed or removed, breaking automated suites; the removed `operator-id-input` reappears.
- Client-side eligibility filtering is added to the pickers, hiding gate failures the operator needs to see.
- `authorisation_level` is settable during registration.
- The `flight_purpose` limit is enforced in only one layer.
- A `rule_reference` is lost after the original `422` response because it was not persisted (the reason `0002` exists).
- The 16 original endpoints are renumbered, or `GET /pilots` / `GET /aircraft` are dropped when the contract is regenerated.
- A cancellation refused closer than 2 hours before `window_start` is followed by an undefined "reviewer action" that the state machine does not allow.

## In Scope / Out Of Scope
**In Scope:**
- **Entities and schema:** Operator, Pilot, Aircraft, Zone, FlightRequest, ReviewAction, AuditLog with all fields, keys, constraints and enumerations listed in Goals; the four migrations; derived values (pilot currency, weight band); time handling; `flight_purpose` limit.
- **Request lifecycle:** seven states, legal and illegal transitions, terminal states, cancellation deadline, aircraft overlap rule, single place for state writes and the audit trigger.
- **API:** all `/api/v1` endpoints (1–16, the unnumbered authentication endpoints, `GET /pilots`, `GET /aircraft`), authentication and authorisation, owner / reviewer access rules, error statuses and the `422` body.
- **Gate pipeline:** `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW` with every condition, threshold, citation and curfew value in `06-business-rules.md` and `07-clarifications.md`; the aircraft weight-ceiling registration rule; the zone catalogue; the weight band thresholds; the pilot currency threshold.
- **Frontend:** operator portal (login, register, registries, request form, check before submitting, my requests, request detail), reviewer queue, role switcher, `data-testid` contract, no pre-filtering of pickers.
- **Diagrams:** consistency of `08-uml-diagrams.md` with the data model and state machine.
- **Open questions as test inputs:** `Operator.status = SUSPENDED` handling and the `ZC-2026.1 §4` citation are tested for what is defined and reported as gaps for what is not.

**Out Of Scope:**
- `CR-1` (Airspace Policy Group proposal, 2026-03-02): `06-business-rules.md`, top section ("Explicitly not a source"): "a proposal, not an adopted standard", nothing in it is in force.
- `OH-1` v1.4: `06-business-rules.md`, top section: superseded, retained for audit only.
- Raising an operator's `authorisation_level`: `03-api-contract.md` ("`authorisation_level` is no longer self-service") and `04-frontend-spec.md` ("Operator portal"), an out-of-band admin action.
- Zone population and editing: `01-data-model.md` (Zone) and `03-api-contract.md` ("Reference data"), handed to `supabase/seed.sql` and `supabase/SETUP.md`.
- Visual design and consumer-grade polish of the frontend: `04-frontend-spec.md`, first paragraph ("Styling is intentionally minimal", "Don't over-invest in visual design").

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
- Supabase (database, migrations, trigger, Supabase Auth)
- REST API (`/api/v1`, JSON) and Next.js route handlers
- Web application (Next.js frontend with `data-testid` selectors)
- Mermaid (UML diagrams in `08-uml-diagrams.md`)

## Schedule and Estimations / People
Schedule and Estimations:
- Start date / End date: [OPEN QUESTION: start and end dates]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation]
- Testing: [OPEN QUESTION: estimation]
- Create Test Report: [OPEN QUESTION: estimation]

People: Kamila Stopa, Senior Test Engineer
