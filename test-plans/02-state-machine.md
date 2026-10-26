# Test Plan #TP002

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/02-state-machine.md

## Introduction

This plan covers `02-state-machine.md` ("Request Lifecycle"): the seven states of a `FlightRequest`, the legal transitions between them, the rule that every other transition is illegal and returns `409`, the cancellation deadline for `APPROVED` requests, the aircraft schedule overlap rule that affects which requests count, and the implementation note about a single place for state writes and a database trigger as a second line of defense.

## Goals

Verify that the lifecycle behaves as the documentation states:

- G1. A `FlightRequest` occupies exactly one of seven states at any time.
- G2. States.
  - G2.1. `DRAFT`: created, never submitted; no gates have run. Not terminal.
  - G2.2. `SUBMITTED`: transient. The submit call runs all four gates and leaves this state immediately; a request is never observed sitting in `SUBMITTED`. Not terminal.
  - G2.3. `UNDER_REVIEW`: all gates passed; awaiting a reviewer decision. Not terminal.
  - G2.4. `APPROVED`: authorised; still cancellable until the deadline (G5). Not terminal.
  - G2.5. `REJECTED`: failed a gate, or refused by a reviewer; `failing_gate` and `rejection_reason` are populated. Terminal. [OPEN QUESTION: whether `failing_gate` is populated when a reviewer refuses the request is not stated]
  - G2.6. `CANCELLED`: withdrawn by the operator. Terminal.
  - G2.7. `COMPLETED`: flight concluded. Set only by the maintenance completion endpoint, never inferred from elapsed time. Terminal. [OPEN QUESTION: the path, the caller and the response of the maintenance completion endpoint are not stated]
- G3. Legal transitions (one row of the transition table each).
  - G3.1. `DRAFT` --submit--> `SUBMITTED`, which resolves immediately into `UNDER_REVIEW` or `REJECTED`. Gates run synchronously; the caller never observes `SUBMITTED` at rest.
  - G3.2. `SUBMITTED` --gates pass (automatic)--> `UNDER_REVIEW`. It is not a caller-invoked action; it is part of the submit call's own outcome.
  - G3.3. `SUBMITTED` --gates fail (automatic)--> `REJECTED`, with `failing_gate` and `rejection_reason` populated. [OPEN QUESTION: the value of `rejection_reason` for a gate failure is not stated]
  - G3.4. `UNDER_REVIEW` --approve--> `APPROVED`. Reviewer-only (`X-Reviewer-Id`); writes a `ReviewAction` row.
  - G3.5. `UNDER_REVIEW` --reject--> `REJECTED`. Reviewer-only; `note` is required.
  - G3.6. `APPROVED` --complete--> `COMPLETED`. Maintenance endpoint only; never inferred from elapsed time.
  - G3.7. `DRAFT` --cancel--> `CANCELLED`. Operator-initiated.
  - G3.8. `SUBMITTED` --cancel--> `CANCELLED`. Operator-initiated; only reachable in the narrow window before the gates resolve the request automatically. [OPEN QUESTION: the narrow window is not defined, and it is not stated how a caller can reach it when gates run synchronously]
  - G3.9. `UNDER_REVIEW` --cancel--> `CANCELLED`. Operator-initiated.
  - G3.10. `APPROVED` --cancel--> `CANCELLED`. Operator-initiated, only up to 2 hours before `window_start` (G5).
- G4. Illegal transitions. Any `(from, action)` pair not listed in G3 is illegal and must return `409`, including pairs whose `from` looks like a plausible source state for the action. [OPEN QUESTION: the body of the `409` response for an illegal transition is not stated in this document]
  - G4.1. From `REJECTED`, any action is illegal.
  - G4.2. From `CANCELLED`, any action is illegal.
  - G4.3. From `COMPLETED`, any action is illegal.
  - G4.4. `submit` from `UNDER_REVIEW` (re-submitting something already under review) is illegal.
- G5. Cancellation deadline.
  - G5.1. Cancelling an `APPROVED` request is allowed only up to 2 hours before `window_start`.
  - G5.2. Closer than that, the cancel endpoint rejects it with `409`. This is a state-transition question, not a gate failure. [OPEN QUESTION: whether a cancellation exactly 2 hours before `window_start` is allowed is not stated]
- G6. Aircraft schedule overlap.
  - G6.1. Only `APPROVED` and `UNDER_REVIEW` requests are counted by the overlap check inside the `AIRCRAFT` / `TIME_WINDOW` gates. [OPEN QUESTION: the document names two gates ("`AIRCRAFT` / `TIME_WINDOW`") and does not say which one holds the overlap check]
  - G6.2. `DRAFT`, `REJECTED`, `CANCELLED` and `COMPLETED` requests are invisible to the overlap check.
  - G6.3. A request that passed `validate` can still fail at `submit` if another request for the same aircraft was approved in the interim. This is expected behaviour, not a bug to work around.
- G7. Implementation note.
  - G7.1. Every write to `FlightRequest.state` goes through one place in the code (not set ad hoc from multiple endpoint handlers), so the legal-transition check and the audit log write cannot be forgotten on any path.
  - G7.2. The provided migration also logs every state change via a database trigger, as a second line of defense (`supabase/migrations/0001_init.sql`).

## Risks

- R1. An illegal transition accepted instead of returning `409`, including a harmless-looking one such as re-submitting a request already `UNDER_REVIEW` (G4).
- R2. `SUBMITTED` observed at rest, because gates do not run synchronously inside submit (G2.2, G3.1).
- R3. `COMPLETED` set by elapsed time or through an endpoint other than the maintenance completion endpoint (G2.7, G3.6).
- R4. An `APPROVED` request cancelled closer than 2 hours before `window_start`, or a refused cancellation returned as something other than `409` or as a gate failure (G5).
- R5. A request in `DRAFT`, `REJECTED`, `CANCELLED` or `COMPLETED` counted by the overlap check, or `UNDER_REVIEW` / `APPROVED` not counted (G6.1, G6.2).
- R6. A request that passed `validate` failing at `submit` being treated as a defect instead of expected behaviour (G6.3).
- R7. A state write that bypasses the single place, so the transition check or the audit log write is skipped (G7.1).
- R8. A terminal state (`REJECTED`, `CANCELLED`, `COMPLETED`) left by any action (G4.1-G4.3).

## In Scope / Out Of Scope

### In Scope

- S1. The seven states and their meaning (G1, G2)
- S2. Legal transitions and their actors (G3)
- S3. The `409` rule for every other transition (G4)
- S4. The cancellation deadline for `APPROVED` requests (G5)
- S5. The effect of request states on the overlap check (G6)
- S6. The single place for state writes and the database trigger (G7)

### Out Of Scope

- O1. The source text of the cancellation deadline rule: `02-state-machine.md` (section "Rules that affect the state machine but live elsewhere") cites `docs/06-business-rules.md` §5 (`TSD-4 §6`) as its source. That document is not part of the input.

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
- API: the submit, approve, reject, cancel and maintenance completion endpoints, as named in the documentation (paths not given in this document)
- `X-Reviewer-Id` header
- Supabase migration `supabase/migrations/0001_init.sql` (state-change trigger)

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
