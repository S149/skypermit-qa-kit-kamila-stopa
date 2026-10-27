# TC-OP-003: Registering a new operator creates the Operator profile that the operator can retrieve

- **ID:** TC-OP-003
- **Title:** Registering a new operator creates the Operator profile that the operator can retrieve
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** API
- **Priority:** High
- **Requirement:** `03-api-contract.md` "Authentication & authorisation" (`POST /operators`: "creates the Supabase Auth user *and* the Operator profile in one request"), "Registry" (2 `GET /operators/{id}`: self, or any reviewer); TP003 G3.1, G7.2
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. No Operator exists with the `email` or the `national_id` used in Test Data.

## Test Data

Request body of `POST /api/v1/operators`:

- `email`: an address not used by any existing operator
- password: [OPEN QUESTION OQ-001: the name of the password field in the request body and the password rules are not stated]
- `legal_name`: any value
- `national_id`: a value not used by any existing operator
- `phone`, `address_line`, `city`, `postal_code`: [OPEN QUESTION OQ-002: whether these Operator fields are required in the request is not stated]

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

An Operator profile with the `email`, `legal_name` and `national_id` from Test Data exists and is returned by `GET /operators/{id}` for the new operator (self).

## Open Questions

- [OPEN QUESTION OQ-001: the name of the password field in the request body and the password rules are not stated]
- [OPEN QUESTION OQ-002: whether `phone`, `address_line`, `city` and `postal_code` are required in the registration request is not stated]
- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
- [OPEN QUESTION OQ-005: the success HTTP status code and the response body of `POST /operators` are not stated, so the `id` of the new operator may have to be taken from the response or from `GET /auth/me`; the documentation does not say which]
