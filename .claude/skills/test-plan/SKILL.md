---
name: test-plan
description: Generate a complete test plan from a documentation file or directory (for example ../skypermit/docs/). Use this skill whenever the user asks for a test plan, a QA plan, or a testing plan based on product documentation, even if they do not say "test-plan" explicitly.
model: sonnet
allowed-tools: Read Glob Grep Write(test-plans/**) Edit(test-plans/**) Edit(.notes/open-questions.md)
---

# Test Plan

Generate a complete test plan from the documentation the user points to. The plan is built only from what the documentation says. Anything the documentation does not state is marked as an open question, because an invented detail in a test plan is worse than a visible gap.

The plan must document everything the documentation states. Length is not a concern: a longer plan is fine, a plan that silently drops a requirement is not.

## Input

The documentation path (a file or a directory) is passed as an argument. If no path was given, ask the user for it before doing anything else.

Read the file, or all documentation files in the directory. The source documentation is read-only: never modify, create, or delete anything in it.

## Header fields

The header has: Test Plan #ID, Project and Site.

Project is always `Skypermit`, because that is the application under test. Site is always `https://skypermit.vercel.app/`. Do not ask for either.

Test Plan #ID has the format `TP` plus a three-digit sequence number (`TP001`, `TP002`, ...). Do not ask for it. Take the next number after the highest ID among the test plans already in `test-plans/`; if there are no plans yet, start with `TP001`. Exception: if a plan file with the target name already exists, do not overwrite it until the user confirms; if the user confirms regeneration, keep the ID that file already has.

## Sections

Fill these sections from the documentation:

- **Introduction**
- **Goals**
- **Risks**: only risks that follow directly from the documentation.
- **In Scope**: features the documentation describes.
- **Out Of Scope**: only what the documentation explicitly excludes, or explicitly hands to a document that is not part of the input. Every item must name the place in the documentation (file and section) that excludes it or hands it over. If you cannot cite such a place, do not list the item.

**Schedule and Estimations** always has this structure. The documentation does not provide the values, so ask the user for them once, in a single question, before the file is saved. If the user does not answer or does not know a value, mark that value as an open question. Do not guess.

- Start date / End date
- Analyses and investigation of testing scope: estimation
- Create Test Documentation (Test Plan and Test Cases): estimation
- Testing: estimation
- Create Test Report: estimation

These sections have fixed values. Do not ask for them:

- **People**: `Kamila Stopa, Senior Test Engineer`.
- **Entry Criteria**, the same for every plan regardless of the documentation:
  - EN1. Requirements, test goals are clear for testers
  - EN2. All test environments and test tools are ready and can be used
  - EN3. Test data / test documentation are available and can be used
  - EN4. Test cases are ready and can be used
- **Exit Criteria**, the same for every plan regardless of the documentation:
  - EX1. Test time was finished
  - EX2. More than 85% of all test cases were passed
  - EX3. Test Report is ready and can be provided to stakeholders
- **Environments**:
  - OS: Microsoft Windows, the version installed on the user's current machine (check it, do not guess).
  - Browser: Chrome (latest version).
- **Tools**: always list `SVC: GitHub` and `Test design: Claude Code`. Then add the tools and stack the documentation explicitly mentions (for example the API, browsers, integrations). Do not add tools the documentation does not mention.

If the documentation has nothing for a section that is normally filled from it, mark that section as an open question too.

## Open questions

Mark every gap with `[OPEN QUESTION OQ-NNN: what needs to be clarified]`, in the place where the missing information belongs. Do not replace a gap with a plausible-sounding default.

An open question is only a gap in the product documentation or in the project under test, never a question about this skill or the plan format. The ID comes from the register `.notes/open-questions.md` (format and rules are in its header). Register each question **when you write it into the draft**, not afterwards: read the register; if the same question is already there, reuse its ID and add this plan item to that row's Source; otherwise add a row with the next free `OQ-NNN`, Status `open`, Source = the plan ID and item number (`TP001 S2.1`), and `-` for Gate / rule. Questions that completeness steps 3 and 5 add to the plan are registered the same way, before the file is saved. When a plan is regenerated, keep the IDs of the questions that still apply and never delete a row.

## Numbering

Test cases cite the plan by item number, so every item they may need to cite must have a stable, unique number. Number the items of **Goals** with `G`, **Risks** with `R`, **In Scope** with `S` and **Out Of Scope** with `O`, to any depth: `G1`, `G1.1`, `G1.1.1`; `R1`, `R1.1`; `S1`, `S1.1`; `O1`, `O2`. The fixed **Entry Criteria** are numbered `EN1`-`EN4` and the fixed **Exit Criteria** `EX1`-`EX3`, exactly as listed above. Each prefix has its own sequence that starts from 1.

- An item gets its own number only if it can be verified (or, for risks, mitigated) on its own: an endpoint, a state, a transition, a rule, a field constraint, an enumeration. Text that only explains or exemplifies its parent item (an example, a parenthetical) gets no number. Every item of Out Of Scope gets its own number, because each one has its own citation.
- Open questions stay inside the item they belong to, as described above; they do not get numbers.
- A number is never changed and never reused. When a plan is regenerated and the file already exists, keep the numbers already given to the items that still exist, give a new item the next free number in its parent, and do not renumber the rest. If the plan has no earlier version, number from 1.
- Write the number at the start of the item, followed by a period and a space (`- G3.2. Text`).

## Completeness

Test cases are derived from this plan, so a requirement missing here is never tested. Writing the plan in one pass is not enough. Steps 1-5 are a separate stage that runs every time, after the draft is written and before the file is saved. Step 6 runs after the file is saved. Never skip any step, even when the draft looks complete.

1. Re-read the documentation from the start and list every requirement it states, one line each, as a checklist. Write the checklist to a file in the scratchpad directory (not only in your head), so that each line can be marked as covered. Include:
   - every entity, with its fields, keys, uniqueness and other constraints;
   - every state, transition or action;
   - every enumeration and its values;
   - every conditional rule (a field populated only in some case, a value required only for some action);
   - every derived or computed value and how it must behave;
   - every limit, format, error code and time or timezone rule;
   - every restriction on what must not be exposed or changed;
   - every reference to another document or file.
2. Match each checklist line against the draft and mark it in the checklist file as covered or not covered. A requirement counts as covered only if the plan states it in Goals, Risks or In Scope, or records it as an `[OPEN QUESTION]` (a reference to another document counts as covered only if the plan covers the referenced content or lists the reference under Out Of Scope).
3. Add every requirement that is not covered, and fix anything in the draft that contradicts or overstates the documentation (for example, saying the documentation does not describe something that it does mention).
4. Do not shorten the plan at the cost of dropping any checklist line.
5. If the input is a directory with more than one document, compare the documents with each other. If the input is a single file, skip this step. Look for the same field, state, status, rule, threshold, citation or gate described differently in two places (for example one document says a field is populated only in case A, another says it is populated in case B; or one document puts a check in one gate and another in two). Do not pick one version. Record each such conflict as an `[OPEN QUESTION OQ-NNN: ...]` placed in Goals, next to the requirement it concerns, that names both documents and both versions.
6. After saving the file, read the saved plan from its first line to its last line with the Read tool, and read all the documentation files again from their first line to their last line. Do not use `limit`, do not read only a part of a file, and do not rely on what you remember from earlier in the conversation. Compare the saved plan with the documentation (not with your draft), section by section. Fix any wording that contradicts or overstates the documentation, and save again. Do not tell the user that step 6 was run unless every plan file and every documentation file was read completely in this step.
7. Tell the user in one or two lines that steps 1-6 were run, what they added or fixed, and how many cross-document conflicts were recorded. If they added or fixed nothing, say so.

## Output

Use this structure:

```
# Test Plan #<ID>

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: <path to the documentation file or directory the plan is based on>

## Introduction
## Goals
## Risks
## In Scope / Out Of Scope
## Entry Criteria / Environments
## Exit Criteria / Tools
## Schedule and Estimations / People
```

Save the plan as a Markdown file in `test-plans/` at the repository root, named after the input: `../skypermit/docs/` becomes `test-plans/docs.md`, and `login.md` becomes `test-plans/login.md`.
