---
name: test-plan
description: Generate a one-page, ISO/IEC/IEEE 29119-3-style test plan (Markdown, English) from a documentation file or directory such as ../skypermit/docs/. Use whenever the user asks for a test plan, "тест-план", a testing plan for a feature or release, or wants to plan testing from docs, even if they don't name the standard.
---

# One-page test plan generator

Turn a documentation file or directory into a compact test plan saved to `test-plans/<feature-name>.md`.

## Inputs

- A path to a doc file or directory (e.g. `../skypermit/docs/02-state-machine.md`). If none is given, ask for it.
- Optional feature name. Otherwise derive a short kebab-case name from the doc content.

## Process

1. Read every file in the given path. Treat it as the only source of truth: the plan must not claim behavior, risks, roles, dates or numbers that the docs do not support. Never write to `../skypermit`.
2. Draft the plan using the structure below. Where the docs give no data (schedule, roles, estimates, environments), write `TBD` rather than guessing.
3. Save to `test-plans/<feature-name>.md` (create the folder if needed; if the file exists, ask before overwriting).
4. In the chat reply (in Ukrainian), give the file path and the list of open questions.

## Output rules

- Language of the plan: English. Chat with the user: Ukrainian.
- Aim for a concise, about one-page plan (roughly 400-600 words is a guide, not a hard limit; it may run longer when accuracy requires it, e.g. many documented risks). Use tables and bullets, not paragraphs. Keep sections to a few items.
- Follow the order and logic of ISO/IEC/IEEE 29119-3 (Context → Strategy → Activities/Estimates → Staffing → Schedule → Risks → Approval) in condensed form. Do not quote the standard; only follow its structure.
- Cite the source doc for every scope item or rule where practical (e.g. `(02-state-machine.md)`) so reviewers can trace it.

## Structure

```markdown
# Test Plan: <Feature name>

**Source docs:** <paths> | **Version/date:** <date> | **Author:** Kamila Stopa

## 1. Context
- **Test items:** ...
- **Scope:** In: ... / Out: ...
- **Assumptions & constraints:** ...
- **Stakeholders:** ... (TBD if the docs name none)

## 2. Test strategy
- **Manual vs automated:** manual: ...; automation: TBD (not started unless requested)
- **Design techniques:** (e.g. state transition, boundary value, equivalence partitioning, decision table - pick only those that fit the docs)
- **Environment & data:** ...
- **Retesting & regression:** ...

## 3. Completion & suspension criteria
- **Completion:** ...
- **Suspension / resumption:** ...

## 4. Risks
| # | Type (Product/Project) | Risk (with doc ref) | Probability (1-5) | Impact (1-5) | Score | Mitigation |
|---|---|---|---|---|---|---|
| 1 | Product | ... | TBD | TBD | TBD | ... |

## 5. Roles, schedule & estimates
| Role | Responsibility |  ...
| Activity | Estimate | Dates |  (TBD where unknown)

## 6. Deliverables & approval
- **Deliverables:** test cases (`test-cases/`), execution report, defect reports
- **Approval:** TBD

## Open questions
1. ...
```

## Notes

- Author is Kamila Stopa unless the user names someone else.
- **Probability, Impact and Score are `TBD` by default.** They are a judgement call that the docs do not make, so leave them for the team to fill in (Score = Probability x Impact once both are set). Fill a number only when the docs explicitly state it. Order risks by how directly the docs flag them (documented conflicts and open questions first).
- Derive product risks from the docs (complex rules, state transitions, integrations, documented open questions). Project risks (staffing, deadlines, environment) are `TBD` unless documented.
- If the docs contain their own open questions or contradictions, surface them in Open questions and reflect them as risks instead of resolving them yourself.
- **Roles and approvers are `TBD`** unless the docs name them. Do not invent titles such as "QA lead", "product owner", "rules owner".
- **Count carefully.** Count endpoints, states, rules etc. from the numbered/tabular source, and do not double-count aliases (e.g. an endpoint listed both in an auth table and in the numbered registry). If unsure, say "see <doc>" instead of giving a number.
- **Risks: no cap on count, but each must be accurate.** Include every risk the docs actually support, and none they don't. A risk is valid only if it traces to a specific doc statement (a rule, conflict, open question, or documented limitation) and you cite it (`02 §Rules`, `05 #4`). Check that the wording matches the doc: do not generalise, rename, or infer a failure mode the doc doesn't imply. Merge duplicates; if a risk is only your guess, leave it out or move it to Open questions.
- **Keep it concise, without a strict word limit.** Details belong to test cases, so avoid lists of individual boundary values (name the technique and the doc instead) and keep sections to a few items. Never cut an accurate, doc-backed point just to save words; cut padding and speculation instead.
