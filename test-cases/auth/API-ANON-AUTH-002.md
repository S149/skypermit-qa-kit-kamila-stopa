# API-ANON-AUTH-002: Operator login with valid credentials opens a session for that operator

- **ID:** API-ANON-AUTH-002
- **Title:** Operator login with valid credentials opens a session for that operator
- **Doc ref:** `03-api-contract.md`, Authentication & authorisation (`POST /auth/login`, `GET /auth/me`); `04-frontend-spec.md`, Operator portal (Login and register pages)
- **Priority:** Medium

## Preconditions
- An operator is already registered with a known `email` and `password`.
- The caller has no session and sends no `X-Reviewer-Id` header.

## Test data (optional)
- Auth credentials: the `email` and `password` of the registered operator.

## Steps
1. Send `POST /api/v1/auth/login` with the `email` and `password` above.
2. Send `GET /api/v1/auth/me` with the session cookie set by step 1.

## Expected result
`GET /api/v1/auth/me` returns the profile of the operator registered with the `email` used in step 1.

## Actual result (optional)
<!-- Leave empty. Filled in during execution. -->

## Dependencies / environment (optional)
- TBD: test environment is not defined in the docs.
- TBD: the docs do not state the status code or body of a successful `POST /auth/login`; only that it "sets the session cookie".
- Needs a registered operator; one can be created as in `API-ANON-AUTH-001`. Registration also signs the caller in, so step 1 must be sent without that session.

## Postconditions (optional)
- None stated in the docs.

## Rationale
Covers the rule that an operator logs in with email and password and that the session set by login identifies that operator (`/auth/me`). No matching risk was found in `test-plans/`.
