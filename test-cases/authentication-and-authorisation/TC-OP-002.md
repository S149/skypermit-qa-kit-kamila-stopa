# TC-OP-002: Registering a new operator sets Operator.id to the id of the created Supabase Auth user

- **ID:** TC-OP-002
- **Title:** Registering a new operator sets Operator.id to the id of the created Supabase Auth user
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** DB
- **Priority:** Medium
- **Requirement:** `01-data-model.md` Operator (`id`: "FK → `auth.users(id)` ... Set at registration to the Supabase Auth user's own id"); `03-api-contract.md` "Authentication & authorisation" (`POST /operators`); TP001 G2.1; TP003 G3.1
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. No Operator and no Supabase Auth user exists with the `email` or the `national_id` used in Test Data.
3. [OPEN QUESTION OQ-008: how a tester reads `auth.users` and the Operator table (access, tool) is not stated]

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

The new row in the Operator table has an `id` equal to the `id` of the new row in `auth.users` created by the same registration (no separately generated id and no extra `user_id` column).

## Open Questions

- [OPEN QUESTION OQ-008: how a tester reads `auth.users` and the Operator table (access, tool) is not stated]
- [OPEN QUESTION OQ-001: the name of the password field in the request body and the password rules are not stated]
- [OPEN QUESTION OQ-002: whether `phone`, `address_line`, `city` and `postal_code` are required in the registration request is not stated]
- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
