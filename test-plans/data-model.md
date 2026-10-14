# Test Plan: Data Model

**Source docs:** `../skypermit/docs/01-data-model.md` | **Version/date:** 2026-10-14 | **Author:** Kamila Stopa

## 1. Context
- **Test items:** seven entities (Operator, Pilot, Aircraft, Zone, FlightRequest, ReviewAction, AuditLog): fields, constraints, enums, the two derived values, and time handling (01), as implemented by migrations `0001`-`0004`.
- **Scope:** In: uniqueness, foreign keys, enum values, derived-never-stored values, `flight_purpose` limit, UTC handling, populate-only-on-rejection fields, append-only `AuditLog`, read-only `Zone`. Out: threshold values (06), state transitions (02), API payloads (03), UI (04).
- **Assumptions & constraints:** 01 and the migrations "must stay in sync" (01, intro); 01 is the only source used here.
- **Stakeholders:** Operators (own pilots, aircraft and requests), Reviewers (identified by `X-Reviewer-Id` in `ReviewAction`) (01); other roles TBD.

## 2. Test strategy
- **Manual vs automated:** manual; automation TBD (not started unless requested).
- **Design techniques:** equivalence partitioning and boundary value analysis (constraints, `flight_purpose` length), decision table (field x rule), review of document vs migrations.
- **Environment & data:** TBD; needs a database with migrations `0001`-`0004` applied and `supabase/seed.sql` loaded (01, Zone).
- **Retesting & regression:** re-check constraints and derived values after any new migration or change to 01.

## 3. Completion & suspension criteria
- **Completion:** every documented constraint, enum and derived value verified; no open Critical/High defects; thresholds TBD.
- **Suspension / resumption:** suspend if migrations cannot be applied; resume once the schema is deployable.

## 4. Risks
| # | Type | Risk (with doc ref) | Probability | Impact | Score | Mitigation |
|---|---|---|---|---|---|---|
| 1 | Product | Pilot currency or aircraft weight band is persisted instead of computed at read time, causing staleness after the input field is corrected (01, Derived, never stored) | TBD | TBD | TBD | Correct `certified_on` / `mtom_grams`, re-read |
| 2 | Product | Correcting a registered mass does not recalculate the band immediately, or already issued authorisations are revisited (01, Derived, never stored) | TBD | TBD | TBD | Correct mass; check band and existing approvals |
| 3 | Product | `AuditLog` has an update or delete path in the API or UI (01, AuditLog) | TBD | TBD | TBD | Attempt update/delete through every available path |
| 4 | Product | A state transition has no `AuditLog` row, or `from_state` is not nullable so creation events cannot be recorded (01, AuditLog) | TBD | TBD | TBD | Check log entries for creation and each transition |
| 5 | Product | `flight_purpose` over 2,000 characters accepted by the API or the DB; doc requires both layers to enforce it (01, Time handling) | TBD | TBD | TBD | Test at the limit via API and directly in DB |
| 6 | Product | `window_end` not after `window_start` accepted (01, FlightRequest) | TBD | TBD | TBD | Equal and earlier `window_end` |
| 7 | Product | Windows not stored in UTC, or curfew conversion done at write time instead of inside the `TIME_WINDOW` gate (01, Time handling) | TBD | TBD | TBD | Inspect stored values; check curfew handling at evaluation |
| 8 | Product | Uniqueness not enforced for `national_id` (Operator, Pilot), `email` (Operator) or `serial_number` (Aircraft) (01, Entities) | TBD | TBD | TBD | Duplicate-insert cases per field |
| 9 | Product | `Operator.id` not tied to `auth.users(id)` with cascade delete, or a leftover `user_id` column after `0004` collapsed it (01, Operator) | TBD | TBD | TBD | Inspect schema; delete an auth user |
| 10 | Product | Migrations drift from the document (01, intro) | TBD | TBD | TBD | Compare schema with 01 field by field |
| 11 | Product | `ReviewAction.note` accepted empty when `action` is `REJECT` (01, ReviewAction) | TBD | TBD | TBD | Insert `REJECT` without note |
| 12 | Product | `rejection_reason` populated on non-rejected requests, or `failing_gate` / `rule_reference` populated other than on gate-failure rejection or not together (01, FlightRequest) | TBD | TBD | TBD | Check fields per state and rejection type |
| 13 | Product | `Zone` can be created or edited through ordinary product flows (01, Zone) | TBD | TBD | TBD | Look for create/edit paths for zones |
| 14 | Product | Enum columns accept values outside the documented sets (01, Enumerations) | TBD | TBD | TBD | Insert an undefined value per enum |
| 15 | Product | `Zone.permitted_bands` accepts bands outside `C0`-`C3` (01, Zone) | TBD | TBD | TBD | Insert an undefined band |

## 5. Roles, schedule & estimates
| Role | Responsibility |
|---|---|
| QA (Kamila Stopa) | Design, execute, report |
| Others | TBD |

| Activity | Estimate | Dates |
|---|---|---|
| Test case design | TBD | TBD |
| Execution and regression | TBD | TBD |

## 6. Deliverables & approval
- **Deliverables:** test cases (`test-cases/`), execution report, defect reports.
- **Approval:** TBD

## Open questions
1. Is `national_id` unique per entity, or across Operator and Pilot?
2. Which fields are required (not null), what formats apply (`email`, `phone`, `postal_code`) and what value ranges apply to `requested_altitude_metres`, `mtom_grams` and `ceiling_metres`? The document does not say.
3. What happens to `Pilot`, `Aircraft` and `FlightRequest` rows when an `Operator` is deleted (only the `auth.users` cascade is stated)?
4. How is "populated only on rejection" enforced: DB constraint or application?
5. Test environment, roles, schedule and estimates?
