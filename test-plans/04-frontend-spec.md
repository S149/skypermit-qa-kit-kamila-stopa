# Test Plan #TP005

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/04-frontend-spec.md

## Introduction

This plan covers `04-frontend-spec.md` ("Frontend Scope"): an Operator portal and a Reviewer queue, with the active role chosen from a switcher in the header. Styling is intentionally minimal; the interface exists to be automated (hence the `data-testid` contract), not to be a polished consumer product.

The document notes that it used to say "no login" for both roles. That is no longer true for operators, who now register and log in for real. The reviewer role is unchanged.

## Goals

Verify that the frontend behaves as the documentation states:

- G1. There are two roles, Operator and Reviewer. The active role is chosen from a switcher in the header. [OPEN QUESTION: the `data-testid` of the role switcher and the names of its options are not stated]
- G2. Operators register and log in for real (Supabase Auth, session cookie). Where the document says "the current operator", that identity comes from the session, not from anything the operator types in each visit.
- G3. The reviewer role is not a login: it is an `X-Reviewer-Id` header typed into the header UI. [OPEN QUESTION: the input element for the reviewer id, its `data-testid`, and the behaviour when it is empty or invalid are not stated]
- G4. The Operator portal requires login. It manages the operator's own pilots, aircraft and requests, and "its own" is enforced server-side via the session, not merely as a UI convention. [OPEN QUESTION: what a logged-out user sees or is redirected to when opening an Operator portal page is not stated]
- G5. Login and registration pages exist. [OPEN QUESTION: error handling for wrong credentials, duplicate registration and invalid input is not stated here]
  - G5.1. A login page at `/login`.
  - G5.2. A register page at `/register`.
- G6. Registration is a single combined form. [OPEN QUESTION: the full list of Operator profile fields behind "etc." is not stated in this document]
  - G6.1. The form holds the auth credentials (email, password) plus the Operator profile fields (`legal_name`, `national_id`, etc.) in one submit.
  - G6.2. A single submit creates both the auth user and the Operator profile together.
  - G6.3. The operator is logged in immediately after registration.
- G7. `authorisation_level` and registration.
  - G7.1. `authorisation_level` is not a field on the registration form.
  - G7.2. Registration always starts an operator at `L1`.
  - G7.3. Raising the level is an out-of-band admin action.
- G8. Registry pages for pilots and aircraft exist, each with a create form. [OPEN QUESTION: the fields of the pilot and aircraft create forms are not stated in this document]
- G9. The request creation form contains:
  - G9.1. a zone picker fed from `GET /zones`;
  - G9.2. a pilot picker, scoped to the current operator;
  - G9.3. an aircraft picker, scoped to the current operator;
  - G9.4. window start and end inputs;
  - G9.5. an altitude input;
  - G9.6. a free-text purpose field.
- G10. A "Check before submitting" button calls `POST /flight-requests/{id}/validate` and shows a per-gate pass/fail result without changing state. [OPEN QUESTION: how the button works for a request that has not been created yet (the endpoint needs an `{id}`) is not stated]
- G11. A "My requests" list exists and is filterable by state. [OPEN QUESTION: the list of filter values and the `data-testid` of the filter are not stated]
- G12. The request detail view shows the rejection reason and rule reference when applicable. [OPEN QUESTION: the conditions under which they are "applicable" are not stated here]
- G13. The Reviewer queue is the shared queue of requests awaiting decision.
  - G13.1. A pending requests table (state = `UNDER_REVIEW`).
  - G13.2. The table is sortable by submission time. [OPEN QUESTION: default sort order and sort direction are not stated]
- G14. The Reviewer request detail shows all four gate results. [OPEN QUESTION: the names and order of the four gates are not stated in this document]
- G15. The Reviewer has approve and reject actions. [OPEN QUESTION: the endpoint called by approve is not stated]
  - G15.1. An approve action.
  - G15.2. A reject action; reject requires a note, mapped to the required `note` field on `POST /flight-requests/{id}/reject`. [OPEN QUESTION: the UI behaviour when reject is attempted without a note is not stated]
