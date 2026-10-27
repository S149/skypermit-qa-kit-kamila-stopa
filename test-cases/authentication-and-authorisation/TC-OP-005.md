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
- `password`: a string of at least 8 characters
- `legal_name`: any non-empty string
- `national_id`: a non-empty string not used by any existing operator
- `authorisation_level`: `L3` (a valid enum value, ascending privilege)
- `phone`, `address_line`, `city`, `postal_code`: optional, may be omitted

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

The operator is created with `authorisation_level` = `L1`, not `L3` (registration always creates an operator at `L1`). The value is read from the operator's profile (`GET /auth/me`).

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
