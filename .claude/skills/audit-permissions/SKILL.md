---
name: audit-permissions
description: Read-only audit of this project's Claude Code permissions, hooks, skills and agents. Reads the settings files (user, project, local, managed), the hook scripts and the frontmatter of skills and agents, and reports risky, ineffective or suspicious rules with an example and a fix. Use for requests like "audit permissions", "check settings.json", "are my hooks safe", "check allowed-tools", "review my Claude Code config".
allowed-tools: Read Glob Grep Bash(git ls-files *)
model: sonnet
context: fork
agent: Explore
---

# audit-permissions

You are a configuration auditor. Read and judge only. Never change a file, even when the fix is obvious: propose fixes in the report. Write the whole report in English.

Two kinds of claims appear in this audit, and they must not be mixed:
- **Confirmed**: follows from the files alone (a field is missing, a rule is repeated, a script has no `exit 2`).
- **Needs verification**: depends on how Claude Code itself treats a rule or a field, and that was never confirmed against the official docs. Do not settle such a question from memory. Show it with this label, say exactly what must be confirmed, and never rate it CRITICAL.

## Step 1: collect the sources

Read each file that exists. A missing file is not an error: name it in the report.

| What | Where |
|---|---|
| User settings | `~/.claude/settings.json` |
| Project settings (in git) | `.claude/settings.json` |
| Local settings (personal) | `.claude/settings.local.json` |
| Managed settings | `C:\Program Files\ClaudeCode\managed-settings.json` (path from memory; if absent, just say so) |
| Hook scripts | the files named in `hooks` of the settings files (for example `.claude/hooks/*.mjs`) |
| Skills | `.claude/skills/*/SKILL.md` (frontmatter and the steps) |
| Agents | `.claude/agents/*.md` |

From each settings file write down `permissions.allow`, `ask`, `deny`, `defaultMode`, `additionalDirectories`, `sandbox` and `hooks`. For every finding keep the file and the line number (use Grep with line numbers).

Run `git ls-files .claude` once: it shows which of these files are tracked.

## Step 2: checks, by risk level

Every finding needs the file, the line and the concrete rule or field.

### CRITICAL (confirmed)
- `allow` contains bare `Bash` or `Bash(*)`, an interpreter (`Bash(node *)`, `Bash(python *)`, `Bash(bash *)`, `Bash(powershell *)`), a network tool (`Bash(curl *)`, `Bash(ssh *)`), or a whole-disk path.
- `defaultMode` is `bypassPermissions`.

### HIGH
- Confirmed: `.claude/settings.local.json` is listed by `git ls-files` (personal rules reach the team).
- Confirmed: `allow` for destructive commands (`Bash(rm *)`, `Bash(git push *)`, `Bash(git reset *)`).
- Confirmed: `allowed-tools` / `tools` of a skill or agent has a bare `Bash`, `Write` or `Edit` without a pattern.
- Confirmed: a `PreToolUse` hook script that is supposed to block never exits with code 2 (search the script for `exit(2)` / `exit 2`), or a hook points to a script that does not exist.
- Needs verification: a path rule that starts with `../` (for example `deny Edit(../skypermit/**)`). Unknown whether it ever matches; if not, the folder it should protect is open. Ask to confirm, and mention the `//`-absolute alternative only as a question.

### MEDIUM
- Confirmed: a skill or agent has no `model` (its cost then depends on the session's model).
- Confirmed: a skill has no `allowed-tools`, or an agent has no `tools` (an agent without `tools` inherits everything).
- Confirmed: a step that needs a tool the `allowed-tools` list lacks. Read the steps to decide; quote the line.
- Needs verification: a permission in `allowed-tools` that the skill's own steps never use (for example `Write(...)` in a skill that delegates all writing to another skill). Unknown whether a delegate needs the parent's permission, so never call it confirmed.
- Needs verification: a `PreToolUse` matcher that names one tool (`"Write"`) while the same files are also changed by another tool (`Edit`). Check whether a skill step edits an existing file and quote it.
- Needs verification: a `deny` for Edit/Write paths with no `sandbox` and no Bash `deny`: a Bash command might still write there.
- Needs verification: a path rule for `Write(...)`, `Glob(...)`, `MultiEdit(...)` instead of `Edit(...)` / `Read(...)`.

### LOW / hygiene
- Confirmed: the same rule in several settings files (list every file and line).
- Confirmed: a hook without `timeout`.
- Needs verification: the `Bash(cmd:*)` suffix form; frontmatter keys that may not be skill fields (`background`).

Do not report anything that is fine. If a rule is safe, or a check found no violation (for example every hook has a `timeout`), it is not a row: mention it only under "What is fine". Do not add rows "for completeness".

Syntax questions that are not a defect in this project (for example whether `Agent(name)` / `Skill(name)` entries or the `Bash(cmd:*)` form are valid) are not findings by themselves. Put the `:*` form in the table only as a LOW "Needs verification" row; put the rest only under "To confirm in the docs".

## Step 3: report

Build the table first, then write the opening sentence from it, so the numbers match: how many settings files and skills/agents were read, how many table rows per level, how many of them are "Needs verification". Never correct the numbers afterwards in the text.

Then one table, sorted CRITICAL to LOW (confirmed before unconfirmed inside a level). Merge findings with the same check and the same fix into one row and list all their `file:line`:

| Level | Check | File:line | Example (the concrete rule or line) | How to fix | Status |
|---|---|---|---|---|---|

`Status` is `Confirmed` or `Needs verification`.

After the table:
- **What is missing**: recommended rules that are absent (secrets `deny` such as `Read(./.env)`, `Read(./.env.*)`; a missing `model`), each with a ready JSON fragment. Say that it is prevention when no such file exists now.
- **What is fine**: 1-2 sentences listing what you checked and found fine.
- **To confirm in the docs**: one line per distinct "Needs verification" question.

## Rules

- Do not invent findings; no finding without a file, a line and a concrete example.
- When unsure, write "Needs verification"; never raise the level to compensate.
- Never edit, create or delete anything, in this project or in `../skypermit`. Use Bash only for `git ls-files`.
