# Test Plan #TP009

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/08-uml-diagrams.md

## Introduction

This plan covers `08-uml-diagrams.md` ("UML Diagrams"), a generated reference with three Mermaid diagrams: an entity-relationship diagram, the flight request state diagram and the gate pipeline sequence diagram. The diagrams are derived from `01-data-model.md` and `02-state-machine.md`. If those documents and the schema drift, they are the source of truth, and this file is regenerated, not hand-edited out of sync. Mermaid syntax renders natively on GitHub, GitLab and most markdown viewers.

## Goals

Verify that the diagrams render and that the behaviour they describe is correct.

### Document

- G1. The three Mermaid diagrams (ER, state, sequence) render in GitHub, GitLab and other markdown viewers.
- G2. The file is derived from `01-data-model.md` and `02-state-machine.md` and matches them; on drift, those documents are the source of truth.

### Entity-relationship diagram

- G3. Relationships.
  - G3.1. `OPERATOR` registers many `PILOT`.
  - G3.2. `OPERATOR` registers many `AIRCRAFT`.
  - G3.3. `OPERATOR` owns many `FLIGHT_REQUEST`.
  - G3.4. `PILOT` flies many `FLIGHT_REQUEST`; each `FLIGHT_REQUEST` has exactly one `PILOT`.
  - G3.5. `AIRCRAFT` is used by many `FLIGHT_REQUEST`; each `FLIGHT_REQUEST` has exactly one `AIRCRAFT`.
  - G3.6. `ZONE` is "requested in" many `FLIGHT_REQUEST`; each `FLIGHT_REQUEST` has exactly one `ZONE`.
  - G3.7. `FLIGHT_REQUEST` is "decided by" many `REVIEW_ACTION`.
- G4. `OPERATOR`.
  - G4.1. `id` is the primary key, with an FK to `auth.users(id)`.
  - G4.2. `national_id` is unique.
  - G4.3. `email` is unique.
  - G4.4. `authorisation_level` holds `L1`, `L2`, `L3`.
  - G4.5. `status` holds `ACTIVE`, `SUSPENDED`.
  - G4.6. `legal_name`, `phone`, `address_line`, `city`, `postal_code` and `registered_on` exist.
- G5. `PILOT`.
  - G5.1. `id` is the primary key; `operator_id` is an FK.
  - G5.2. `national_id` is unique.
  - G5.3. `rating` holds `R_BASIC`, `R_ADVANCED`, `R_BVLOS`.
  - G5.4. `status` holds `ACTIVE`, `INACTIVE`.
  - G5.5. `full_name` and `certified_on` exist; `certified_on` is the source of the derived currency.
- G6. `AIRCRAFT`.
  - G6.1. `id` is the primary key; `operator_id` is an FK.
  - G6.2. `serial_number` is unique.
  - G6.3. `status` holds `ACTIVE`, `RETIRED`.
  - G6.4. `manufacturer`, `model`, `mtom_grams` (int, the source of the derived weight band) and `registered_on` exist.
- G7. `ZONE`.
  - G7.1. `code` is the primary key.
  - G7.2. `zone_class` holds `OPEN`, `CONTROLLED`, `RESTRICTED`.
  - G7.3. `permitted_bands` follows the `C0`-`C3` taxonomy.
  - G7.4. `required_authorisation_level` holds `L1`, `L2`, `L3`.
  - G7.5. `name`, `ceiling_metres`, `curfew_start`, `curfew_end` and `active` exist.
  - G7.6. `Zone` is read-only reference data, not written by ordinary product flows.
- G8. `FLIGHT_REQUEST`.
  - G8.1. `id` is the primary key; `operator_id`, `pilot_id`, `aircraft_id` and `zone_code` are FKs.
  - G8.2. `window_start` is UTC; `window_end` is UTC and after `window_start`.
  - G8.3. `failing_gate` holds `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`.
  - G8.4. `flight_purpose` is at most 2000 characters.
  - G8.5. `state` follows the state diagram.
  - G8.6. `rejection_reason` is set on rejection.
  - G8.7. `rule_reference` is set alongside `failing_gate`.
  - G8.8. `requested_altitude_metres`, `submitted_at`, `decided_at` and `decided_by` (reviewer identity) exist.
- G9. `REVIEW_ACTION`.
  - G9.1. `id` is the primary key; `flight_request_id` is an FK.
  - G9.2. `reviewer_id` comes from the `X-Reviewer-Id` header.
  - G9.3. `action` holds `APPROVE`, `REJECT`.
  - G9.4. `note` is required when `action=REJECT`.
  - G9.5. `created_at` exists.
- G10. `AUDIT_LOG`.
  - G10.1. Fields: `id` (primary key), `entity_type` (e.g. `FlightRequest`), `entity_id`, `to_state`, `actor`, `created_at`.
  - G10.2. `from_state` is nullable, for creation events.
  - G10.3. It has no FK drawn: it is a generic append-only log keyed by `(entity_type, entity_id)` against any entity, not a typed relation.

### Flight request state diagram

