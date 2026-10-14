# Test Plan: FlightRequest Lifecycle (State Machine)

**Source docs:** `../skypermit/docs/02-state-machine.md` (primary); 03, 05, 06 §1.4 and §5, 07 cited where they bear on the lifecycle | **Version/date:** 2026-10-14 | **Author:** Kamila Stopa

## 1. Context
- **Test items:** `FlightRequest` state transitions (submit, approve, reject, complete, cancel) and `409` handling for any `(from, action)` pair not in the transition table (02).
- **Scope:** In: the 7 states, legal transitions, terminal states, cancellation deadline, schedule-overlap visibility by state, `failing_gate` / `rejection_reason` on gate-failure rejection, `ReviewAction` row on `approve`. Out: gate rule details (06), API payload shapes (03), UI (04).
- **Assumptions & constraints:** 02 is the primary source; behavior owned by other docs is not covered beyond what 02 points to. The cancellation deadline and overlap rule are restated in 02 and owned by 06 §5 and §1.4. Where 02's prose and table differ (the prose omits `APPROVED` from the states that can reach `CANCELLED`), the table is treated as authoritative because 02 calls it the same information.
- **Stakeholders:** Operators (submit, cancel; 02, 03 #10), Reviewers (approve, reject; 02); "maintenance" appears only as an endpoint that completes a request (02), so it is not listed as a party; other roles TBD.

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
| 1 | Product | A pair not in the transition table is accepted instead of `409`, including "harmless-looking" ones such as `submit` from `UNDER_REVIEW` (02, intro and table) | TBD | TBD | TBD | Illegal-pair matrix |
| 2 | Product | Terminal states (`REJECTED`, `CANCELLED`, `COMPLETED`) accept any further action (02, States and table) | TBD | TBD | TBD | Try every action from each terminal state |
| 3 | Product | `APPROVED` request is cancellable closer than 2 h before `window_start`, or the refusal is not `409` (02, Rules elsewhere; source 06 §5) | TBD | TBD | TBD | Cases on both sides of the limit |
| 4 | Product | `submit` is refused on overlap (outcome undefined, see open question 5) although `validate` passed, because another request for the same aircraft was approved in between; only `APPROVED` and `UNDER_REVIEW` count (02, Rules elsewhere) | TBD | TBD | TBD | Interleaved requests; check visibility per state |
| 5 | Product | `SUBMITTED` observed at rest, or `COMPLETED` set from elapsed time instead of the maintenance endpoint (02, States) | TBD | TBD | TBD | Inspect state after submit and after time passes |
| 6 | Product | `approve` / `reject` allowed without reviewer identity (`X-Reviewer-Id`), `reject` accepted without `note`, or no `ReviewAction` row on `approve` (02, table); 02 names only `approve` as writing the row while 03 Reviewer says both endpoints do (open question 6) | TBD | TBD | TBD | Negative cases per reviewer action; check the row after `reject` |
| 7 | Product | `REJECTED` after a gate failure without `failing_gate` and `rejection_reason` populated (02, table and States) | TBD | TBD | TBD | Reject by each gate; check both fields |
| 8 | Product | A state write bypasses the legal-transition check or the audit log write because it is not routed through one place (02, Implementation note) | TBD | TBD | TBD | Verify an audit entry exists for every transition |
| 9 | Product | A `SUSPENDED` operator submits or a reviewer action is taken for one, with an undefined response and state outcome; still open (05 §1, 07 §3) | TBD | TBD | TBD | Submit as a suspended operator; record the response and the resulting state without assuming `403` |

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
2. Is the 2-hour limit inclusive? (02 says "up to 2 hours before `window_start`"; `window_start` is stored and compared in UTC, 01, 06 §1.4.)
3. How is the maintenance `complete` endpoint reached and authorised for testing? It is not among the endpoints in 03.
4. Which gate owns the overlap check: "AIRCRAFT / TIME_WINDOW" (02) or only `TIME_WINDOW` (06 §1.4, §6)? 06 §1.2, 07 §1 and 05 row 1 define `AIRCRAFT` as the weight-band check; 02 is the only doc placing overlap under it.
5. What does `submit` return and which state results on an overlap: `409` with the request staying `DRAFT` (03 Error semantics) or a gate failure `REJECTED` with `failing_gate = TIME_WINDOW` (06 §1.4, §6)?
6. Does `reject` also write a `ReviewAction` row (02 table names only `approve`; 03 Reviewer says both endpoints do)?
7. 06 §5 says inside the 2-hour limit the request "must proceed or be handled by reviewer action instead"; which reviewer action applies to an `APPROVED` request, given that 02 has no such transition?
8. For a reviewer `reject`, are `failing_gate` and `rejection_reason` populated, and from what (only `note` is required)? (02 States, `REJECTED`.)
9. `SUSPENDED` operator: response and state outcome on submit and approve are open (05 §1, 07 §3).
