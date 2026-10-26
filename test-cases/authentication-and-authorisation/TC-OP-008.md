# TC-OP-008: Registration with a malformed request body returns 400

- **ID:** TC-OP-008
- **Title:** Registration with a malformed request body returns 400
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** API
- **Priority:** Medium
- **Requirement:** `03-api-contract.md` "Error semantics" (`400`: "Malformed request body", body "validation detail"); "Authentication & authorisation" (`POST /operators`); TP003 G13.3
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.

## Test Data

Request body of `POST /api/v1/operators`: a malformed body.

[OPEN QUESTION: what the documentation counts as a "malformed request body" for `POST /operators` (invalid JSON, a missing required field, a wrong type) is not stated, and neither are the required fields and the validation rules]

## Steps

1. Send `POST /api/v1/operators` with the malformed body from Test Data.

## Expected Result

The response status is `400`, and the body carries validation detail.

## Open Questions

- [OPEN QUESTION: what the documentation counts as a "malformed request body" for `POST /operators` (invalid JSON, a missing required field, a wrong type) is not stated, and neither are the required fields and the validation rules]
- [OPEN QUESTION: the structure of the validation detail in the `400` body is not stated]
- [OPEN QUESTION: whether an operator is created in any form (Auth user or profile) when the request returns `400` is not stated]
