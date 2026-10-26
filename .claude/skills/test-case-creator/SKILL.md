---
name: test-case-creator
description: Generate one atomic low-level test case (one action or condition, one expected result) from the product documentation (for example ../skypermit/docs/), as a Markdown file in test-cases/. Use this skill whenever the user asks to write, create, or add a test case for a requirement, a rule, a gate, an endpoint or a feature (for example "test-case-creator login operator", or "../skypermit/docs/06-business-rules.md, G16"), even if they do not say "test-case-creator" explicitly. For a test plan use test-plan instead.
---

# Test Case Creator

Generate exactly one atomic test case from the documentation. The case is built only from what the documentation says. Anything the documentation does not state is marked as an open question, because an invented value in a test case produces a test that checks nothing real.

Atomic means: one concrete action or condition leads to one concrete expected result. A scenario with a chain of actions and many checks is several test cases, not one.

## Input

The skill takes one of two inputs:

1. **A free-form description** of what to check, for example `login operator`. Find the matching place in the documentation yourself (search all files of `../skypermit/docs/`).
2. **A requirement from the documentation**: a file and a section or requirement, for example `../skypermit/docs/06-business-rules.md, G16`. Read the document and write one case.

If no input was given, ask the user for it before doing anything else.

The documentation is read-only: never modify, create or delete anything in `../skypermit`.

If no matching place exists in the documentation, do not invent the behavior. Write nothing beyond what is stated, and mark the missing part as `[OPEN QUESTION: ...]`. If nothing at all matches the description, tell the user and ask whether to continue with open questions only.

If the documentation describes the behavior in several places, read all of them, and when two places disagree do not pick one version: record `[OPEN QUESTION: ...]` naming both documents and both versions.

## One check per case

If the chosen requirement contains several checks (several boundaries, conditions or roles), do not pick one yourself and do not merge them. List the separate checks you found (for example "lower boundary 15 min", "upper boundary 240 min") and ask the user which one to cover. Create exactly one case per run.

The same applies to the layer: if the requirement can be checked at more than one Layer (for example operator registration through the `POST /operators` endpoint and through the `/register` form), list the possible Layers and ask the user which one to cover. One case has one Layer, otherwise it is not atomic.

## Duplicates

Before creating the case, search `test-cases/` for an existing case with the same `Requirement` and the same check. If one exists, stop: do not create a new file, show the existing case (its ID and path) and ask the user what to do.

## ID and file path

ID format: `TC-{ROLE}-{NNN}`.

- `ROLE` is the actor who performs the action: `OP` (Operator), `RV` (Reviewer), or `SYS` (a requirement with no actor, for example a data constraint or a gate rule). If the role is not obvious from the documentation, ask the user.
- `NNN` is a three-digit sequence number that is continuous per role across the whole `test-cases/` directory, not per module. Take the next number after the highest `NNN` among existing files with the same `ROLE` (`TC-OP-001`, `TC-OP-002`, ...); if there are none, start with `001`. Never reuse a number.

File path: `test-cases/{module}/TC-{ROLE}-{NNN}.md`, one folder per module and one file per case. The module name comes from the documentation (for example the name of the document or of the area it describes). If the module is not obvious, ask the user. Create the module folder if it does not exist.

## Fields

All field names are in English, and the whole text of the case is in English.

- **ID**: as above.
- **Title**: one short sentence naming the single action and the single expected outcome.
- **Module**: the module name used for the folder.
- **Type**: `Positive` or `Negative`.
- **Layer**: the layer at which the case is executed: `UI`, `API` or `DB`. Choose it by where the documentation describes the requirement and where it can be checked: `UI` for `04-frontend-spec.md` (forms, pages, `data-testid`), `API` for `03-api-contract.md` (endpoints, status codes, error bodies), `DB` for `01-data-model.md` constraints (unique, foreign keys, check constraints). Do not use any other value; the documentation gives no basis for them. A case has exactly one Layer. For `UI` cases, take selectors from the documented `data-testid` values and mark a missing one as `[OPEN QUESTION: ...]`.- **Priority**: `High`, `Medium` or `Low`, chosen by impact on the system:
  - High: a failure blocks the main flow (submitting or deciding a request), or lets through something that should be rejected (gates, authorization).
  - Medium: correctness of data, states and API responses.
  - Low: format-only and cosmetic checks, UI details.
- **Requirement**: file, section and test-plan item, for example `06-business-rules.md §1.2 PILOT; TP007 G16`. Look up the test-plan item in `test-plans/` and cite the deepest numbered item that matches (`TP003 G1.2`, not just `TP003 G1`). If the plan has no matching item, or the matching item has no number, write `[OPEN QUESTION: no matching numbered test-plan item]` instead of inventing one. Never invent a section or an item.
- **Preconditions**: the state that must exist before the action (accounts, entities, statuses, time). Setup lives here, so that Steps stay a single action.
- **Test Data**: the concrete input values. Use only values that follow from the documentation (limits, enum values, example values it gives). If a needed value is not in the documentation, mark `[OPEN QUESTION: ...]`.
- **Steps**: the single action under test, numbered. Keep to one action; if it cannot be said as one action, the case is not atomic.
- **Expected Result**: one observable outcome, with the exact values the documentation gives (status code, `failing_gate`, `rule_reference`, state). Do not describe several outcomes.
- **Status**: the life cycle of the case. `Draft` on creation; later values `Ready`, `Deprecated` are set by a person. [OPEN QUESTION: confirm the Status values]
- **Execution Result**: `Not Run` on creation; later values `Passed`, `Failed`, `Blocked`. [OPEN QUESTION: confirm the Execution Result values]
- **Open Questions**: every `[OPEN QUESTION: ...]` raised in the case, collected in one list. Write `None` if there are none.

## Open questions

Mark every gap with `[OPEN QUESTION: what needs to be clarified]`, in the place where the missing information belongs (and repeat it in the Open Questions field). Do not replace a gap with a plausible default. A case with open questions is still saved; it is the visible gap that matters.

## Output

Use the template `templates/test-case.md` (in this skill's directory) as the base for every case: copy it and replace each `{placeholder}`. The structure it holds is:

```
# TC-{ROLE}-{NNN}: <Title>

- **ID:** TC-{ROLE}-{NNN}
- **Title:** <Title>
- **Module:** <module>
- **Type:** Positive | Negative
- **Layer:** UI | API | DB
- **Priority:** High | Medium | Low
- **Requirement:** <file §section; TPxxx Gnn>
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions
## Test Data
## Steps
## Expected Result
## Open Questions
```

A filled-in reference case is in `examples/TC-OP-013.md` (in this skill's directory). Use it to match the level of detail, the wording of Preconditions, Test Data, Steps and Expected Result, and the way gaps are marked as `[OPEN QUESTION: ...]`. Take the structure and style from it, never its values or its requirement: every fact in a new case comes from the documentation.

## Verification

After saving the file, read the saved case from its first line to its last line with the Read tool, and read the part of the documentation it is based on again (the whole section, and every other document that mentions the same rule). Do not rely on what you remember. Compare the case with the documentation, not with your draft: numbers, limits, units, enum values, error codes, `failing_gate`, `rule_reference`. Fix anything that contradicts or overstates the documentation, and save again. Also check that the case is still atomic: one action, one expected result.

Do not tell the user that the verification was run unless the saved case and the source documentation were both read completely in this step.

Then tell the user in one or two lines: the ID and the path, what the verification fixed (or that it fixed nothing), and how many open questions the case has.
