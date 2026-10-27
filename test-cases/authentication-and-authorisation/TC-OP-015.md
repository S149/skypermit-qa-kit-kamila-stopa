# TC-OP-015: Logging in with an unregistered email does not create a session

- **ID:** TC-OP-015
- **Title:** Logging in with an unregistered email does not create a session
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `03-api-contract.md` "Authentication & authorisation" (`POST /auth/login`: "Log in with email + password; sets the session cookie"; `GET /auth/me`: "The logged-in operator's profile, or `401`"); TP003 G3.2, G3.4
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/auth/login` is reachable.
2. No operator is registered with the `email` used in Test Data.
3. The caller has no session (no session cookie).

## Test Data

Request body of `POST /api/v1/auth/login`:

- `email`: an address not used by any existing operator
- `password`: any non-empty string
- concrete email and password values: [OPEN QUESTION OQ-004: no example values are given in the documentation]

## Steps

1. Send `POST /api/v1/auth/login` with the request body from Test Data.

## Expected Result

No session is created: the next request `GET /api/v1/auth/me` returns `401`.

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the email and password are given in the documentation]
- [OPEN QUESTION OQ-024: whether the response of a failed login sets any session cookie is not stated]
