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
- password: [OPEN QUESTION OQ-001: the name of the password field in the request body and the password rules are not stated]
- `legal_name`: any value
- `national_id`: a value not used by any existing operator
- `phone`, `address_line`, `city`, `postal_code`: [OPEN QUESTION OQ-002: whether these Operator fields (listed in `01-data-model.md`) are required or optional in the request is not stated; `04-frontend-spec.md` lists only `legal_name`, `national_id` "etc."]
- `authorisation_level`: not sent (it is not a field of the registration form; `03-api-contract.md` does not list the request body fields)

[OPEN QUESTION OQ-004: no concrete example values for these fields are given in the documentation]

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

The new operator exists with `authorisation_level` = `L1` (least privilege). The value is read from the operator's profile (`GET /auth/me`, the caller is signed in by registration).

## Open Questions

- [OPEN QUESTION OQ-001: the name of the password field in the request body and the password rules are not stated]
- [OPEN QUESTION OQ-002: whether `phone`, `address_line`, `city` and `postal_code` are required in the registration request is not stated]
- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
- [OPEN QUESTION OQ-005: the success HTTP status code and the response body of `POST /operators` are not stated, so it is not stated whether `authorisation_level` is returned in the response itself]
- [OPEN QUESTION OQ-007: whether the operator profile returned by `GET /auth/me` includes `authorisation_level` is not stated ("The logged-in operator's profile"); if it does not, the value has to be read another way, for example `GET /operators/{id}` (self) or the database]