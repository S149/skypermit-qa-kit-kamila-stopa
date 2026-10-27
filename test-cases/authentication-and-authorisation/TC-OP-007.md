# TC-OP-007: Registration with an already registered national_id does not create a second operator

- **ID:** TC-OP-007
- **Title:** Registration with an already registered national_id does not create a second operator
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** API
- **Priority:** Medium
- **Requirement:** `01-data-model.md` Operator (`national_id`: unique); `03-api-contract.md` "Authentication & authorisation" (`POST /operators`); TP001 G2.3; TP005 G5 (open question on duplicate registration)
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. An operator with `national_id` = N already exists (registered earlier).
3. No Operator exists with the `email` used in Test Data.

## Test Data

Request body of `POST /api/v1/operators`:

- `email`: an address not used by any existing operator
- `password`: a string of at least 8 characters
- `legal_name`: any non-empty string
- `national_id`: the same value N as the existing operator
- `phone`, `address_line`, `city`, `postal_code`: optional, may be omitted

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

No second Operator with `national_id` = N is created; `Operator.national_id` stays unique.

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