- G11. Creation leads to `DRAFT`. `DRAFT` → `SUBMITTED` on submit.
- G12. Automatic resolution of `SUBMITTED`.
  - G12.1. `SUBMITTED` → `UNDER_REVIEW` when gates pass.
  - G12.2. `SUBMITTED` → `REJECTED` when gates fail.
- G13. Reviewer decisions.
  - G13.1. `UNDER_REVIEW` → `APPROVED` on approve (reviewer).
  - G13.2. `UNDER_REVIEW` → `REJECTED` on reject (reviewer, note required).
- G14. `APPROVED` → `COMPLETED` on complete (maintenance endpoint only).
- G15. Cancel by the operator. [OPEN QUESTION: the "narrow window" for cancelling a `SUBMITTED` request is not defined in this document]
  - G15.1. `DRAFT` → `CANCELLED`.
  - G15.2. `SUBMITTED` → `CANCELLED` (narrow window).
  - G15.3. `UNDER_REVIEW` → `CANCELLED`.
  - G15.4. `APPROVED` → `CANCELLED` (up to 2h before `window_start`).
- G16. `REJECTED`, `CANCELLED` and `COMPLETED` are terminal states.
- G17. `SUBMITTED` is transient: never observed at rest, because the gates run synchronously inside submit.
- G18. `REJECTED` is terminal; `failing_gate` and `rejection_reason` (plus `rule_reference`) are populated on gate failure.
- G19. Any `(from, action)` pair not drawn is illegal and the API returns `409`, including plausible ones such as re-submitting a request already `UNDER_REVIEW`.

### Gate pipeline sequence

- G20. `submit` (`POST /flight-requests/{id}/submit`) and `validate` (`/validate`) share one pipeline. The API loads the `FlightRequest`, `Pilot`, `Aircraft` and `Zone` from Supabase and runs the pipeline.
- G21. Pipeline order and failure.
  - G21.1. The gates run in order: 1. `PILOT`, 2. `AIRCRAFT`, 3. `ZONE`, 4. `TIME_WINDOW`.
  - G21.2. A failing gate returns `422 {failing_gate: <gate>, rule_reference, message}` and later gates do not run.
  - G21.3. If all gates pass, the pipeline passes.
- G22. For the `submit` endpoint, the API writes the state (`UNDER_REVIEW` or `REJECTED`) and an `AuditLog` entry, and responds `200/201` with the new state.
- G23. For the `validate` endpoint, the API responds `200` with per-gate results and no state change.
- G24. [OPEN QUESTION: the diagram shows the pipeline returning a `422` on the first failing gate, while `validate` responds `200` with per-gate results; how a failing gate is reported by `validate` is not stated]
- G25. [OPEN QUESTION: for `submit`, a gate failure is drawn as a `422` from the pipeline, while the state diagram shows an automatic move to `REJECTED`; the response returned to the caller on a gate failure in `submit` is not stated]
- G26. [OPEN QUESTION: the `state` enum values are given only as "see state diagram"; the relation of `decided_by` (reviewer identity) to `REVIEW_ACTION.reviewer_id` is not stated]

## Risks

- R1. A diagram drifting from `01-data-model.md`, `02-state-machine.md` or the schema (G2).
- R2. Mermaid syntax errors or viewer differences preventing a diagram from rendering (G1).
- R3. An undrawn transition being accepted instead of returning `409` (G19).
- R4. `SUBMITTED` observed at rest, or gates not running synchronously inside submit (G17).
- R5. `validate` changing state (G23).
- R6. Gate order not respected or later gates running after a failure (G21).
- R7. `COMPLETED` reachable through an endpoint other than the maintenance endpoint (G14).
- R8. Reject accepted without a note (G9.4, G13.2).

## In Scope / Out Of Scope

### In Scope

- Rendering and content of the ER, state and sequence diagrams (G1, G3-G26)
- Entity fields, keys, uniqueness, enums and constraints shown in the ER diagram (G4-G10)
- State transitions, terminal states and the `409` rule for undrawn transitions (G11-G19)
- Gate pipeline order and the differing outcomes of `submit` and `validate` (G20-G25)

### Out Of Scope

- The authoritative data model and state machine: `08-uml-diagrams.md` (intro) says `01-data-model.md` and `02-state-machine.md` are the source of truth. Those documents are not part of the input.

## Entry Criteria / Environments

### Entry Criteria

1. Requirements, test goals are clear for testers
2. All test environments and test tools are ready and can be used
3. Test data / test documentation are available and can be used
4. Test cases are ready and can be used

### Environments

- OS: Microsoft Windows 11 Pro (version 10.0.26200)
- Browser: Chrome (latest version)

## Exit Criteria / Tools

### Exit Criteria

1. Test time was finished
2. More than 85% of all test cases were passed
3. Test Report is ready and can be provided to stakeholders

### Tools

- SVC: GitHub
- Test design: Claude Code
- Mermaid (rendered on GitHub, GitLab and other markdown viewers)
- Supabase
- API endpoints named in the documentation: `POST /flight-requests/{id}/submit`, `/validate`
- `X-Reviewer-Id` header

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
