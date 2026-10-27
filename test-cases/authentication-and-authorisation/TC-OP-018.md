# TC-OP-018: Submitting the login form with valid credentials shows operator-session-info

- **ID:** TC-OP-018
- **Title:** Submitting the login form with valid credentials shows operator-session-info
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** UI
- **Priority:** Medium
- **Requirement:** `04-frontend-spec.md` "Operator portal" (`/login` page) and "Two contracts to hold exactly" (`operator-session-info` / `operator-logout-button` "shown when logged in"); TP005 G5.1, G17.3
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running.
2. An operator is registered with a known `email` and password.
3. The user is not logged in and the page `/login` is open.
4. The form is filled with the email (`operator-login-email-input`) and the password (`operator-login-password-input`) of the registered operator.

## Test Data

- `email`: the email of the registered operator
- password: the password of the registered operator
- concrete values: [OPEN QUESTION OQ-004: no example values are given in the documentation]

## Steps

1. Submit the login form (button `operator-login-submit-button`).

## Expected Result

After the redirect to `/operator/pilots`, the element with `data-testid="operator-session-info"` is shown.

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the email and password are given in the documentation]
