# TC-OP-005: Registration request with authorisation_level L3 still creates the operator at L1

- **ID:** TC-OP-005
- **Title:** Registration request with authorisation_level L3 still creates the operator at L1
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `03-api-contract.md` "Authentication & authorisation" ("`authorisation_level` is no longer self-service. Registration always creates an operator at `L1` (least privilege); raising it is an out-of-band admin action"); `01-data-model.md` Enumerations (`L1`, `L2`, `L3`); TP003 G6.1; TP005 G7.2
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. No Operator exists with the `email` or the `national_id` used in Test Data.

## Test Data

Request body of `POST /api/v1/operators`:

- `email`: an address not used by any existing operator
- password: [OPEN QUESTION: the name of the password field in the request body and the password rules are not stated]
- `legal_name`: any value
- `national_id`: a value not used by any existing operator
- `authorisation_level`: `L3` (a valid enum value, ascending privilege)
- `phone`, `address_line`, `city`, `postal_code`: [OPEN QUESTION: whether these Operator fields are required in the request is not stated]

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

The operator is created with `authorisation_level` = `L1`, not `L3` (registration always creates an operator at `L1`). The value is read from the operator's profile (`GET /auth/me`).

## Open Questions

- [OPEN QUESTION: the name of the password field in the request body and the password rules are not stated]
- [OPEN QUESTION: whether `phone`, `address_line`, `city` and `postal_code` are required in the registration request is not stated]
- [OPEN QUESTION: no concrete example values for the request fields are given in the documentation]
- [OPEN QUESTION: whether an `authorisation_level` sent in the request body is ignored or the request is rejected is not stated; the documentation states only that registration always creates the operator at `L1`]
- [OPEN QUESTION: whether the operator profile returned by `GET /auth/me` includes `authorisation_level` is not stated ("The logged-in operator's profile"); if it does not, the value has to be read another way, for example `GET /operators/{id}` (self) or the database]
