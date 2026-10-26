# Test Plan #TP003

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/03-api-contract.md

## Introduction

This plan covers `03-api-contract.md` ("API Contract"): the REST API under base path `/api/v1` (JSON in, JSON out), implemented as Next.js route handlers under `app/api/v1/...`. It covers the original 16 numbered endpoints (registry, reference data, flight requests, reviewer actions); four authentication endpoints (`POST /operators` as registration, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) listed without a number; the `GET /pilots` and `GET /aircraft` list extension; the error semantics (`400`, `401`, `403`, `404`, `409`, `422`); and the gate pipeline shared by `submit` and `validate`. The contract originally had no authentication except for the reviewer endpoints. Operators now log in through Supabase Auth (session cookie); reviewers still do not log in and are identified only by the `X-Reviewer-Id` header, a static identity label, not real authentication.

## Goals

Verify that the API behaves as the contract states:

- G1. General.
  - G1.1. The base path is `/api/v1`.
  - G1.2. Requests and responses are JSON.
  - G1.3. The endpoints are implemented as Next.js route handlers under `app/api/v1/...`.
- G2. Identity model.
  - G2.1. Operators log in (real login and registration through Supabase Auth, session cookie).
  - G2.2. Reviewers do not log in: the reviewer identity is the `X-Reviewer-Id` header, a static identity label, not real authentication.
- G3. Authentication endpoints. They are listed with `—` instead of a number, deliberately, because they were added after the original set of 16 was closed (with explicit sign-off, not guessed).
  - G3.1. `POST /operators`: register. It creates the Supabase Auth user and the Operator profile in one request, then signs the caller in (session cookie). It doubles as endpoint 1: "register" and "create an operator" are the same action.
  - G3.2. `POST /auth/login`: log in with email and password; sets the session cookie.
  - G3.3. `POST /auth/logout`: clear the session.
  - G3.4. `GET /auth/me`: the logged-in operator's profile, or `401`.
  - G3.5. The original endpoints keep their numbers 1-16 and the four authentication endpoints stay unnumbered; if the contract is regenerated, the numbers 1-16 are not renumbered to make room.
- G4. Enforcement is server-derived, not client-supplied.
  - G4.1. Every operator-scoped endpoint (pilots, aircraft, flight-requests create / list / submit / cancel / validate) derives `operator_id` from the session. None of them accepts it as a request field or a query param, and none trusts a client claim about which operator is acting.
  - G4.2. A caller with no session gets `401`.
  - G4.3. An authenticated operator reaching for another operator's resource gets `403`.
- G5. Reviewer-or-owner reads.
  - G5.1. `GET` on a single pilot, aircraft, operator or flight-request, and `POST .../validate`, accept either an owning operator's session or any `X-Reviewer-Id` header.
  - G5.2. `GET /flight-requests` (list) is forced to the session's `operator_id` when there is no reviewer header.
  - G5.3. `GET /flight-requests` (list) is unscoped (any operator, optional filters) when there is a reviewer header; this is how the reviewer queue works across every operator.
- G6. `authorisation_level` is no longer self-service.
  - G6.1. Registration always creates an operator at `L1` (least privilege).
  - G6.2. Raising the level is an out-of-band admin action, not a registration-form field (`app/api/v1/operators/route.ts`).
- G7. Registry endpoints.
  - G7.1. 1 `POST /operators`: register an operator (see G3.1).
  - G7.2. 2 `GET /operators/{id}`: retrieve an operator (self, or any reviewer).
  - G7.3. 3 `POST /pilots`: register a pilot under the logged-in operator.
  - G7.4. 4 `GET /pilots/{id}`: retrieve a pilot, including derived currency status (owning operator, or any reviewer).
  - G7.5. 5 `POST /aircraft`: register an aircraft under the logged-in operator.
  - G7.6. 6 `GET /aircraft/{id}`: retrieve an aircraft, including derived weight band (owning operator, or any reviewer).
