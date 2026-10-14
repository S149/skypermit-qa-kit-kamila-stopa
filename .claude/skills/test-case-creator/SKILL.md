---
name: test-case-creator
description: Generate ONE atomic, low-level test case (one action or condition, one expected result) as a Markdown file in test-cases/{module}/, based on the documentation in ../skypermit/docs/ and structured after ISO/IEC/IEEE 29119-3 test case specification. Use whenever the user asks for a single test case, "тест-кейс", "один кейс", "напиши кейс на ...", or a check for one specific rule, status code, constraint or field. Do NOT use for a test plan (use test-plan-creator), for end-to-end scenarios with many steps, for checklists, or for bug reports.
---

# Atomic test case generator

One invocation produces exactly one test case: one concrete action or condition and one concrete expected result. Atomic cases are easy to execute, trace to a single doc statement, and report on without ambiguity.

## Inputs

- A request naming the check (e.g. "cancel an APPROVED request closer than 2 hours to window_start"), optionally a doc path or section.
- If the request needs several checks or reads like a scenario, do not write them all. List the separate atomic cases it would split into (one line each), then ask which one to create first. In that list use the layer, role and module parts of the ID with `NNN` as the number (e.g. `API-OP-FREQ-NNN`), because real numbers are only assigned when a case is created and may already be taken. Offer to create them one at a time, one per invocation; do not offer to create all of them at once.

## Process

1. Find the requirement in `../skypermit/docs/`. Read the relevant doc(s); the docs are the only source of truth. Never write anything in `../skypermit`.
2. Confirm the doc states both the condition and the expected result. If either is missing or ambiguous, do not guess: ask the user, or write `TBD` in the affected field and say so in the chat reply.
3. Decide the ID parts (layer, role, module) using the tables below, then find the next free number.
4. Look in `test-plans/` for the risk this case covers (search for the rule, endpoint or doc name) and note its plan file and number for the Rationale.
5. Read the reference case `examples/API-ANON-AUTH-001.md` (in this skill's directory) for tone and level of detail, fill the template `templates/test-case.md` (in this skill's directory) to match its shape, and save to `test-cases/{module}/{ID}.md` (create the module folder if needed; never overwrite an existing file).
6. Reply in Ukrainian: file path, one-line summary, anything marked `TBD` or any doc conflict you found.

## Directory layout and naming

```
test-cases/
  {module}/            # lowercase module directory name, see table
    {ID}.md            # one file per test case, file name = ID
```

### ID format: `{LAYER}-{ROLE}-{MODULE}-{NNN}`

Example: `API-OP-FREQ-001` = API layer, Operator role, flight-requests module, case 001.

| Part | Values |
|---|---|
| LAYER | `API` (REST endpoint behavior), `UI` (portal / reviewer queue, `data-testid` contract), `DB` (schema, constraints, derived values) |
| ROLE | `OP` operator (logged-in), `RV` reviewer (`X-Reviewer-Id`), `ANON` no session and no reviewer header, `SYS` system / maintenance / data-level checks with no acting user |
| MODULE | see module table |
| NNN | three digits, zero padded, starting at `001` |

| Module dir | Code | Covers |
|---|---|---|
| `auth` | `AUTH` | registration, login, logout, `/auth/me`, sessions, 401/403 scoping |
| `operators` | `OPER` | operator profile, `authorisation_level`, `SUSPENDED` |
| `pilots` | `PILOT` | pilot registry, rating, derived currency |
| `aircraft` | `ACFT` | aircraft registry, `mtom_grams`, derived weight band, 30,000 g ceiling |
| `zones` | `ZONE` | zone catalogue and seed data |
| `flight-requests` | `FREQ` | request create/list/get/cancel/validate/submit, states, `409` |
| `review` | `REVW` | approve/reject, `ReviewAction`, reviewer queue |
| `gates` | `GATE` | PILOT / AIRCRAFT / ZONE / TIME_WINDOW rules, `422` body, `rule_reference` |
| `audit-log` | `AUDT` | `AuditLog` append-only behavior |
| `app-shell` | `SHEL` | header, role switcher, login/register links, `data-testid` of shared elements |

If a case does not fit any module, ask the user before adding a new row to this table.

### Numbering: finding the next free number

1. List the files in `test-cases/{module}/`.
2. Take the highest `NNN` among all of them, regardless of layer and role, and add 1. Counting is per module, so `API-OP-FREQ-001` and `UI-RV-FREQ-002` share one sequence.
3. Empty or missing folder: start at `001`.
4. Never reuse a number, even if a file was deleted. If you suspect gaps, check `git log` for the folder before assigning.

