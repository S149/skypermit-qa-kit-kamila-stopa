# TC-OP-016: Login with a malformed request body returns 400

- **ID:** TC-OP-016
- **Title:** Login with a malformed request body returns 400
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** API
- **Priority:** Medium
- **Requirement:** `03-api-contract.md` "Error semantics" (`400`: "Malformed request body", body "validation detail"); "Authentication & authorisation" (`POST /auth/login`); TP003 G13.3
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/auth/login` is reachable.

## Test Data

Request body of `POST /api/v1/auth/login`: a malformed body.

[OPEN QUESTION: what the documentation counts as a "malformed request body" for `POST /auth/login` (invalid JSON, a missing email or password, a wrong type) is not stated, and neither are the required fields and the validation rules]

## Steps

1. Send `POST /api/v1/auth/login` with the malformed body from Test Data.

## Expected Result

The response status is `400`, and the body carries validation detail.

## Open Questions

- [OPEN QUESTION: what the documentation counts as a "malformed request body" for `POST /auth/login` (invalid JSON, a missing email or password, a wrong type) is not stated, and neither are the required fields and the validation rules]
- [OPEN QUESTION: the structure of the validation detail in the `400` body is not stated]
- [OPEN QUESTION: whether `400` applies to `POST /auth/login` at all is not stated explicitly; the contract defines `400` as "Malformed request body" in general]
