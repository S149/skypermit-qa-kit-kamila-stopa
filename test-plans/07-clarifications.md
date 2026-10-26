# Test Plan #TP008

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/07-clarifications.md

## Introduction

This plan covers `07-clarifications.md` ("Clarifications — Answers From the Business Rules Owner"). The document records answers received from the owner of the Business Rules source material, resolving most of the open questions raised in the earlier version of `docs/05-open-questions.md`. It explains why each item was decided the way it was.

## Goals

Verify that behaviour matches the clarifications recorded here:

- G1. Authority: where a clarification here conflicts with the literal wording of `docs/06-business-rules.md`, this addendum governs; it is a correction, not a competing interpretation. `docs/06-business-rules.md` has been updated to match.
- G2. Status: current status (resolved vs. open) is in `docs/05-open-questions.md`, the canonical table. This file only explains why each item was decided; it is not updated again if a status changes, so its wording is not the live answer.
- G3. Item 1, the `AIRCRAFT` gate.
  - G3.1. Failing the `AIRCRAFT` gate means the weight-band check: the aircraft's derived weight band against the zone's `permitted_bands`.
  - G3.2. It is a real gate check, not a stub.
- G4. Item 1, reassignment: this rule had been placed under `ZONE` in `docs/06-business-rules.md` §1.3 (sourced from `ZC-2026.1` §2, whose text literally says "fails the zone gate").
  - G4.1. That placement was a corpus error in `ZC-2026.1` §2, not a trap or a second valid reading.
  - G4.2. The rule is unchanged and still cites `ZC-2026.1 §2`; only the gate changed.
  - G4.3. It is implemented in `lib/gates/aircraft-gate.ts`, not `lib/gates/zone-gate.ts`.
- G5. Item 2: `Aircraft.status = RETIRED` / `Pilot.status = INACTIVE`. Resolved as "no": nothing ties either field to a gate outcome. Both are left unwired, and no check is inferred from the pattern of the gates that are defined.
- G6. Item 3, `Operator.status = SUSPENDED`: it is a precondition on the write operations themselves (create / submit / approve), not a gate outcome.
- G7. Item 3, response.
  - G7.1. It must not be represented as a `422` with a `failing_gate`, because none of `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW` fits.
  - G7.2. The status code and response body for a suspended operator's blocked request are undefined, and an answer is needed before `POST /flight-requests`, `.../submit` or `.../approve` can handle a suspended operator correctly. [OPEN QUESTION: the status code and response body for a suspended operator's blocked request]
  - G7.3. `422` is not used as a default to make it fit the existing shape; the question is raised rather than guessed.
- G8. Item 4, altitude vs. ceiling → `ZONE`: confirmed as originally documented.
- G9. Item 4, operator authorisation level → `ZONE`: confirmed, citing `OH-1 §4`. No longer "inferred"; it has the same confidence as the explicit rows.
- G10. Item 4, weight band → `AIRCRAFT`, not `ZONE`: moved per item 1. It was misplaced rather than merely under-cited.
- G11. Item 4, zone `active` flag: still unattributed and unresolved. The rule (an inactive zone fails any flight request against it) is presumably under `ZONE` by elimination. The citation (`ZC-2026.1 §4` in the earlier draft) is not confirmed. The check is implemented, but the citation is not treated as fully confirmed. [OPEN QUESTION: confirmation of the `ZC-2026.1 §4` citation]
- G12. Net effect: all four gates have a defined check to implement; `AIRCRAFT` is no longer a stub. Only the zone `active` citation and the `SUSPENDED` operator handling remain open, and neither blocks writing the gate logic.
- G13. [OPEN QUESTION: the document says it resolves "most" of the open questions and titles item 4 "Resolved, with one reassignment", yet item 4 also contains the unresolved zone `active` flag, and item 3 is titled as staying open; which items count as resolved is determined by `docs/05-open-questions.md`]

## Risks

- R1. Implementing the weight-band check in the zone gate instead of the aircraft gate (G3, G4).
- R2. Wiring `Aircraft.status` or `Pilot.status` to a gate by inference (G5).
- R3. Returning a `422` with a `failing_gate` for a suspended operator (G6, G7).
- R4. Treating the `ZC-2026.1 §4` citation for an inactive zone as confirmed (G11).
- R5. This file's wording may be read as the live status although it is not updated when status changes (G2).

## In Scope / Out Of Scope

### In Scope

- S1. `AIRCRAFT` gate weight-band check and its gate assignment (G3, G4, G10)
- S2. Absence of any gate tied to `Aircraft.status` / `Pilot.status` (G5)
- S3. `Operator.status = SUSPENDED` handling on create, submit and approve (G6, G7)
- S4. `ZONE` gate checks: altitude, operator authorisation level, zone `active` (G8, G9, G11)
- S5. Precedence of this addendum over `docs/06-business-rules.md` wording (G1)

### Out Of Scope

- O1. Current status of each item: `07-clarifications.md` (intro, second paragraph) hands it to `docs/05-open-questions.md`. That document is not part of the input.

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
- API endpoints named in the documentation: `POST /flight-requests`, `.../submit`, `.../approve`
- `422` response contract with `failing_gate`, as named in the documentation

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
