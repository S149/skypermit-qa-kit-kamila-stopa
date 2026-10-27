# TC-OP-019: Submitting the login form with valid credentials shows operator-logout-button

- **ID:** TC-OP-019
- **Title:** Submitting the login form with valid credentials shows operator-logout-button
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** UI
- **Priority:** Low
- **Requirement:** `04-frontend-spec.md` "Operator portal" (`/login` page) and "Two contracts to hold exactly" (`operator-session-info` / `operator-logout-button` "shown when logged in"); TP005 G5.1, G17.3
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running.
2. An operator is registered with a known `email` and password.
3. The user is not logged in and the page `/login` is open.
4. The form is filled with the email and the password of the registered operator.

## Test Data

- `email`: the email of the registered operator
- password: the password of the registered operator
- concrete values: [OPEN QUESTION OQ-004: no example values are given in the documentation]

## Steps

1. Submit the login form.

## Expected Result

The element with `data-testid="operator-logout-button"` is shown.

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the email and password are given in the documentation]
- [OPEN QUESTION OQ-027: the `data-testid` values of the email field, the password field and the submit button of the login form are not stated]
- [OPEN QUESTION OQ-029: the page the user lands on after a successful login is not stated]
