# Test Plan: FlightRequest Lifecycle (State Machine)

**Source docs:** `../skypermit/docs/02-state-machine.md` | **Version/date:** 2026-10-14 | **Author:** Kamila Stopa

## 1. Context
- **Test items:** `FlightRequest` state transitions (submit, approve, reject, complete, cancel) and `409` handling for any `(from, action)` pair not in the transition table (02).
- **Scope:** In: the 7 states, legal transitions, terminal states, cancellation deadline, schedule-overlap visibility by state, `failing_gate` / `rejection_reason` on rejection, `ReviewAction` row on `approve`. Out: gate rule details (06), API payload shapes (03), UI (04).
- **Assumptions & constraints:** 02 is the only source used here; details owned by other docs are not covered.
- **Stakeholders:** TBD.

## 2. Test strategy
- **Manual vs automated:** manual; automation TBD (not started unless requested).
- **Design techniques:** state transition testing (legal and illegal `(from, action)` pairs), decision table (action x state), boundary value analysis for the cancellation deadline.
- **Environment & data:** TBD; requires requests in each state, a reviewer ID (`X-Reviewer-Id`), and an `APPROVED` request with known `window_start`.
- **Retesting & regression:** re-run the full transition matrix after any change to state-write code or `supabase/migrations/0001_init.sql` (02, Implementation note).

## 3. Completion & suspension criteria
- **Completion:** every legal transition and every illegal pair executed; no open Critical/High defects; thresholds TBD.
- **Suspension / resumption:** suspend if states cannot be set up or the API is unavailable; resume once restored.

## 4. Risks
| # | Type | Risk (with doc ref) | Probability | Impact | Score | Mitigation |
|---|---|---|---|---|---|---|
| 1 | Product | A pair not in the transition table is accepted instead of returning `409`, including "harmless-looking" ones such as `submit` from `UNDER_REVIEW` (02, intro and table) | TBD | TBD | TBD | Illegal-pair matrix |
| 2 | Product | Terminal states (`REJECTED`, `CANCELLED`, `COMPLETED`) accept any further action (02, States) | TBD | TBD | TBD | Try every action from each terminal state |
| 3 | Product | `APPROVED` request is cancellable closer than 2 h before `window_start` (02, Rules elsewhere; source 06 §5) | TBD | TBD | TBD | Cases on both sides of the limit |
| 4 | Product | `submit` fails on overlap although `validate` passed, because another request for the same aircraft was approved in between; only `APPROVED` and `UNDER_REVIEW` count (02, Rules elsewhere) | TBD | TBD | TBD | Interleaved requests; check visibility per state |
| 5 | Product | `SUBMITTED` observed at rest, or `COMPLETED` set from elapsed time instead of the maintenance endpoint (02, States) | TBD | TBD | TBD | Inspect state after submit and after time passes |
| 6 | Product | `approve` / `reject` allowed without reviewer identity (`X-Reviewer-Id`), `reject` accepted without `note`, or no `ReviewAction` row written on `approve` (02, table) | TBD | TBD | TBD | Negative cases per reviewer action |
| 7 | Product | A state write bypasses the transition check or audit log write, which the doc says must not be possible on any path (02, Implementation note) | TBD | TBD | TBD | Verify an audit entry exists for every transition |

## 5. Roles, schedule & estimates
| Role | Responsibility |
|---|---|
| QA (Kamila Stopa) | Design and execute tests |
| Others | TBD |

| Activity | Estimate | Dates |
|---|---|---|
| Test case design | TBD | TBD |
| Execution and retest | TBD | TBD |

## 6. Deliverables & approval
- **Deliverables:** test cases (`test-cases/`), execution report, defect reports.
- **Approval:** TBD

## Open questions
1. Cancel from `SUBMITTED` is "only reachable in the narrow window" yet callers never observe `SUBMITTED` at rest: how can it be tested?
2. Is the 2-hour limit inclusive, and in which time zone is it measured?
3. How is the maintenance `complete` endpoint reached and authorised for testing?
4. Test environment, roles, schedule and estimates?
