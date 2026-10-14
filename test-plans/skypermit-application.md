# Test Plan: SkyPermit Application

**Source docs:** `../skypermit/docs/01-data-model.md` ... `08-uml-diagrams.md` | **Version/date:** 2026-10-14 | **Author:** Kamila Stopa

## 1. Context
- **Test items:**
  - Data model and derived values (01, 08)
  - Request lifecycle (02)
  - REST API under `/api/v1`: 16 numbered endpoints, login/logout/me, and the `GET /pilots` / `GET /aircraft` list extensions (03)
  - Operator portal and reviewer queue UI with the `data-testid` contract (04)
  - Four-gate pipeline and its rules (06, 07)
- **Scope:**
  - In: gate pass/fail logic and order, `422` body with `failing_gate` / `rule_reference`, state transitions and `409`, cancellation deadline, auth scoping (`401` / `403`), `validate` without side effects, registration and weight ceiling, seeded zone catalogue, UI flows and selectors.
  - Out: `CR-1` proposal and `OH-1` v1.4 values (06), `Aircraft.status` / `Pilot.status` checks (deliberately unwired, 05 #2; only "no gate is wired" is verified, see the resolved-correction risk), zone create/edit (no endpoint, 03), visual design (04).
- **Assumptions & constraints:** 07 governs over 06 where they differ; 05 is the canonical status of open items; source documents `OH-1`, `ZC-2026.1`, `TSD-4`, `A-7`, `API-REF` and the `CLAUDE.md` gate implementation status that 03 points to are not in the docs folder.
- **Stakeholders:** Operators and Reviewers (04, 03); rules owner (07); Airspace Policy Group, author of the unadopted `CR-1` (06); other roles and names TBD. Implied only, not named as parties: an owner of the API contract (05 §1), an out-of-band admin action that raises `authorisation_level` (03), and a maintenance endpoint that completes requests (02).

## 2. Test strategy
- **Manual vs automated:** manual (API client and UI); automation TBD (not started unless requested).
- **Design techniques:** state transition (02), boundary value and equivalence partitioning (06 thresholds, rating x zone class, authorisation level), decision table (endpoint x caller, gate order), review of docs vs schema (01, 08).
- **Environment & data:** TBD; Supabase project with migrations `0001`-`0004` and `seed.sql` (six zones, 06 §4); operators at different levels, a reviewer ID, pilots and aircraft per rating and band.
- **Retesting & regression:** re-run gate, transition and authorisation cases after any rule, migration or contract change; the docs state they must stay in sync (01).

## 3. Completion & suspension criteria
- **Completion:** every documented rule, transition, endpoint and UI flow covered by at least one positive and one negative case; severity criteria and thresholds TBD.
- **Suspension / resumption:** suspend if the environment, auth or seed data is unavailable, or if a rule conflict between docs blocks expected results; resume after fix or clarification.

## 4. Risks
Ordered by how directly the docs flag them: documented conflicts and open items first.

| # | Type | Risk (with doc ref) | Probability | Impact | Score | Mitigation |
|---|---|---|---|---|---|---|
| 1 | Product | `SUSPENDED` operator blocked with an invented code/body or as `422` with `failing_gate`; the response is undefined (05 §1, 07 §3; 03 mentions `403`) | TBD | TBD | TBD | Raise with API owner; treat `403` as placeholder |
| 2 | Product | Inactive-zone rule reported with an unconfirmed citation `ZC-2026.1 §4` (05 §2, 06 §6; 06 §1.3 marks the zone-`active` row "Inferred" and 07 item 4 says "presumably ZONE by elimination") | TBD | TBD | TBD | Test the rule; mark the citation as provisional |
| 3 | Product | Docs disagree on which gate owns the schedule-overlap check: "AIRCRAFT / TIME_WINDOW" (02) vs `TIME_WINDOW` (06 §1.4); `submit` can also fail on overlap after `validate` passed, and the outcome is stated differently: `409` "scheduling conflict" (03 Error semantics) vs a gate failure `422` under `TIME_WINDOW` (06 §1.4, §6) | TBD | TBD | TBD | Two requests for the same aircraft, interleaved; check status code, resulting state and `failing_gate` |
| 4 | Product | Missing `X-Reviewer-Id` on reviewer endpoints returns the wrong status; 03 says `400` but also describes `401` for "no reviewer header" (03 Reviewer, Error semantics) | TBD | TBD | TBD | Negative cases on both reviewer endpoints |
| 5 | Product | `validate` returns only the first failure (03: runs "exactly as submit would") while 04 and 08 show per-gate / "all four gate results" | TBD | TBD | TBD | Run `validate` on a request failing several gates; compare with 04 and 08 |
| 6 | Product | The `APPROVED` -> `COMPLETED` transition has no documented endpoint: 02 names a maintenance endpoint that is absent from 03's endpoints, auth set and extensions | TBD | TBD | TBD | Look for the completion path; raise with the API contract owner |
| 7 | Product | A request inside 2 h of `window_start` is handled by an undefined "reviewer action" (06 §5) although 02 has no such transition from `APPROVED` | TBD | TBD | TBD | Cancel and review actions on an `APPROVED` request inside the limit |
| 8 | Product | Weight-band failure reported under `ZONE` instead of `AIRCRAFT`; `ZC-2026.1 §2` is cited by both AIRCRAFT and ZONE altitude rules, so `failing_gate` is the only disambiguator (06 §1.2, 07 §1) | TBD | TBD | TBD | Assert `failing_gate` first, then `rule_reference` |
| 9 | Product | `RETIRED` aircraft or `INACTIVE` pilot gets blocked by a gate, although nothing ties them to one (05 #2, 07 §2) | TBD | TBD | TBD | Submit with a retired aircraft / inactive pilot |
| 10 | Product | Several gates fail but a later gate is named instead of the first, in order `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW` (06 Evaluation order, 03 Gate pipeline); what `validate` returns when gates fail is a separate open question, since 04 and 08 show per-gate results | TBD | TBD | TBD | Requests failing two or more gates, through `submit` and `validate` |
| 11 | Product | Curfew for `KBP-CTR-3` / `ODS-CTR-5` uses the base `22:00-06:00` instead of the `A-7` `23:00-05:00` (06 §1.4, §4) | TBD | TBD | TBD | Cases inside the gap between the two values |
| 12 | Product | Curfew evaluated only at window endpoints, midnight crossing split in two, or UTC / zone-local conversion done at write time (06 §1.4, 01) | TBD | TBD | TBD | Windows spanning the whole curfew and midnight |
| 13 | Product | Pilot currency checked against submission time instead of `window_start`, or the old 24-month value used (06 §1.1, §2) | TBD | TBD | TBD | Pilot current at submit but lapsed by `window_start` |
| 14 | Product | Weight-band boundaries wrong (inclusive upper bound; old 4,000 g `C1`/`C2` boundary), or aircraft above 30,000 g accepted at registration instead of `422` (06 §1.2, §3) | TBD | TBD | TBD | Boundary masses at each band edge and above the ceiling |
| 15 | Product | `TIME_WINDOW` limits (6 h lead, 60 d advance, 15-240 min inclusive, touching windows do not overlap) implemented incorrectly (06 §1.4) | TBD | TBD | TBD | Boundary cases at each limit |
| 16 | Product | Seeded zone catalogue differs from the documented six zones (ceilings, bands, curfews, levels, all active) (06 §4) | TBD | TBD | TBD | Compare `seed.sql` data with 06 §4 |
| 17 | Product | A `(from, action)` pair not in the transition table is accepted instead of `409`, or terminal states accept further actions (02) | TBD | TBD | TBD | Full illegal-pair matrix |
| 18 | Product | `APPROVED` request cancellable closer than 2 h before `window_start` (02, 06 §5) | TBD | TBD | TBD | Cases on both sides of the limit |
| 19 | Product | `validate` changes state or diverges from `submit` gate logic (03 endpoint 13) | TBD | TBD | TBD | Compare both on the same data; assert state unchanged |
| 20 | Product | Operator-scoped endpoints accept a client-supplied `operator_id`, or another operator's resource is reachable; list scoping differs for operator vs reviewer (03 Enforcement) | TBD | TBD | TBD | Caller x resource matrix: no session, owner, other operator, reviewer |
| 21 | Product | Registration accepts an `authorisation_level` other than `L1`, or the combined register does not create the auth user and the Operator profile together (03, 04) | TBD | TBD | TBD | Send the field in the register request; inspect both records |
| 22 | Product | `AuditLog` has an update/delete path, or a transition writes no audit entry (01, 02 Implementation note) | TBD | TBD | TBD | Check every transition; attempt update/delete |
| 23 | Product | Currency or weight band is stored instead of derived; a mass correction does not recalculate the band or revisits issued authorisations (01 Derived, never stored) | TBD | TBD | TBD | Correct source field and re-read |
| 24 | Product | `rule_reference` not persisted with a rejected request, so the detail view cannot show it after the original `422` (01, FlightRequest; 04) | TBD | TBD | TBD | Reject by a gate; reopen the request detail |
| 25 | Product | Request form pre-filters pickers against business rules, hiding gate failures (04) | TBD | TBD | TBD | Select an ineligible combination and submit |
| 26 | Product | Reviewer queue shows requests other than `UNDER_REVIEW`, is not sortable by submission time, or the UI allows reject without a note (04) | TBD | TBD | TBD | Check queue contents and reject action |
| 27 | Product | `data-testid` values missing or renamed; removed `operator-id-input` still present, or new login/register/session test IDs absent (04) | TBD | TBD | TBD | Inventory selectors per page |
| 28 | Product | Schema drifts from the docs (migrations `0001`-`0004`, e.g. a leftover `Operator.user_id`), or `flight_purpose` limit enforced in only one layer (01, 08) | TBD | TBD | TBD | Compare schema field by field; test limit via API and DB |

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
1. `SUSPENDED` operator: status code and body (05 #4); 03 says `403`, 05 calls it a placeholder. 05 and 07 name create, submit and approve as affected, 03 says "write endpoints"; which endpoints?
2. Is `ZC-2026.1 §4` the correct citation for an inactive zone (05 #5)? 06 §1.3 marks the row "Inferred" and 07 item 4 says "presumably ZONE by elimination"; which gate owns it?
3. Which gate reports a schedule overlap: "AIRCRAFT / TIME_WINDOW" (02) or only `TIME_WINDOW` (06 §1.4, §6; 06 §1.2, 07 §1 and 05 row 1 define `AIRCRAFT` as the weight-band check)? And is the response `409` (03 Error semantics) or `422`?
4. Missing `X-Reviewer-Id` on reviewer endpoints: `400` or `401` (03)?
5. Success status codes and request/response schemas are not defined in 03 (08 shows "200/201"); where are they specified?
6. Cancel from `SUBMITTED` is "narrow window" yet `SUBMITTED` is never observed at rest (02); how can it be tested?
7. Is the 2 h cancellation limit inclusive (02 "up to 2 hours")? Which "reviewer action" applies to an `APPROVED` request inside the limit (06 §5; no such transition in 02)?
8. How is the maintenance `complete` endpoint reached? It is not among the endpoints in 03 (02).
9. What does `validate` return on failure: all four gate results (04, 08) or only the first failure (03)?
10. Where is the full list of `data-testid` values defined? 04 says every interactive element carries one but gives only an example and the auth IDs.
