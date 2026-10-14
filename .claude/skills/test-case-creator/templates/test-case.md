# {ID}: {Title}

- **ID:** {LAYER}-{ROLE}-{MODULE}-{NNN}
- **Title:** {short title: action and expectation}
- **Doc ref:** {file and section in ../skypermit/docs/, file name in backticks, e.g. `02-state-machine.md`, Cancellation deadline; several refs separated by `;`}
- **Priority:** {High | Medium | Low}

## Preconditions
- {state of the system and actors before the test; cite the doc by file name and section, not by number alone}

## Test data (optional)
- {concrete inputs; delete this section if none}

## Steps
1. {single action}
2. {optional second action}
3. {optional third action}

## Expected result
{one concrete, verifiable result; name the values to compare with the test data; state a status code or body only if the docs define it, otherwise list it as TBD under Dependencies}

## Actual result (optional)
<!-- Leave empty. Filled in during execution. -->

## Dependencies / environment (optional)
- {other test cases or environment constraints; TBD if unknown}

## Postconditions (optional)
- {only if the docs state them}

## Rationale
{why this test exists: the requirement or risk it covers; cite the risk in test-plans/ by file and number when one exists; otherwise say that no matching risk was found}
