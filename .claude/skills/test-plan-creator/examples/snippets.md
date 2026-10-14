# Test plan snippets

Reference for the `test-plan-creator` skill. Read it when drafting a plan; the complete reference plan is `request-lifecycle.md` in this folder.

## Other plans in this repo (for scope and size)

| Scope | File | Notes |
|---|---|---|
| One feature, one doc | `test-plans/request-lifecycle.md` | Compact, about one page; risks from the transition table (fixed reference copy in this folder) |
| One doc, several entities | `test-plans/data-model.md` | Constraints and derived values |
| Whole application | `test-plans/skypermit-application.md` | Several pages; many risks; stakeholders gathered from all docs |

## Snippets: good and bad

### Risk row

Good (traceable, wording matches the doc):

```markdown
| 3 | Product | `APPROVED` request is cancellable closer than 2 h before `window_start` (02, Rules elsewhere; 06 §5) | TBD | TBD | TBD | Cases on both sides of the limit |
```

Bad (generic, no doc ref, invented scores):

```markdown
| 3 | Product | Cancellation may not work correctly | 3 | 4 | 12 | More testing |
```

### Stakeholders line

Good:

```markdown
- **Stakeholders:** Operators and Reviewers (04); rules owner (07); API contract owner (05 §1); other roles TBD.
```

Bad (titles the docs never use):

```markdown
- **Stakeholders:** QA lead, product owner, DevOps.
```

### Open question

Good (a gap or conflict in the docs):

```markdown
3. Which gate reports a schedule overlap: "AIRCRAFT / TIME_WINDOW" (02) or only `TIME_WINDOW` (06 §1.4)?
```

Bad (answerable from the docs, or a guess):

```markdown
3. Should we test the API?
```

### Missing data

```markdown
| Activity | Estimate | Dates |
|---|---|---|
| Test case design | TBD | TBD |
```

Do not fill estimates, dates, roles, thresholds or environments that the docs do not state.
