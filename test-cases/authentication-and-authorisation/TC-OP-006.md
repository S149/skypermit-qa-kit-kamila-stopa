# TC-OP-006: Registration with an already registered email does not create a second operator

- **ID:** TC-OP-006
- **Title:** Registration with an already registered email does not create a second operator
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** API
- **Priority:** Medium
- **Requirement:** `01-data-model.md` Operator (`email`: unique); `03-api-contract.md` "Authentication & authorisation" (`POST /operators`); TP001 G2.4; TP005 G5 (open question on duplicate registration)
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. An operator with `email` = E already exists (registered earlier).
3. No Operator exists with the `national_id` used in Test Data.

## Test Data

Request body of `POST /api/v1/operators`:

- `email`: the same address E as the existing operator
- password: [OPEN QUESTION: the name of the password field in the request body and the password rules are not stated]
- `legal_name`: any value
- `national_id`: a value not used by any existing operator
- `phone`, `address_line`, `city`, `postal_code`: [OPEN QUESTION: whether these Operator fields are required in the request is not stated]

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

No second Operator with `email` = E is created; `Operator.email` stays unique.

## Open Questions

- [OPEN QUESTION: the name of the password field in the request body and the password rules are not stated]
- [OPEN QUESTION: whether `phone`, `address_line`, `city` and `postal_code` are required in the registration request is not stated]
- [OPEN QUESTION: no concrete example values for the request fields are given in the documentation]
- [OPEN QUESTION: the HTTP status code and the response body returned for a duplicate email are not stated (`04-frontend-spec.md` and TP005 G5 also leave duplicate registration handling open)]
