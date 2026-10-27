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
- `password`: a string of at least 8 characters
- `legal_name`: any non-empty string
- `national_id`: a non-empty string not used by any existing operator
- `phone`, `address_line`, `city`, `postal_code`: optional, may be omitted

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

An Operator profile with the `email`, `legal_name` and `national_id` from Test Data exists and is returned by `GET /operators/{id}` for the new operator (self).

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
