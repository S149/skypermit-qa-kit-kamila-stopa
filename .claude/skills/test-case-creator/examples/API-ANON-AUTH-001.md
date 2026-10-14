# API-ANON-AUTH-001: Operator registration creates the operator and signs the caller in

- **ID:** API-ANON-AUTH-001
- **Title:** Operator registration creates the operator and signs the caller in
- **Doc ref:** `03-api-contract.md, Authentication & authorisation (`POST /operators`, `GET /auth/me`)`; `04-frontend-spec.md, Operator portal (Login and register pages)`
- **Priority:** Medium

## Preconditions
- The caller has no session and sends no `X-Reviewer-Id` header.
- No operator exists with the `email` or `national_id` used below (both are unique, 01).

## Test data (optional)
- Auth credentials: `email` (unused), `password`.
- Operator profile fields: `legal_name`, `national_id` (unused), `phone`, `address_line`, `city`, `postal_code`.

## Steps
1. Send `POST /api/v1/operators` with the test data above.
2. Send `GET /api/v1/auth/me` with the session cookie returned by step 1.

## Expected result
`GET /api/v1/auth/me` returns the profile of the operator registered in step 1.

## Actual result (optional)
<!-- Leave empty. Filled in during execution. -->

## Dependencies / environment (optional)
- TBD: test environment is not defined in the docs.
- TBD: the docs do not state the status code or body of a successful `POST /operators`.
- TBD: the docs do not state which profile fields are required or their formats (see open questions in `test-plans/data-model.md`).

## Postconditions (optional)
- None stated in the docs.

## Rationale
Covers the rule that one registration request creates the Supabase Auth user and the Operator profile and then signs the caller in (session cookie). Corresponds to risk 17 in `test-plans/skypermit-application.md` (registration creates only one of the auth user and the Operator profile).