## Fields

All fields are in `templates/test-case.md` (in this skill's directory). Required unless marked optional:

| Field | Rule |
|---|---|
| ID | per format above; equals the file name |
| Title | short, states action and expectation; the first line of the file is `# {ID}: {Title}` with exactly this Title |
| Doc ref | doc file and section the requirement comes from. Use the section number when the doc has one (`06-business-rules.md, §1.2`), otherwise the exact heading as written in the doc; do not invent section names. Several refs allowed |
| Priority | `High` / `Medium` / `Low`, see below |
| Preconditions | state of the system and actors before the test |
| Test data (optional) | concrete inputs, including every variable the Steps use (e.g. the request `{id}` and its state, the `X-Reviewer-Id` value); omit only if the Steps use none |
| Steps | 1-3 numbered actions, all for the one check |
| Expected result | one concrete, verifiable result, stating only what the docs define. Unknowns (status code, response body, etc.) are not explained here: write `TBD` and put the explanation in Dependencies / environment |
| Actual result (optional) | leave empty; filled in during execution |
| Dependencies / environment (optional) | other cases or environment constraints; `TBD` if the docs and user give none |
| Postconditions (optional) | only if the docs state them |
| Rationale | why the test exists: which requirement or risk it covers; cite the risk in `test-plans/` by file and number when one exists (say so if none was found). Cite risks about the same behavior and layer; cite a risk from another layer (e.g. a UI risk for an API case) only if it names the same requirement, and say so |

### Priority rule (default)

- **High:** the doc states the behavior as a hard rule with a defined failure outcome (`409`, `422`, `401`/`403`, "must", "never", "is illegal"). If the rule is stated but the doc defines no failure outcome (e.g. no status code), it is not High: use Medium and mark the missing outcome `TBD`.
- **Medium:** other documented rules and field behavior.
- **Low:** presentation or consistency details.

The user's explicit priority always wins.

## Example

`examples/API-ANON-AUTH-001.md` is the reference for tone, level of detail and how to fill every field (one check, two steps, one expected result, `TBD` where the docs are silent, rationale linked to a test-plan risk). Read it before writing a case and match its shape; the blank structure to fill is `templates/test-case.md`. Examples are fixed references: update them only when this skill's format or rules change, not when the working case in `test-cases/` is edited. Do not reuse the example's ID, and do not count files in `examples/` when numbering.

## Content rules

- Write the test case in English; chat in Ukrainian.
- Do not invent behavior, thresholds, status codes, field names or values that the docs do not contain. Missing data becomes a question or `TBD`.
- Before writing `TBD` for an error response, check the docs' reference tables for it (e.g. the `rule_reference` table in `06-business-rules.md` §6, "Error semantics" in `03-api-contract.md`). Use what is there; `TBD` only what is truly absent.
- When a reference table defines a value, it is documented: put it in Expected result and do not list it as `TBD`. Example: for an aircraft above 30,000 g, `06-business-rules.md` §6 has a row `(n/a, registration, not a gate)` with `rule_reference` `OH-1 §3`. "n/a" there is the defined `failing_gate` value (no gate), not a missing one. So Expected result is `422` with `rule_reference` `OH-1 §3` and no `failing_gate`, and the body must not be marked `TBD`. Mark `TBD` only the body parts that no table defines (e.g. an error `message`).
- Do not name roles or owners the docs never use (e.g. "product owner"). Use the doc's own wording ("API contract owner", `05-open-questions.md` §1) or `TBD`.
- Expected result must be a single observable outcome. Put "and also ..." checks in separate cases, and do not add outcomes the docs do not state (e.g. "no audit record is written").
- Expected result is one sentence stating one outcome; do not say the same thing twice in different words (e.g. "is refused and no rejection is accepted"). Put unknowns (such as a status code) after it as `TBD`.
- If the docs state a second observable consequence of the same action (e.g. "no aircraft record is created"), do not fold it into this case: offer it in the reply as a separate atomic case.
- Every statement in Expected result must be checkable by the Steps. If it mentions a state after the action (e.g. "the request stays `UNDER_REVIEW`"), add a step that reads that state (max 3 steps); otherwise move it to Postconditions only if the docs state it, or drop it.
- Prefer values that are unambiguous in the docs; avoid boundary values the docs leave open (e.g. exactly 2 hours inclusive/exclusive) unless the user asks and the doc settles it.
- Follow the structure of ISO/IEC/IEEE 29119-3 only; do not quote the standard.
