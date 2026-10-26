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

- G3. Relationships: `OPERATOR` registers many `PILOT` and many `AIRCRAFT`; `OPERATOR` owns many `FLIGHT_REQUEST`; `PILOT` flies, `AIRCRAFT` is used by, and `ZONE` is "requested in" many `FLIGHT_REQUEST` (each `FLIGHT_REQUEST` has exactly one of each); `FLIGHT_REQUEST` is "decided by" many `REVIEW_ACTION`.
- G4. `OPERATOR`: `id` PK (FK to `auth.users(id)`), `legal_name`, `national_id` UK, `email` UK, `phone`, `address_line`, `city`, `postal_code`, `authorisation_level` (`L1`, `L2`, `L3`), `registered_on`, `status` (`ACTIVE`, `SUSPENDED`).
- G5. `PILOT`: `id` PK, `operator_id` FK, `full_name`, `national_id` UK, `rating` (`R_BASIC`, `R_ADVANCED`, `R_BVLOS`), `certified_on` (source of derived currency), `status` (`ACTIVE`, `INACTIVE`).
- G6. `AIRCRAFT`: `id` PK, `operator_id` FK, `manufacturer`, `model`, `serial_number` UK, `mtom_grams` (source of derived weight band), `registered_on`, `status` (`ACTIVE`, `RETIRED`).
- G7. `ZONE`: `code` PK, `name`, `zone_class` (`OPEN`, `CONTROLLED`, `RESTRICTED`), `ceiling_metres`, `permitted_bands` (`C0`-`C3` taxonomy), `required_authorisation_level` (`L1`, `L2`, `L3`), `curfew_start`, `curfew_end`, `active`. `Zone` is read-only reference data, not written by ordinary product flows.
- G8. `FLIGHT_REQUEST`: `id` PK; `operator_id`, `pilot_id`, `aircraft_id`, `zone_code` FKs; `window_start` (UTC); `window_end` (UTC, after `window_start`); `requested_altitude_metres`; `flight_purpose` (max 2000 chars); `state` (see state diagram); `rejection_reason` (set on rejection); `failing_gate` (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`); `rule_reference` (set alongside `failing_gate`); `submitted_at`; `decided_at`; `decided_by` (reviewer identity).
- G9. `REVIEW_ACTION`: `id` PK, `flight_request_id` FK, `reviewer_id` (from the `X-Reviewer-Id` header), `action` (`APPROVE`, `REJECT`), `note` (required when `action=REJECT`), `created_at`.
- G10. `AUDIT_LOG`: `id` PK, `entity_type` (e.g. `FlightRequest`), `entity_id`, `from_state` (nullable, for creation events), `to_state`, `actor`, `created_at`. It has no FK drawn: it is a generic append-only log keyed by `(entity_type, entity_id)` against any entity, not a typed relation.

### Flight request state diagram

- G11. Creation leads to `DRAFT`. `DRAFT` → `SUBMITTED` on submit.
- G12. `SUBMITTED` → `UNDER_REVIEW` when gates pass (automatic); `SUBMITTED` → `REJECTED` when gates fail (automatic).
- G13. `UNDER_REVIEW` → `APPROVED` on approve (reviewer); `UNDER_REVIEW` → `REJECTED` on reject (reviewer, note required).
- G14. `APPROVED` → `COMPLETED` on complete (maintenance endpoint only).
- G15. Cancel by the operator: `DRAFT` → `CANCELLED`; `SUBMITTED` → `CANCELLED` (narrow window); `UNDER_REVIEW` → `CANCELLED`; `APPROVED` → `CANCELLED` (up to 2h before `window_start`). [OPEN QUESTION: the "narrow window" for cancelling a `SUBMITTED` request is not defined in this document]
- G16. `REJECTED`, `CANCELLED` and `COMPLETED` are terminal states.
- G17. `SUBMITTED` is transient: never observed at rest, because the gates run synchronously inside submit.
- G18. `REJECTED` is terminal; `failing_gate` and `rejection_reason` (plus `rule_reference`) are populated on gate failure.
- G19. Any `(from, action)` pair not drawn is illegal and the API returns `409`, including plausible ones such as re-submitting a request already `UNDER_REVIEW`.

### Gate pipeline sequence

- G20. `submit` (`POST /flight-requests/{id}/submit`) and `validate` (`/validate`) share one pipeline. The API loads the `FlightRequest`, `Pilot`, `Aircraft` and `Zone` from Supabase and runs the pipeline.
- G21. The gates run in order: 1. `PILOT`, 2. `AIRCRAFT`, 3. `ZONE`, 4. `TIME_WINDOW`. A failing gate returns `422 {failing_gate: <gate>, rule_reference, message}` and later gates do not run; if all pass, the pipeline passes.
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
- R8. Reject accepted without a note (G9, G13).

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
