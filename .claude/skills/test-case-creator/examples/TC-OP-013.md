# TC-OP-013: Logging in with valid email and password returns a session for the operator

- **ID:** TC-OP-013
- **Title:** Logging in with valid email and password returns a session for the operator
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** API
- **Priority:** High
- **Requirement:** `03-api-contract.md` "Authentication & authorisation" (`POST /auth/login`: "Log in with email + password; sets the session cookie"; `GET /auth/me`: "The logged-in operator's profile, or `401`"); TP003 G3.2, G3.4
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/auth/login` is reachable.
2. An operator is registered with a known `email` and password.
3. The caller has no session (no session cookie).

## Test Data

Request body of `POST /api/v1/auth/login`:

- `email`: the email of the registered operator
- password: [OPEN QUESTION OQ-NNN: the name of the password field in the login request body is not stated]
- concrete email and password values: [OPEN QUESTION OQ-NNN: no example values are given in the documentation]

## Steps

1. Send `POST /api/v1/auth/login` with the request body from Test Data.

## Expected Result

The response sets the session cookie, and the next request `GET /api/v1/auth/me` with that cookie returns the registered operator's profile instead of `401`.

## Open Questions

- [OPEN QUESTION OQ-NNN: the name of the password field in the login request body is not stated]
- [OPEN QUESTION OQ-NNN: no concrete example values for the email and password are given in the documentation]
- [OPEN QUESTION OQ-NNN: the name and attributes of the session cookie and the success HTTP status code of `POST /auth/login` are not stated]
- [OPEN QUESTION OQ-NNN: the response body of `POST /auth/login` is not stated]
- [OPEN QUESTION OQ-NNN: the fields of the operator profile returned by `GET /auth/me` are not stated]
