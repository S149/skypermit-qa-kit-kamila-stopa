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

Every test case must contain:

- **ID** (unique, e.g. `TC-<FEATURE>-001`)
- **Title**
- **Preconditions**
- **Steps** (numbered)
- **Expected result**
- **Priority** (e.g. High / Medium / Low)

## Language

All documentation in this repo (test cases, test plans, bug reports, checklists, skills, and any other written artifacts) must be written in **English**. The user may chat in Ukrainian; reply to the user in Ukrainian, but write every file in English.

## Restrictions

- Never modify, create, or delete anything in `../skypermit`.
- Do not invent behavior that is not in the documentation. If `docs/` is missing or ambiguous on something, ask the user instead of assuming.
