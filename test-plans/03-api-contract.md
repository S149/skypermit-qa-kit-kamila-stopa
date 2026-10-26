# Test Plan #TP003

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: `../skypermit/docs/03-api-contract.md`

## Introduction
The API contract defines the REST API under base path `/api/v1` (JSON in, JSON out), implemented as Next.js route handlers under `app/api/v1/...`. It covers the original 16 numbered endpoints (registry, reference data, flight requests, reviewer actions); four authentication endpoints (`POST /operators` as registration, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) listed without a number, because `POST /operators` is reused as endpoint 1; an extension with `GET /pilots` and `GET /aircraft` list endpoints; the error semantics (`400`, `401`, `403`, `404`, `409`, `422`); and the gate pipeline shared by `submit` and `validate`. The contract originally had no authentication except reviewer endpoints; operators now log in through Supabase Auth (session cookie), while reviewers still do not log in and are identified only by the `X-Reviewer-Id` header, a static identity label, not real authentication.

## Goals
- Verify the authentication endpoints:
  - `POST /operators`: creates the Supabase Auth user and the Operator profile in one request, then signs the caller in (session cookie). It is the same action as endpoint 1 ("register" and "create an operator").
  - `POST /auth/login`: logs in with email and password and sets the session cookie.
  - `POST /auth/logout`: clears the session.
  - `GET /auth/me`: returns the logged-in operator's profile, or `401`.
- Verify that the original 16 endpoints keep their numbers 1–16 and the four authentication endpoints stay unnumbered (they were added after the original set was closed; the documentation says not to renumber 1–16 if the contract is regenerated).
- Verify that registration always creates an operator at `L1` (least privilege) and that `authorisation_level` is not a registration-form field (raising it is an out-of-band admin action).
- Verify server-derived enforcement: every operator-scoped endpoint (pilots, aircraft, flight-requests create / list / submit / cancel / validate) derives `operator_id` from the session, accepts it neither as a request field nor as a query param, and does not trust a client claim about which operator is acting.
- Verify that a caller with no session gets `401`, and an authenticated operator reaching for another operator's resource gets `403`.
- Verify the registry endpoints:
  - 1 `POST /operators`: register an operator.
  - 2 `GET /operators/{id}`: retrieve an operator (self, or any reviewer).
  - 3 `POST /pilots`: register a pilot under the logged-in operator.
  - 4 `GET /pilots/{id}`: retrieve a pilot including derived currency status (owning operator, or any reviewer).
  - 5 `POST /aircraft`: register an aircraft under the logged-in operator.
  - 6 `GET /aircraft/{id}`: retrieve an aircraft including derived weight band (owning operator, or any reviewer).
- Verify the extension endpoints `GET /pilots` and `GET /aircraft`: they list the logged-in operator's own pilots / aircraft, each row includes the same derived field as the single-entity `GET`, and there is no `operator_id` query param (it was a query param before operator auth existed; scoping now comes from the session).
- Verify the reference-data endpoints 7 `GET /zones` (list the zone catalogue) and 8 `GET /zones/{code}` (retrieve one zone), and that zones have no create / update endpoints in this API.
- Verify the flight-request endpoints:
  - 9 `POST /flight-requests`: creates a request in `DRAFT` under the logged-in operator.
  - 10 `POST /flight-requests/{id}/submit`: runs all four gates and moves to `UNDER_REVIEW` or `REJECTED` (owning operator only).
  - 11 `GET /flight-requests/{id}`: owning operator, or any reviewer.
  - 12 `GET /flight-requests`: list filtered by `state`, `zone_code` and date range.
  - 13 `POST /flight-requests/{id}/validate`: dry-run (owning operator, or any reviewer).
  - 14 `POST /flight-requests/{id}/cancel`: cancel, subject to the deadline (owning operator only).