- G8. Extension beyond the original 16: list endpoints, added with explicit sign-off.
  - G8.1. `GET /pilots` and `GET /aircraft` list the logged-in operator's own pilots / aircraft.
  - G8.2. Each row includes the same derived field as the single-entity `GET`.
  - G8.3. There is no `operator_id` query param (it was a query param before operator auth existed; scoping now comes from the session).
  - G8.4. If the contract is regenerated from a source document, these list endpoints are folded in rather than dropped.
- G9. Reference data.
  - G9.1. 7 `GET /zones`: list the zone catalogue.
  - G9.2. 8 `GET /zones/{code}`: retrieve one zone.
  - G9.3. Zones have no create or update endpoints in this API; they are managed as reference data.
- G10. Flight request endpoints.
  - G10.1. 9 `POST /flight-requests`: create a request in `DRAFT`, under the logged-in operator.
  - G10.2. 10 `POST /flight-requests/{id}/submit`: run all four gates; move to `UNDER_REVIEW` or `REJECTED` (owning operator only).
  - G10.3. 11 `GET /flight-requests/{id}`: retrieve a request (owning operator, or any reviewer).
  - G10.4. 12 `GET /flight-requests`: list, filtered by `state`, `zone_code`, date range, scoped to the logged-in operator; a reviewer instead gets every operator and may also filter by `operator_id`.
  - G10.5. 13 `POST /flight-requests/{id}/validate`: dry-run all gates without changing state (owning operator, or any reviewer).
  - G10.6. 14 `POST /flight-requests/{id}/cancel`: cancel, subject to the deadline (owning operator only).
- G11. `validate` (endpoint 13).
  - G11.1. It runs every gate exactly as `submit` would, in the same order.
  - G11.2. It never changes state.
  - G11.3. The gate pipeline is a single shared function that both `submit` and `validate` call; the gate logic is not duplicated between them.
  - G11.4. It exists so that the frontend's "check before submitting" button is cheap and safe to call repeatedly, and so that the reviewer detail view can show all four gate results without side effects.
- G12. Reviewer endpoints (require `X-Reviewer-Id`).
  - G12.1. 15 `POST /flight-requests/{id}/approve`: approve a request under review.
  - G12.2. 16 `POST /flight-requests/{id}/reject`: reject a request under review, with a required note.
  - G12.3. Both write a `ReviewAction` row and move the request's state (see `02-state-machine.md`).
  - G12.4. Both return `400` if `X-Reviewer-Id` is missing.
