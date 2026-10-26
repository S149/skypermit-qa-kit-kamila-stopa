# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project goal

QA kit for skypermit (located in `../skypermit`, read-only). Claude is used mainly to generate test cases and test plans based on skypermit's `docs/`, not to write automated tests.

## Directory structure

Approximate planned structure (some of it is not created yet):

```
skypermit-qa-kit-*/            # project
├── CLAUDE.md                  # project instructions
├── test-cases/
└── .claude/
    ├── settings.json          # project permissions, shared with the team
    ├── settings.local.json    # personal settings, not committed
    ├── skills/
    │   ├── test-plan/
    │   │   └── SKILL.md
    │   └── test-case-creator/
    │       ├── SKILL.md
    │       ├── examples/
    │       └── templates/
    └── agents/
        └── tc-verifier.md     # subagent
```

## Restrictions for `../skypermit`

`../skypermit` is read-only. Do not modify, create, or delete anything there.
