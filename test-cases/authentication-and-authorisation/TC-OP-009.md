# TC-OP-009: Register page shows one combined form with credentials and Operator profile fields

- **ID:** TC-OP-009
- **Title:** Register page shows one combined form with credentials and Operator profile fields
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** UI
- **Priority:** Medium
- **Requirement:** `04-frontend-spec.md` "Operator portal" ("Registration is a single combined form: auth credentials (email, password) plus the Operator profile fields (`legal_name`, `national_id`, etc.) in one submit"); TP005 G5.2, G6.1
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running.
2. The user is not logged in.

## Test Data

None.

## Steps

1. Open the page `/register`.

## Expected Result

The page shows one form (`operator-register-form`) with the fields `email` (`operator-register-email-input`), password (`operator-register-password-input`), `legal_name` (`operator-register-legal-name-input`) and `national_id` (`operator-register-national-id-input`) and a single submit action (`operator-register-submit-button`).

## Open Questions

None