- G13. Error semantics: six statuses carry meaning (four originally, plus `401` and `403` added alongside operator auth). [OPEN QUESTION: the document defines `401` as "no operator session and no `X-Reviewer-Id`" and also says reviewer endpoints return `400` when `X-Reviewer-Id` is missing; which status applies to a reviewer endpoint called with no session and no header]
  - G13.1. `409` means the request cannot be attempted at all (wrong state, scheduling conflict); `422` means it was attempted and a business rule refused it.
  - G13.2. `401` is "who are you" (no session, no reviewer header); `403` is "I know who you are and it is not allowed" (wrong operator's resource, or the `SUSPENDED`-operator precondition, see G15.5).
  - G13.3. `400`: malformed request body; the body carries validation detail.
  - G13.4. `401`: not authenticated (no operator session and no `X-Reviewer-Id`); the body carries error detail.
  - G13.5. `403`: authenticated, but not permitted for this resource; the body carries error detail.
  - G13.6. `404`: entity not found; no body is specified.
  - G13.7. `409`: invalid state transition, or a scheduling conflict between requests; the body carries conflict detail.
  - G13.8. `422`: business rule violation, with the failing gate identified; the body is structured (G14).
- G14. The `422` body names the gate that failed and cites the rule that governed the decision, so a rejection can be traced back to its source.
  - G14.1. `failing_gate` is one of `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`; gates evaluate in that order and the response names the first gate that failed.
  - G14.2. `rule_reference` is the document and section responsible for the rule. The real values are in `docs/06-business-rules.md` §6 (as corrected by `docs/07-clarifications.md`) and are used verbatim, not invented.
  - G14.3. `message` is human-readable, specific to the failure, written for an operator, not for a developer.
  - G14.4. The example `TSD-4 §3.2` in the contract is illustrative only and is not one of the real citations. Real values are, for example, `OH-1 §2.1` for a pilot rating that does not cover the zone class and `ZC-2026.1 §2` for an altitude that exceeds the zone ceiling.
- G15. Gate pipeline (shared by `submit` and `validate`).
  - G15.1. The gates are evaluated in a fixed order: 1. `PILOT`, 2. `AIRCRAFT`, 3. `ZONE`, 4. `TIME_WINDOW`.
  - G15.2. Evaluation stops at the first failure.
  - G15.3. All four gates are fully specified in `docs/06-business-rules.md` as corrected by `docs/07-clarifications.md`.
  - G15.4. The weight-band check belongs to `AIRCRAFT`, not `ZONE`, despite the literal wording of the source document.
  - G15.5. `Operator.status = SUSPENDED` is a separate precondition on the write endpoints themselves, not part of this pipeline. [OPEN QUESTION: the status code and response body for a blocked suspended operator are not defined in this document]
- G16. [OPEN QUESTION: the request body fields, required and optional, of the `POST` endpoints and the success status codes of all endpoints are not stated in this document]
- G17. [OPEN QUESTION: whether `GET /zones` and `GET /zones/{code}` require a session or an `X-Reviewer-Id` header is not stated; the contract states `401` for operator-scoped endpoints only]

## Risks

- R1. `operator_id` taken from a request field, a query param or a client claim instead of the session (G4.1, G8.3).
- R2. An operator reading or changing another operator's resource instead of getting `403` (G4.3).
- R3. `401` and `403` confused, or `409` and `422` confused (G13.1, G13.2).
- R4. `validate` changing state, or the gate logic duplicated between `submit` and `validate` so the two diverge (G11).
- R5. Reviewer endpoints working without `X-Reviewer-Id` instead of returning `400` (G12.4).
- R6. The reviewer list not unscoped, or the operator list not scoped to the session (G5.2, G5.3, G10.4).
- R7. `authorisation_level` settable through registration instead of always starting at `L1` (G6).
- R8. `rule_reference` values invented instead of taken verbatim from `docs/06-business-rules.md` §6 (G14.2).
- R9. A gate failure reported for a later gate instead of the first failing gate (G14.1, G15.2).
- R10. The weight-band check implemented under `ZONE` (G15.4).
- R11. A suspended operator's blocked request returned as a `422` with a `failing_gate` (G15.5).
- R12. Renumbering endpoints 1-16 when the contract is regenerated (G3.5).

## In Scope / Out Of Scope

### In Scope

- The authentication endpoints and the identity model (G2, G3, G6)
- Server-derived enforcement and reviewer-or-owner reads (G4, G5)
- Registry, extension, reference-data, flight-request and reviewer endpoints (G7-G12)
- Error semantics and the `422` body (G13, G14)
- Gate pipeline order and sharing (G15, G11)

### Out Of Scope

- The gate rules themselves: `03-api-contract.md` (section "Gate pipeline") says they are fully specified in `docs/06-business-rules.md` as corrected by `docs/07-clarifications.md`. Those documents are not part of the input.
- The behaviour of a `SUSPENDED` operator: `03-api-contract.md` (section "Gate pipeline", last paragraph, and "Error semantics") hands it to `docs/05-open-questions.md` §1. That document is not part of the input.
- The full explanation of why the weight-band check belongs to `AIRCRAFT`: `03-api-contract.md` (section "Gate pipeline") hands it to the "gate implementation status" section of `CLAUDE.md`. That file is not part of the input.
- Management of zone reference data: `03-api-contract.md` (section "Reference data") hands it to `supabase/seed.sql` and `supabase/SETUP.md`. Those files are not part of the input.

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
- REST API under `/api/v1` (JSON), Next.js route handlers, as named in the documentation
- Supabase Auth (session cookie), as named in the documentation
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
