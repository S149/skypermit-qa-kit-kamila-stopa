# TC-OP-001: Registering a new operator creates the operator at authorisation level L1

- **ID:** TC-OP-001
- **Title:** Registering a new operator creates the operator at authorisation level L1
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** API
- **Priority:** High
- **Requirement:** `03-api-contract.md` "Authentication & authorisation" (`POST /operators`, "`authorisation_level` is no longer self-service"); `04-frontend-spec.md` "Operator portal" (registration form); TP003 G6.1; TP005 G7.2
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. No Operator and no Supabase Auth user exists with the `email` or the `national_id` that is used in Test Data (both are unique, `01-data-model.md` Operator).

## Test Data

Request body of `POST /api/v1/operators` (one combined request: auth credentials plus Operator profile fields):

- `email`: an address not used by any existing operator
- `password`: a string of at least 8 characters
- `legal_name`: any non-empty string
- `national_id`: a non-empty string not used by any existing operator
- `phone`, `address_line`, `city`, `postal_code`: optional, may be omitted
- `authorisation_level`: not sent (it is not a field of the registration form, `04-frontend-spec.md`, nor of `RegisterOperatorInput` in `public/openapi.yaml`)

[OPEN QUESTION OQ-004: no concrete example values for these fields are given in the documentation]

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

The new operator exists with `authorisation_level` = `L1` (least privilege). The value is read from the operator's profile (`GET /auth/me`, the caller is signed in by registration).

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]