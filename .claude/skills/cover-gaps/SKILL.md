---
name: cover-gaps
description: Finds SkyPermit business rules (gates) that have no test cases, generates one case per rule through test-case-creator, and verifies each case through tc-verifier. Use for requests like "close the coverage gaps", "which rules have no test cases", "cover the gaps", "uncovered rules".
argument-hint: "[max-rules] [gate]"
model: sonnet
disable-model-invocation: true
allowed-tools: Read Grep Glob Write(test-cases/**) Edit(.notes/open-questions.md) Bash(node scripts/uncovered-rules.mjs:*) Agent(tc-verifier) Skill(test-case-creator)
---

# cover-gaps

Closes business-rule gaps with verified test cases. The steps are fixed and each one has a gate before the next, because an unverified case checks nothing real. Each step is done by the cheapest executor that does not lose quality.

| Step | Executor | Model |
|---|---|---|
| 1. Find uncovered rules | `scripts/uncovered-rules.mjs` | none (0 tokens) |
| 2. Generate one case per rule | `test-case-creator` skill | Sonnet (`model: sonnet` in its frontmatter) |
| Gate | `PreToolUse` hook `.claude/hooks/validate-test-case.mjs` on every Write into `test-cases/` | none |
| 3. Verify each case | `tc-verifier` subagent | Haiku (`model: haiku` in its frontmatter), read-only |

Do not write or edit a test case yourself, and do not switch models with `/model`: the models are set in the frontmatter of the delegates, so this session's cache stays intact. The usage-report (`SessionEnd` hook, `reports/ws2/`) records models, tokens and cost per step; this skill does not report cost.

## Uncovered rules (already computed)

Arguments: `$ARGUMENTS` (format `[max-rules] [gate]`; defaults: 5 rules, all gates).

!`node scripts/uncovered-rules.mjs $ARGUMENTS`

The JSON above is the output of step 1. Use it as is: do not re-read `06-business-rules.md` or `07-clarifications.md` to find gaps, the script already compared them with `test-cases/` and applied the clarifications.

## Step 0: read the script output

- `"status": "error"`: report the `error` text and stop. Do not guess arguments or run the script again with other values. Valid gates are listed in `valid_gates`.
- `gaps_found` is `0`: print the final JSON (below) with empty `results`, and stop. Nothing to generate.
- Otherwise process `gaps` in the order given, at most `gaps_selected` of them, one rule at a time.
- A rule with `"citation_confirmed": false` is processed normally, and its question goes to `open_questions` as well (the documentation itself leaves the citation open).

## Step 2: generate one case per rule

For each gap call the `test-case-creator` skill with this input (it works unattended for such input; see "Unattended mode" in its SKILL.md):

```
Input: business rule
  gate: <gate>
  rule_reference: <rule_reference>
  condition: <condition>
Source: ../skypermit/docs/06-business-rules.md section 6; 07-clarifications.md overrides 06.
Output: exactly one new file test-cases/gates/TC-SYS-{NNN}.md with the fields Gate, Rule reference and Rule condition copied from the input.
Done when: the file is saved, it passed the format hook, and you re-read it against the documentation.
Never edit or overwrite an existing case.
```

Record the path the creator reports. Success means the file exists and the format hook did not block the last write. If the hook blocks a write (exit 2, the reasons are in the message), the creator fixes and writes again; if it still fails after two fixes, or the creator reports a duplicate, or produces nothing, set `verdict: "generation_failed"`, `case_id: null`, put the reason in `note`, and go to the next rule. Never carry a failed rule into verification.

If the creator reports `other_checks`, the rule has more checks than the case it just wrote. Do not drop them and do not turn them into open questions: call `test-case-creator` once more for each of them, one at a time, with the same input plus a line `check: <the check as listed>`. Each result goes through Step 3 like any other case, and gets its own entry in `results` (same `rule_reference`, its own `case_id`). The new calls report `other_checks` again only for checks not yet covered; never create two cases for the same check. Do not count these extra cases against `max-rules`.

## Step 3: verify each new case

For each case created in this run, call the `tc-verifier` subagent with:

```
Verify the test case at <path> against ../skypermit/docs and the code in ../skypermit.
Return your standard report. The last lines must state the overall verdict: Matches | Does not match | Docs silent | Mixed.
Done when: every Step and Expected Result item has a verdict with a cited source.
```

Map the overall verdict (the verifier never writes; you act on its report):

| Verifier says | Action | `verdict` | `case_kept` |
|---|---|---|---|
| Matches | keep the case | `matches` | true |
| Mixed (matches plus docs silent, no mismatch) | keep the case; add each silent item to `open_questions` | `matches` | true |
| Does not match | one repair attempt, see below | `matches` after a successful repair, else `does_not_match` | per outcome |
| Docs silent (all items) | remove the case; the rule goes to `open_questions` | `docs_silent` | false |

**Repair attempt (one only).** Call `test-case-creator` again with `revise: <path>` and the verifier's quoted findings (both sides of every mismatch). Then call `tc-verifier` again. If it now says Matches or Mixed, keep the case. If it says Does not match again, or anything else, remove the case by running `node scripts/uncovered-rules.mjs --remove <path>` (that command only deletes a `TC-*-NNN.md` under `test-cases/` whose Status is Draft and Execution Result is Not Run). A rejected case must not stay in `test-cases/`.

Remove only files created in this run. Never delete, rewrite or move an older case.

**Verifier unavailable** (the subagent cannot be started or returns no verdict): do not verify the case yourself. Keep the file, set `verdict: "verifier_unavailable"`, `case_kept: true`, and say in `note` that it is unverified. Tell the user at the end.

## Step 4: register open questions

The creators already registered the questions of their own cases (the case carries `OQ-` IDs; do not register those again). After the last rule, register the rest in `.notes/open-questions.md` (format and rules are in its header): the script's questions, the verifier's silent items, and unconfirmed citations. Status `open`, Source = the case ID (or `cover-gaps` when no case is kept), Gate / rule = `<gate> <rule_reference>`. If the same question is already in the register, add this case to that row's Source and use its ID.

Then clean up after removed cases: for every case removed in this run, look at the register rows whose Source is only that case. Set their Status to `dropped` and Answer to `case removed (<verdict>)`. A row that also lists other cases stays `open`; remove only the removed case from its Source.

Put each question's `OQ-` ID in the `id` field of `open_questions` below, for the questions of kept cases too (read the IDs from the case's Open Questions section or from the creator's report).

## Output contract

After the last rule print exactly one JSON object in a ```json block, then at most two lines of plain text (anything the user must act on, for example unverified cases). The schema is fixed; every run uses all fields:

```json
{
  "rules_checked": 13,
  "gaps_found": 13,
  "gaps_processed": 5,
  "gaps_skipped": 8,
  "results": [
    {
      "gate": "TIME_WINDOW",
      "condition": "Overlaps another request",
      "rule_reference": "TSD-4 §5",
      "case_id": "TC-SYS-001",
      "case_path": "test-cases/gates/TC-SYS-001.md",
      "verdict": "matches",
      "case_kept": true,
      "note": ""
    }
  ],
  "open_questions": [
    { "id": "OQ-001", "gate": "ZONE", "rule_reference": "ZC-2026.1 §4", "question": "..." }
  ],
  "errors": []
}
```

- `rules_checked`, `gaps_found`, `gaps_skipped` come from the script (`rules_checked`, `gaps_found`, `gaps_skipped`); `gaps_processed` is the number of entries in `results`.
- `verdict` is one of `matches`, `does_not_match`, `docs_silent`, `generation_failed`, `verifier_unavailable`.
- `case_id` and `case_path` are `null` when no case exists (generation failed, or the case was removed: then `case_id` keeps the ID that was removed and `case_path` is `null`).
- `open_questions` merges the script's `open_questions`, silent items from the verifier, unconfirmed citations, and the questions of kept cases. Each entry has `id` (the `OQ-` ID from the register), `gate`, `rule_reference` (either may be `null`) and `question`.
- `errors` lists anything that went wrong outside a single rule (script failure, hook failure) as strings; empty if none.

## Limits

- Add new files only. Do not edit, overwrite or delete an existing case, except removing a rejected case created in this run (above).
- Never touch `../skypermit` (read-only).
- One rule, one case. Do not batch rules into one creator call.
