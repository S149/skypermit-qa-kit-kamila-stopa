# TC-OP-004: Registering a new operator signs the caller in with a session

- **ID:** TC-OP-004
- **Title:** Registering a new operator signs the caller in with a session
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** API
- **Priority:** High
- **Requirement:** `03-api-contract.md` "Authentication & authorisation" (`POST /operators`: "then signs the caller in (session cookie)"; `GET /auth/me`: "The logged-in operator's profile, or `401`"); TP003 G3.1, G3.4; TP005 G2
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/operators` is reachable.
2. The caller has no session (no session cookie).
3. No Operator exists with the `email` or the `national_id` used in Test Data.

## Test Data

Request body of `POST /api/v1/operators`:

- `email`: an address not used by any existing operator
- password: [OPEN QUESTION: the name of the password field in the request body and the password rules are not stated]
- `legal_name`: any value
- `national_id`: a value not used by any existing operator
- `phone`, `address_line`, `city`, `postal_code`: [OPEN QUESTION: whether these Operator fields are required in the request is not stated]

## Steps

1. Send `POST /api/v1/operators` with the request body from Test Data.

## Expected Result

The response sets the session cookie, and the next request `GET /auth/me` with that cookie returns the new operator's profile instead of `401`.

## Open Questions

- [OPEN QUESTION: the name of the password field in the request body and the password rules are not stated]
- [OPEN QUESTION: whether `phone`, `address_line`, `city` and `postal_code` are required in the registration request is not stated]
- [OPEN QUESTION: no concrete example values for the request fields are given in the documentation]
- [OPEN QUESTION: the name and attributes of the session cookie and the success HTTP status code of `POST /operators` are not stated]
