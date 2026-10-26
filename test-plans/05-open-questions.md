# Test Plan #TP006

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/05-open-questions.md

## Introduction

This plan covers `05-open-questions.md` ("Open Questions — Canonical Status"), which the documentation calls the single source of truth for "is this resolved yet." It tracks the current status of five questions about gate behaviour and the `Operator.status = SUSPENDED` handling: three are resolved and two (rows 4 and 5) are still open. It records status only; the reasoning for each resolved item is kept elsewhere (see Out Of Scope).

## Goals

Verify that the system and its behaviour match the statuses and rules recorded in this document:

- G1. The document is the single source of truth for status.
  - G1.1. It is the single source of truth for "is this resolved yet".
  - G1.2. The table is not duplicated elsewhere: `docs/06-business-rules.md` §7 and `docs/07-clarifications.md` point here instead of restating it.
  - G1.3. `docs/07-clarifications.md` remains the place to read why each resolved item was resolved the way it was; this file only tracks current status.
- G2. Question 1, "What fails the `AIRCRAFT` gate?": Resolved. The weight-band check (see `docs/06-business-rules.md` §1.2 and `docs/07-clarifications.md` item 1). Does not block gate implementation.
- G3. Question 2, `Aircraft.status = RETIRED` / `Pilot.status = INACTIVE` tied to a gate?: Resolved, no. Neither is tied to any gate by any source document; both are left unwired (see `docs/07-clarifications.md` item 2). Does not block gate implementation.
- G4. Question 3, operator authorisation level → which gate, which citation?: Resolved. `ZONE`, citing `OH-1 §4` (see `docs/07-clarifications.md` item 4). Does not block gate implementation.
- G5. Question 4, `Operator.status = SUSPENDED` status code and response shape: Open (see G8). It does not block gate implementation, because it is a precondition on writes, not a gate.
- G6. Question 5, zone `active` flag citation: Open (rule settled, citation not fully confirmed; see G10). It does not block gate implementation; the rule is to be implemented now.
- G7. Only rows 4 and 5 (G5, G6) are still unresolved. Neither blocks implementing the four gates.
- G8. `Operator.status = SUSPENDED`: status code and response shape are undefined.
  - G8.1. It is a precondition on write operations (create, submit, approve), not a gate outcome.
  - G8.2. It must not be represented as a `422` with a `failing_gate`, because none of the four gate values fits and doing so would misrepresent it.
  - G8.3. The status code and response body to return when a suspended operator's request is blocked are still missing. [OPEN QUESTION: the status code and response body for a blocked suspended operator are not defined in this document]
- G9. No invented response may be forced into the existing `422` contract.
  - G9.1. If the behaviour must ship before an answer arrives, it is flagged back rather than guessed.
  - G9.2. A `403` with an ad hoc body is a reasonable placeholder to propose.
  - G9.3. Such a placeholder is called out as a placeholder in code and in conversation with whoever owns the API contract, and is not treated as settled.
- G10. Zone `active`.
  - G10.1. The rule is settled: an inactive zone fails any flight request against it, under the `ZONE` gate. It is about as certain as the operator-authorisation-level rule was before that was confirmed.
  - G10.2. `ZC-2026.1 §4` as its specific citation is not confirmed with the same certainty. [OPEN QUESTION: confirmation of the `ZC-2026.1 §4` citation]
  - G10.3. The check is safe to implement now.
  - G10.4. A one-line confirmation of the citation is wanted before treating `rule_reference: "ZC-2026.1 §4"` as fully authoritative in a `422` body.
- G11. All four gates, `PILOT`, `AIRCRAFT`, `ZONE` and `TIME_WINDOW`, have defined logic in `docs/06-business-rules.md` and can be fully implemented. Nothing in this document blocks that work.

## Risks

- R1. Two items remain open (G5, G6); behaviour for a suspended operator's blocked write (create, submit, approve) cannot be verified against a defined status code and body (G8.3).
- R2. A suspended operator's blocked request could be wrongly returned as a `422` with a `failing_gate` (G8.2).
- R3. A placeholder `403` could be treated as settled behaviour (G9.3).
- R4. The `rule_reference: "ZC-2026.1 §4"` for an inactive zone may not be authoritative (G10.2, G10.4).
- R5. `Aircraft.status = RETIRED` or `Pilot.status = INACTIVE` could be wrongly wired to a gate (G3).

## In Scope / Out Of Scope

### In Scope

- S1. Status table rows 1-5 and their resolution state (G2-G7)
- S2. Handling of `Operator.status = SUSPENDED` on create, submit and approve (G5, G8, G9)
- S3. Zone `active` rule under the `ZONE` gate and its `rule_reference` (G6, G10)
- S4. Absence of any gate tied to `Aircraft.status` and `Pilot.status` (G3)
- S5. Existence of defined logic for all four gates (G11)

### Out Of Scope

- O1. The reasoning and provenance of each resolved item: `05-open-questions.md` (intro paragraph) says `docs/07-clarifications.md` is the place to read that, and this file only tracks current status.
- O2. The gate logic itself: `05-open-questions.md` ("What this means for implementation") says it is defined in `docs/06-business-rules.md`. That document is not part of the input.

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
- `422` response contract with `failing_gate` and `rule_reference`, as named in the documentation

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
