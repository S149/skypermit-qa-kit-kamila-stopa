---
name: test-plan-creator
description: Generate a concise ISO/IEC/IEEE 29119-3-style test plan (Markdown, English; about one page for a single feature, longer for a whole application) from a documentation file or directory such as ../skypermit/docs/. Use whenever the user asks for a test plan, "тест-план", a testing plan for a feature or release, or wants to plan testing from docs, even if they don't name the standard.
---

# Test plan generator

Turn a documentation file or directory into a compact test plan saved to `test-plans/<feature-name>.md`.

## Inputs

- A path to a doc file or directory (e.g. `../skypermit/docs/02-state-machine.md`). If none is given, ask for it.
- Optional feature name. Otherwise derive a short kebab-case name from the doc content.

## Process

1. Read every file in the given path. Treat it as the only source of truth: the plan must not claim behavior, risks, roles, dates or numbers that the docs do not support. Never write to `../skypermit`.
2. Read the reference plan `examples/request-lifecycle.md` (in this skill's directory) for shape and level of detail, then draft the plan from the template `templates/test-plan.md` (in this skill's directory) using the structure below. Take stakeholders and roles from what the docs name; where the docs give no data (schedule, estimates, environments, other roles, approver), write `TBD` rather than guessing.
3. Save to `test-plans/<feature-name>.md` (create the folder if needed; if the file exists, ask before overwriting).
4. In the chat reply (in Ukrainian), give the file path and the list of open questions.

## Output rules

- Language of the plan: English. Chat with the user: Ukrainian.
- **Size scales with scope.** A single feature or one doc: aim for about one page (roughly 400-600 words as a guide, not a limit). A whole application or several docs: the plan may run to several pages, since it has to cover more areas and risks. Either way stay concise: tables and bullets, not paragraphs, no padding. If the user explicitly asks for a length (e.g. "one page"), follow that and say what was left out.
- Follow the order and logic of ISO/IEC/IEEE 29119-3 (Context → Strategy → Activities/Estimates → Staffing → Schedule → Risks → Approval) in condensed form. Do not quote the standard; only follow its structure.
- Cite the source doc for every scope item or rule where practical (e.g. `(02-state-machine.md)`) so reviewers can trace it.

## Structure

Start from `templates/test-plan.md` (in this skill's directory; blank template, copy it and fill it in). Then read the references in `examples/`:

- `examples/request-lifecycle.md`: a complete reference plan; match its shape and level of detail.
- `examples/snippets.md`: good and bad risk, stakeholder and open-question snippets.

Examples are fixed references: update them only when this skill's format or rules change, not when a working plan in `test-plans/` is edited. The block below is the same structure in short form.

```markdown
# Test Plan: <Feature name>

**Source docs:** <paths> | **Version/date:** <date> | **Author:** <author>

## 1. Context
- **Test items:** ...
- **Scope:** In: ... / Out: ...
- **Assumptions & constraints:** ...
- **Stakeholders:** list every role or party the docs actually name (with doc ref), then `TBD` for the rest (e.g. "Rules owner (07); API contract owner (05); Operators, Reviewers (04); others TBD")

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

- **Author:** use the person the user names. If none is named, use `git config user.name`; if that is empty too, ask. Do not hardcode a name. Use the same name for the QA role in section 5.
- **Probability, Impact and Score are `TBD` by default.** They are a judgement call that the docs do not make, so leave them for the team to fill in (Score = Probability x Impact once both are set). Fill a number only when the docs explicitly state it. Order risks by how directly the docs flag them (documented conflicts and open questions first).
- Derive product risks from the docs (complex rules, state transitions, integrations, documented open questions). Project risks (staffing, deadlines, environment) are `TBD` unless documented.
- If the docs contain their own open questions or contradictions, surface them in Open questions and reflect them as risks instead of resolving them yourself.
- **Stakeholders, roles and approvers: use what the docs name, `TBD` for the rest.** Collect every party the docs mention (user roles such as operators and reviewers, owners of rules or contracts, admins, maintenance, issuing bodies) and cite where each appears. Use the doc's own wording; do not rename them or assign titles the docs never use (e.g. "QA lead", "product owner"). Anything the docs do not name stays `TBD`. Naming a stakeholder does not make them the approver: the approver is `TBD` unless the docs say who signs off.
- **Count carefully.** Count endpoints, states, rules etc. from the numbered/tabular source, and do not double-count aliases (e.g. an endpoint listed both in an auth table and in the numbered registry). If unsure, say "see <doc>" instead of giving a number.
- **Risks: no cap on count, but each must be accurate.** Include every risk the docs actually support, and none they don't. A risk is valid only if it traces to a specific doc statement (a rule, conflict, open question, or documented limitation) and you cite it (`02 §Rules`, `05 #4`). Check that the wording matches the doc: do not generalise, rename, or infer a failure mode the doc doesn't imply. Merge duplicates; if a risk is only your guess, leave it out or move it to Open questions.
- **Keep it concise, without a strict word limit.** Details belong to test cases, so avoid lists of individual boundary values (name the technique and the doc instead) and keep sections to a few items. Never cut an accurate, doc-backed point just to save words; cut padding and speculation instead.
