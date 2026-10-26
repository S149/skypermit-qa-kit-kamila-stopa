# Test Plan #TP006

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/05-open-questions.md

## Introduction

This plan covers `05-open-questions.md` ("Open Questions — Canonical Status"), which the documentation calls the single source of truth for "is this resolved yet." It tracks the current status of five open questions about gate behaviour and the `Operator.status = SUSPENDED` handling. It records status only; the reasoning for each resolved item is kept elsewhere (see Out Of Scope).

## Goals

Verify that the system and its behaviour match the statuses and rules recorded in this document:

- G1. The document is the single source of truth for status. It is not duplicated elsewhere: `docs/06-business-rules.md` §7 and `docs/07-clarifications.md` point to it instead of restating the table. This file only tracks current status.
- G2. Question 1, "What fails the `AIRCRAFT` gate?": Resolved. The weight-band check (see `docs/06-business-rules.md` §1.2 and `docs/07-clarifications.md` item 1). Does not block gate implementation.
- G3. Question 2, `Aircraft.status = RETIRED` / `Pilot.status = INACTIVE` tied to a gate?: Resolved, no. Neither is tied to any gate by any source document; both are left unwired (see `docs/07-clarifications.md` item 2). Does not block gate implementation.
- G4. Question 3, operator authorisation level → which gate, which citation?: Resolved. `ZONE`, citing `OH-1 §4` (see `docs/07-clarifications.md` item 4). Does not block gate implementation.
- G5. Question 4, `Operator.status = SUSPENDED` status code and response shape: Open. It does not block gate implementation, because it is a precondition on writes, not a gate.
- G6. Question 5, zone `active` flag citation: Open (rule settled, citation not fully confirmed). It does not block gate implementation; the rule is to be implemented now.
- G7. Only rows 4 and 5 are still unresolved. Neither blocks implementing the four gates.
- G8. `Operator.status = SUSPENDED` is a precondition on write operations (create, submit, approve), not a gate outcome. It must not be represented as a `422` with a `failing_gate`, because none of the four gate values fits and doing so would misrepresent it. The status code and response body to return when a suspended operator's request is blocked are still missing. [OPEN QUESTION: the status code and response body for a blocked suspended operator are not defined in this document]
- G9. No invented response may be forced into the existing `422` contract. If it must ship before an answer, it is flagged back rather than guessed. A `403` with an ad hoc body is a reasonable placeholder to propose, but it must be called out as a placeholder in code and in conversation with whoever owns the API contract, and not treated as settled.
- G10. Zone `active`: an inactive zone fails any flight request against it, under the `ZONE` gate. The rule is settled. The citation `ZC-2026.1 §4` is not confirmed with the same certainty as the operator-authorisation-level rule; the check is safe to implement now, but a one-line confirmation of the citation is wanted before treating `rule_reference: "ZC-2026.1 §4"` as fully authoritative in a `422` body. [OPEN QUESTION: confirmation of the `ZC-2026.1 §4` citation]
- G11. All four gates, `PILOT`, `AIRCRAFT`, `ZONE` and `TIME_WINDOW`, have defined logic in `docs/06-business-rules.md` and can be fully implemented. Nothing in this document blocks that work.

## Risks

- R1. Two items remain open (G5, G6); behaviour for a suspended operator's blocked write (create, submit, approve) cannot be verified against a defined status code and body.
- R2. A suspended operator's blocked request could be wrongly returned as a `422` with a `failing_gate` (G8).
- R3. A placeholder `403` could be treated as settled behaviour (G9).
- R4. The `rule_reference: "ZC-2026.1 §4"` for an inactive zone may not be authoritative (G10).
- R5. `Aircraft.status = RETIRED` or `Pilot.status = INACTIVE` could be wrongly wired to a gate (G3).

## In Scope / Out Of Scope

### In Scope

- Status table rows 1-5 and their resolution state (G2-G7)
- Handling of `Operator.status = SUSPENDED` on create, submit and approve (G5, G8, G9)
- Zone `active` rule under the `ZONE` gate and its `rule_reference` (G6, G10)
- Absence of any gate tied to `Aircraft.status` and `Pilot.status` (G3)
- Existence of defined logic for all four gates (G11)

### Out Of Scope

- The reasoning and provenance of each resolved item: `05-open-questions.md` (intro paragraph) says `docs/07-clarifications.md` is the place to read that, and this file only tracks current status.
- The gate logic itself: `05-open-questions.md` ("What this means for implementation") says it is defined in `docs/06-business-rules.md`. That document is not part of the input.

## Entry Criteria / Environments

### Entry Criteria

1. Requirements, test goals are clear for testers
2. All test environments and test tools are ready and can be used
3. Test data / test documentation are available and can be used
4. Test cases are ready and can be used

### Environments

- OS: Microsoft Windows 11 Pro (version 10.0.26200)
- Browser: Chrome (latest version)

## Exit Criteria / Tools

### Exit Criteria

1. Test time was finished
2. More than 85% of all test cases were passed
3. Test Report is ready and can be provided to stakeholders

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
