# TC-OP-011: Submitting the register form logs the operator in immediately

- **ID:** TC-OP-011
- **Title:** Submitting the register form logs the operator in immediately
- **Module:** authentication-and-authorisation
- **Type:** Positive
- **Layer:** UI
- **Priority:** High
- **Requirement:** `04-frontend-spec.md` "Operator portal" (registration "creating both together and logging the operator in immediately") and "Two contracts to hold exactly" (`operator-session-info` / `operator-logout-button` "shown when logged in"); TP005 G6.3, G17.3
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running.
2. The user is not logged in and the page `/register` is open.
3. The form is filled with `email`, password, `legal_name` and `national_id` values that no existing operator uses.

## Test Data

- `email`: an address not used by any existing operator
- password: [OPEN QUESTION: the password rules are not stated]
- `legal_name`: any value
- `national_id`: a value not used by any existing operator
- other Operator profile fields: [OPEN QUESTION: the full list of fields on the form is not stated]

[OPEN QUESTION: no concrete example values are given in the documentation]

## Steps

1. Submit the register form.

## Expected Result

The operator is logged in without a separate login step: `operator-session-info` and `operator-logout-button` are shown.

## Open Questions

- [OPEN QUESTION: the password rules and the full list of fields on the form are not stated]
- [OPEN QUESTION: no concrete example values are given in the documentation]
- [OPEN QUESTION: the `data-testid` of the form's submit button is not stated]
- [OPEN QUESTION: the page the user lands on after a successful submit is not stated]
