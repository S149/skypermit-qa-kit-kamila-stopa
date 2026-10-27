# TC-OP-012: operator-register-link is shown when the operator is logged out

- **ID:** TC-OP-012
- **Title:** operator-register-link is shown when the operator is logged out
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** UI
- **Priority:** Low
- **Requirement:** `04-frontend-spec.md` "Two contracts to hold exactly" (`operator-login-link`, `operator-register-link` "shown when logged out"); TP005 G17.2
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running.
2. The user is not logged in (no session).

## Test Data

None.

## Steps

1. Open the start page `/`.

## Expected Result

The element with `data-testid="operator-register-link"` is shown.

## Open Questions

None
