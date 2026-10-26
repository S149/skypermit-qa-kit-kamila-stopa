# TC-OP-017: The /login page opens for a logged-out user

- **ID:** TC-OP-017
- **Title:** The /login page opens for a logged-out user
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** UI
- **Priority:** High
- **Requirement:** `04-frontend-spec.md` "Operator portal" ("**Login** (`/login`) and **register** (`/register`) pages"); TP005 G5.1
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running.
2. The user is not logged in (no session).

## Test Data

None.

## Steps

1. Open the page `/login`.

## Expected Result

The login page is displayed.

[OPEN QUESTION: what the login page contains is not stated: the fields (email, password), the submit button and their `data-testid` values are not documented, so "the login page is displayed" cannot be checked by a documented element]

## Open Questions

- [OPEN QUESTION: what the login page contains is not stated: the fields (email, password), the submit button and their `data-testid` values are not documented]
- [OPEN QUESTION: the base URL of the application under test is not stated in the documentation; the test plan names `https://skypermit.vercel.app/` as the site]
