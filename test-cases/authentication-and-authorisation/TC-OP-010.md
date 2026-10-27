# TC-OP-010: Register page has no authorisation_level field

- **ID:** TC-OP-010
- **Title:** Register page has no authorisation_level field
- **Module:** authentication-and-authorisation
- **Type:** Negative
- **Layer:** UI
- **Priority:** Medium
- **Requirement:** `04-frontend-spec.md` "Operator portal" ("`authorisation_level` is not a field on this form"); `03-api-contract.md` "Authentication & authorisation" ("not a registration-form field"); TP005 G7.1
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

The form (`operator-register-form`) has no input for `authorisation_level`.

## Open Questions

- [OPEN QUESTION OQ-017: what counts as such an input (any label or control that names the authorisation level) is not stated]