- G16. Selector stability: every interactive element carries a `data-testid`. These values are part of the interface contract, not incidental markup, because automated suites bind to them. A sensible stable value is set the first time (for example `data-testid="flight-request-submit-button"`) and is not renamed later unless the underlying element genuinely changes into something else. [OPEN QUESTION: the complete list of expected `data-testid` values is not stated]
- G17. Operator auth exception to selector stability.
  - G17.1. `operator-id-input` (a free-text box for pasting an operator UUID) was removed, not renamed, because the element it named no longer exists.
  - G17.2. `operator-login-link` and `operator-register-link` are shown when logged out.
  - G17.3. `operator-session-info` and `operator-logout-button` are shown when logged in.
- G18. The form does not pre-filter. Pilot, aircraft and zone pickers in the request creation form are not filtered against the business rules, so an operator can select a combination that cannot possibly pass. Rules are enforced only at `validate` and `submit`, never while the form is being filled in. Client-side eligibility filtering must not be added, because it is not part of the spec and would hide gate failures the operator needs to see.

## Risks

- R1. Automated suites bind to `data-testid` values; a renamed or missing value breaks them (G16, G17).
- R2. Identity moved from a typed-in value to a session; "its own" must hold server-side, so a UI-only restriction would not be enough (G2, G4).
- R3. Pickers that filter by business rules would hide gate failures the operator needs to see (G18).
- R4. `authorisation_level` must not be settable via registration (G7).
- R5. The document records that the old "no login" statement and the `operator-id-input` element changed with operator auth; behaviour or tests based on the old model may be outdated (G17).
- R6. The reviewer role has no login, only a typed `X-Reviewer-Id` header (G3).
- R7. "Check before submitting" must not change state (G10).

## In Scope / Out Of Scope

### In Scope

- S1. Role switcher in the header (G1) and reviewer id entry in the header UI (G3)
- S2. Operator login, registration and session behaviour: `/login`, `/register`, `operator-login-link`, `operator-register-link`, `operator-session-info`, `operator-logout-button` (G2, G5-G7, G17)
- S3. Operator portal: pilot and aircraft registry pages and create forms, request creation form and its pickers, "Check before submitting", "My requests" list with state filter, request detail with rejection reason and rule reference (G4, G8-G12, G18)
- S4. Reviewer queue: pending requests table, sorting by submission time, request detail with four gate results, approve and reject with required note (G13-G15)
- S5. `data-testid` contract on every interactive element (G16, G17)
- S6. Absence of client-side pre-filtering in the request creation form (G18)

### Out Of Scope

- O1. Authentication and authorisation rules (server-side), which `04-frontend-spec.md` ("Frontend Scope", the ⚠️ note) hands to `docs/03-api-contract.md`, section "Authentication & authorisation". That document is not part of the input.
- O2. Visual design polish: `04-frontend-spec.md` ("Frontend Scope", first paragraph) says styling is intentionally minimal, the interface is not a polished consumer product, and not to over-invest in visual design.

## Entry Criteria / Environments

### Entry Criteria

- EN1. Requirements, test goals are clear for testers
- EN2. All test environments and test tools are ready and can be used
- EN3. Test data / test documentation are available and can be used
- EN4. Test cases are ready and can be used

### Environments

- OS: Microsoft Windows 11 Pro (version 10.0.26200)
- Browser: Chrome (latest version)

## Exit Criteria / Tools

### Exit Criteria

- EX1. Test time was finished
- EX2. More than 85% of all test cases were passed
- EX3. Test Report is ready and can be provided to stakeholders

### Tools

- SVC: GitHub
- Test design: Claude Code
- Supabase Auth (session cookie), as named in the documentation
- API endpoints named in the documentation: `GET /zones`, `POST /flight-requests/{id}/validate`, `POST /flight-requests/{id}/reject`
- `X-Reviewer-Id` header

## Schedule and Estimations / People

### Schedule and Estimations

- Start date: [OPEN QUESTION: not provided]
- End date: [OPEN QUESTION: not provided]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation not provided]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation not provided]
- Testing: [OPEN QUESTION: estimation not provided]
- Create Test Report: [OPEN QUESTION: estimation not provided]

### People

Kamila Stopa, Senior Test Engineer