- Verify reviewer-or-owner reads: `GET` on a single pilot / aircraft / operator / flight-request, and `POST .../validate`, accept either the owning operator's session or any `X-Reviewer-Id` header.
- Verify list scoping for `GET /flight-requests`: forced to the session's `operator_id` when there is no reviewer header; unscoped (any operator, optional filters) when there is one; a reviewer may also filter by `operator_id`.
- Verify `validate` (endpoint 13): it runs every gate exactly as `submit` would, in the same order, never changes state, and is cheap and safe to call repeatedly (it backs the frontend's "check before submitting" button and lets the reviewer detail view show all four gate results without side effects). `submit` and `validate` call a single shared gate-pipeline function, with no duplicated gate logic.
- Verify the reviewer endpoints 15 `POST /flight-requests/{id}/approve` and 16 `POST /flight-requests/{id}/reject` (with a required note): both require `X-Reviewer-Id`, write a `ReviewAction` row and move the request's state (see `02-state-machine.md`); both return `400` if `X-Reviewer-Id` is missing.
- Verify the six error statuses and their bodies:
  - `400`: malformed request body (validation detail).
  - `401`: not authenticated, no operator session and no `X-Reviewer-Id` (error detail).
  - `403`: authenticated but not permitted for this resource: wrong operator's resource, or the pre-existing `SUSPENDED`-operator precondition (error detail).
  - `404`: entity not found (no body).
  - `409`: invalid state transition, or a scheduling conflict between requests (conflict detail).
  - `422`: business rule violation with the failing gate identified (structured body).
- Verify the `401` vs `403` distinction (`401` is "who are you", `403` is "I know who you are and it's not allowed") and the `409` vs `422` distinction (`409` means the request cannot be attempted at all, wrong state or scheduling conflict; `422` means it was attempted and a business rule refused it).
- Verify the `422` body: `failing_gate` (one of `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`), `rule_reference` (document + section, real values from `docs/06-business-rules.md` §6 as corrected by `docs/07-clarifications.md`, used verbatim, never invented) and `message` (human-readable, specific to the failure, written for an operator, not a developer).
- Verify that the `422` example value `TSD-4 §3.2` is illustrative only and is not returned as a real citation (real examples: `OH-1 §2.1` for a pilot rating that does not cover the zone class; `ZC-2026.1 §2` for an altitude above the zone ceiling).
- Verify the gate pipeline: fixed order `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`, stopping at the first failure; the response names the first gate that failed.
- Verify that the weight-band check belongs to the `AIRCRAFT` gate, not `ZONE`, despite the source document's literal wording.
- Verify that `Operator.status = SUSPENDED` is a separate precondition on the write endpoints, not part of the gate pipeline.
- [OPEN QUESTION: the document lists the `SUSPENDED`-operator precondition under `403` and refers to `docs/05-open-questions.md` §1 before implementing it; the status code and response body are not defined in this document, and which write endpoints it covers is not listed]
- [OPEN QUESTION: success status codes and response bodies of the endpoints are not defined]
- [OPEN QUESTION: request and response field schemas of the endpoints are not defined]
- [OPEN QUESTION: the document defines `401` as "no operator session and no `X-Reviewer-Id`" but says reviewer endpoints return `400` when `X-Reviewer-Id` is missing; which status applies to a reviewer endpoint called with no session and no header]
- [OPEN QUESTION: pagination, sort order and query parameter names for the date range filter of `GET /flight-requests` are not defined]
- [OPEN QUESTION: the `404` body is shown as "—", and the response of `POST /auth/login` for wrong credentials is not defined]
- [OPEN QUESTION: whether `GET /zones` and `GET /zones/{code}` require a session or reviewer header is not defined]
- [OPEN QUESTION: the document says `validate` runs every gate "exactly as `submit` would" and the pipeline stops at the first failure, but also says `validate` lets the reviewer detail view show "all four gate results"; whether `validate` reports gates after the first failure is not defined]

## Risks
- The 16 original endpoints are renumbered or confused with the unnumbered authentication endpoints, so "endpoint 9" means different things in different versions of the document.
- A client-supplied `operator_id` (request field or query param) is accepted, or a client claim about the acting operator is trusted (authentication theatre).
- `401` and `403` are mixed up (no session or reviewer header vs. wrong operator's resource / `SUSPENDED` operator).
- `409` and `422` are mixed up (cannot be attempted vs. attempted and refused by a business rule).
- A registration form can set `authorisation_level`, or registration creates an operator above `L1`.
- A reviewer header grants reviewer access to endpoints that are owner-only (`submit`, `cancel`), or a reviewer cannot read another operator's data where the contract says they can.
- `GET /flight-requests` leaks other operators' requests to a caller without a reviewer header.
- `validate` changes state, or its gate logic diverges from `submit` because the pipeline is duplicated.
- Gates are evaluated in the wrong order, or the response names a later gate instead of the first one that failed.
- The weight-band check is evaluated in the `ZONE` gate instead of `AIRCRAFT`, following the source document's literal wording.
- A `422` cites an invented or illustrative `rule_reference` (`TSD-4 §3.2`) instead of the real citation, or the message is written for a developer.
- Reviewer endpoints work without `X-Reviewer-Id` instead of returning `400`.
- The `X-Reviewer-Id` header is a static identity label, not real authentication, so any caller can supply it.
- A `SUSPENDED` operator can use write endpoints; the handling of this precondition depends on `docs/05-open-questions.md` §1.
- Zones can be created or updated through the API.
- The contract is regenerated and the `GET /pilots` / `GET /aircraft` extension is dropped.

## In Scope / Out Of Scope
**In Scope:**
- **Base path and format:** `/api/v1`, JSON in, JSON out; Next.js route handlers under `app/api/v1/...`.
- **Authentication & authorisation:** `POST /operators` (register), `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`; session cookie; reviewers identified only by `X-Reviewer-Id`; server-derived `operator_id`; `401` / `403` enforcement; reviewer-or-owner reads; `GET /flight-requests` list scoping; registration at `L1`.
- **Registry (endpoints 1–6):** operators, pilots (with derived currency status), aircraft (with derived weight band).
- **Extension:** `GET /pilots` and `GET /aircraft` for the logged-in operator.
- **Reference data (endpoints 7–8):** `GET /zones`, `GET /zones/{code}`; no create / update endpoints.
- **Flight requests (endpoints 9–14):** create, submit, get, list (filters `state`, `zone_code`, date range, `operator_id` for reviewers), validate, cancel.
- **Reviewer (endpoints 15–16):** approve, reject with required note; `ReviewAction` row; `400` without `X-Reviewer-Id`.
- **Error semantics:** statuses `400`, `401`, `403`, `404`, `409`, `422` and their meanings; `422` body (`failing_gate`, `rule_reference`, `message`).
- **Gate pipeline:** order `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`; stops at the first failure; shared by `submit` and `validate`; `SUSPENDED` operator as a separate precondition on write endpoints.

**Out Of Scope** (each item is handed to another document by `03-api-contract.md`):
- Gate rules in detail (what each gate checks) and the real `rule_reference` values: `docs/06-business-rules.md` and `docs/07-clarifications.md`, per "The `422` body" and "Gate pipeline".
- State transitions behind approve / reject (and the state machine in general): `02-state-machine.md`, per "Reviewer — requires `X-Reviewer-Id`".
- The `SUSPENDED`-operator precondition details: `docs/05-open-questions.md` §1, per "Gate pipeline".
- The frontend usage of these endpoints (registry list, pickers, queue detail view): `docs/04-frontend-spec.md`, per "Registry" and "Authentication & authorisation".
- The gate implementation status and the weight-band explanation: `CLAUDE.md` of the application, per "Gate pipeline".
- Zone data management: `supabase/seed.sql` and `supabase/SETUP.md`, per "Reference data".
- The operator registration handler `app/api/v1/operators/route.ts`, per "Authentication & authorisation" (`authorisation_level` is no longer self-service).

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
- REST API (`/api/v1`, JSON)
- Next.js route handlers
- Supabase Auth (session cookie)

## Schedule and Estimations / People
Schedule and Estimations:
- Start date / End date: [OPEN QUESTION: start and end dates]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation]
- Testing: [OPEN QUESTION: estimation]
- Create Test Report: [OPEN QUESTION: estimation]

People: Kamila Stopa, Senior Test Engineer
