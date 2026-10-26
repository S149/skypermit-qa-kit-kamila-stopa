# TC-OP-014: Logging in with a wrong password does not create a session

- **ID:** TC-OP-014
- **Title:** Logging in with a wrong password does not create a session
- **Module:** authentication-and-authorisation
- **Type:** Negative
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
- password: a value different from the registered operator's password [OPEN QUESTION: the name of the password field in the login request body is not stated]
- concrete email and password values: [OPEN QUESTION: no example values are given in the documentation]

## Steps

1. Send `POST /api/v1/auth/login` with the request body from Test Data.

## Expected Result

No session is created: the next request `GET /api/v1/auth/me` returns `401`.

## Open Questions

- [OPEN QUESTION: the name of the password field in the login request body is not stated]
- [OPEN QUESTION: no concrete example values for the email and password are given in the documentation]
- [OPEN QUESTION: the HTTP status code and body of `POST /auth/login` for wrong credentials are not stated (the contract only lists `401` as "no operator session and no `X-Reviewer-Id`")]
- [OPEN QUESTION: whether the response of a failed login sets any session cookie is not stated]
