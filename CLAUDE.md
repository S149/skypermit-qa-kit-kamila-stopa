# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

QA kit for the `skypermit` project (located at `../skypermit`, **read-only**). It is used for:

1. **Manual testing support** — preparing checklists, analyzing features, writing bug reports.
2. **Testware generation** — producing test cases and test plans based on `../skypermit/docs/`.
3. **Test automation** — *future stage*. Do NOT write automated tests until the user explicitly asks for it.

## Directory structure

- `test-cases/` — generated test cases
- `test-plans/` — test plans
- `.claude/skills/` — skills for repeatable QA tasks
- `bug-reports/` — *(optional)* bug reports, create only when needed
- `checklists/` — *(optional)* manual testing checklists, create only when needed
- `automation/` — *(optional, future)* automated tests; do not create until requested

## Source of truth

All product behavior comes from `../skypermit/docs/`. Read it before writing any testware and reference the doc a test case is based on.

## Test case format

Test cases are atomic: one action or condition, one expected result. One file per case at `test-cases/{module}/{ID}.md` (file name = ID), created from the skill's template `.claude/skills/test-case-creator/templates/test-case.md` by the `test-case-creator` skill.

- **ID:** `{LAYER}-{ROLE}-{MODULE}-{NNN}`, e.g. `API-OP-FREQ-001`; `NNN` is counted per module
- **Required fields:** ID, Title, Doc ref, Priority (High / Medium / Low), Preconditions, Steps (1-3), Expected result, Rationale
- **Optional fields:** Test data, Actual result, Dependencies / environment, Postconditions

Layer, role and module codes, numbering rules and the priority rule are documented in `.claude/skills/test-case-creator/SKILL.md`.

## Language

All documentation in this repo (test cases, test plans, bug reports, checklists, skills, and any other written artifacts) must be written in **English**. The user may chat in Ukrainian; reply to the user in Ukrainian, but write every file in English.

One exception: the `description` of a skill may include Ukrainian trigger phrases (e.g. "тест-кейс", "тест-план") so the skill activates on Ukrainian requests. Everything else in a skill, including its instructions, stays in English.

## Restrictions

- Never modify, create, or delete anything in `../skypermit`.
- Do not invent behavior that is not in the documentation. If `docs/` is missing or ambiguous on something, ask the user instead of assuming.
