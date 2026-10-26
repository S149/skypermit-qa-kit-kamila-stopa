# Test Plan #TP002

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: `../skypermit/docs/02-state-machine.md`

## Introduction
A `FlightRequest` occupies exactly one of seven states at any time: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`. Any transition not shown in the documentation is invalid and must return `409`, including transitions that look harmless, such as re-submitting something already `UNDER_REVIEW`. The documentation gives the lifecycle as a diagram and, because the diagram's cancel arrows and gate pass/fail arrows cross visually, as a table with one row per legal transition; both carry the same information.

## Goals
- Verify that a `FlightRequest` is in exactly one of the seven states at any time.
- Verify that the diagram and the transition table describe the same set of legal transitions.
- Verify every legal transition (one row of the table each) and that it ends in the documented state:
  - `DRAFT` → submit → `SUBMITTED`, immediately followed by `UNDER_REVIEW` or `REJECTED`; gates run synchronously and the caller never observes `SUBMITTED` at rest.
  - `SUBMITTED` → gates pass (automatic) → `UNDER_REVIEW`; not a caller-invoked action, part of the submit call's own outcome.
  - `SUBMITTED` → gates fail (automatic) → `REJECTED`; `failing_gate` / `rejection_reason` populated.
  - `UNDER_REVIEW` → approve → `APPROVED`; reviewer-only (`X-Reviewer-Id`); writes a `ReviewAction` row.
  - `UNDER_REVIEW` → reject → `REJECTED`; reviewer-only; `note` required.
  - `APPROVED` → complete → `COMPLETED`; maintenance endpoint only, never inferred from elapsed time.
  - `DRAFT` / `SUBMITTED` / `UNDER_REVIEW` → cancel → `CANCELLED`; operator-initiated.
  - `APPROVED` → cancel → `CANCELLED`; operator-initiated, only up to 2 hours before `window_start`.
- Verify that every `(from, action)` pair not listed as legal returns `409`, including pairs whose source state looks like a plausible source for the action (for example `submit` from `UNDER_REVIEW`).
- Verify the terminal states: `REJECTED`, `CANCELLED` and `COMPLETED` are terminal, and `REJECTED`, `CANCELLED` or `COMPLETED` to anything returns `409`. `DRAFT`, `SUBMITTED`, `UNDER_REVIEW` and `APPROVED` are non-terminal.
- Verify the meaning of each state: `DRAFT` (created, never submitted, no gates have run); `SUBMITTED` (transient, the submit call runs all four gates and leaves this state immediately, a request should never be observed sitting in it); `UNDER_REVIEW` (all gates passed, awaiting a reviewer decision); `APPROVED` (authorised, still cancellable until the deadline); `REJECTED` (failed a gate, or refused by a reviewer; `failing_gate` and `rejection_reason` populated); `CANCELLED` (withdrawn by the operator); `COMPLETED` (flight concluded, set only by the maintenance completion endpoint).
- Verify that gate pass and gate fail are automatic outcomes of the submit call, not caller-invoked actions.
- Verify the cancellation deadline: cancelling an `APPROVED` request closer than 2 hours before `window_start` is rejected by the cancel endpoint with `409` (a state-transition question, not a gate failure).
- Verify the aircraft schedule overlap check: only `APPROVED` and `UNDER_REVIEW` requests are counted; `DRAFT`, `REJECTED`, `CANCELLED` and `COMPLETED` are invisible to it.
- Verify that a request that passed `validate` can still fail at `submit` if another request for the same aircraft was approved in the interim (expected behaviour, not a bug to work around).
- Verify that every write to `FlightRequest.state` goes through one place in the code (legal-transition check and audit log write), and that every state change is also logged by the database trigger as a second line of defense.
- [OPEN QUESTION: the maintenance completion endpoint (path, method, caller) is not defined in the document]
- [OPEN QUESTION: the document says `SUBMITTED` → cancel is "only reachable in the narrow window before gates resolve it automatically" and also that a caller never observes `SUBMITTED` at rest; how can `SUBMITTED` → cancel be exercised in a test]
- [OPEN QUESTION: the document says `REJECTED` has `failing_gate` and `rejection_reason` populated, including when refused by a reviewer; what is `failing_gate` after a reviewer rejection, which is not a gate failure]
- [OPEN QUESTION: the `409` response body is not defined in the document]
- [OPEN QUESTION: the document says the overlap check runs "inside the `AIRCRAFT` / `TIME_WINDOW` gates" without saying which of the two gates is named in `failing_gate` for an overlap]
- [OPEN QUESTION: the document does not say what happens to the exact 2-hour boundary (cancel exactly 2 hours before `window_start`)]

## Risks
- A transition that looks harmless but is not listed is accepted instead of returning `409`.
- A caller observes `SUBMITTED` at rest because the gates did not resolve it immediately.
- `COMPLETED` is set from elapsed time or from somewhere other than the maintenance completion endpoint.
- Cancelling an `APPROVED` request closer than 2 hours before `window_start` is accepted, or is rejected with a status other than `409`.
- A request that passed `validate` fails at `submit` because another request for the same aircraft was approved in the interim. The documentation states this is expected behaviour.
- A state write bypasses the single place in the code, so the legal-transition check or the audit log write is skipped on some path.
- The application-level audit write and the database trigger (`supabase/migrations/0001_init.sql`) disagree, or a state change is not logged.
- A terminal state is left by some transition.
- Requests in a state other than `APPROVED` or `UNDER_REVIEW` are wrongly counted by the aircraft overlap check.
- The diagram and the table are read differently, because the cancel arrows and the gate pass/fail arrows cross visually.

## In Scope / Out Of Scope
**In Scope:**
- **States:** the seven states and their meanings, as listed in Goals.
- **Terminal / non-terminal flags** of each state.
- **Legal transitions:** the ten rows of the transition table (diagram and table).
- **Illegal transitions:** every other `(from, action)` pair returns `409`.
- **Cancellation deadline:** `APPROVED` cancel only up to 2 hours before `window_start`, otherwise `409`.
- **Aircraft schedule overlap:** counts only `APPROVED` and `UNDER_REVIEW`.
- **Implementation note:** a single place in the code for every write to `FlightRequest.state`; database trigger as a second line of defense.

**Out Of Scope** (each item is handed to another document by `02-state-machine.md`):
- The source of the cancellation deadline: `docs/06-business-rules.md` §5 (`TSD-4 §6`), per "Rules that affect the state machine but live elsewhere".
- The audit log trigger definition: `supabase/migrations/0001_init.sql`, per "Implementation note".

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
- Supabase (database trigger and migration `0001_init.sql`)
- API: submit, validate, cancel, approve / reject, maintenance completion endpoint

## Schedule and Estimations / People
Schedule and Estimations:
- Start date / End date: [OPEN QUESTION: start and end dates]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation]
- Testing: [OPEN QUESTION: estimation]
- Create Test Report: [OPEN QUESTION: estimation]

People: Kamila Stopa, Senior Test Engineer
