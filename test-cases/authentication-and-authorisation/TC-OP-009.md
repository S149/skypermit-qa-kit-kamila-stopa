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

The page shows one form with the fields `email`, password, `legal_name` and `national_id` and a single submit action.

## Open Questions

- [OPEN QUESTION: the `data-testid` values of the register form, its fields and its submit button are not stated]
- [OPEN QUESTION: the full list of Operator profile fields behind "etc." on the form is not stated in `04-frontend-spec.md` (`01-data-model.md` also lists `phone`, `address_line`, `city`, `postal_code`, but does not say they are on the form)]
- [OPEN QUESTION: the labels of the fields and the submit button are not stated]
