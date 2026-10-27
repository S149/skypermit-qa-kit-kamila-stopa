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

The login page is displayed: the form `operator-login-form` with the fields `operator-login-email-input` and `operator-login-password-input` and the button `operator-login-submit-button`.

## Open Questions

- [OPEN QUESTION OQ-028: the base URL of the application under test is not stated in the documentation; the test plan names `https://skypermit.vercel.app/` as the site]
