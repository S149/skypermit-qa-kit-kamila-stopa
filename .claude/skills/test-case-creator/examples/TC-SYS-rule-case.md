# TC-SYS-NNN: <A request that breaks the condition is rejected with the rule's failing_gate>

- **ID:** TC-SYS-NNN
- **Title:** <A request that breaks the condition is rejected with the rule's failing_gate>
- **Module:** gates
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `06-business-rules.md` <§ of the rule>; <TPxxx item, or [OPEN QUESTION OQ-NNN: no matching numbered test-plan item]>
- **Gate:** <failing_gate value from 06 §6>
- **Rule reference:** `<rule_reference value from 06 §6>`
- **Rule condition:** <Condition column from 06 §6, verbatim>
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and the flight-request endpoint is reachable.
2. An operator is signed in. <Describe the operator state the rule needs, for example "an operator whose authorisation level is below the zone's required level".>
3. <Describe each other entity the rule depends on (pilot, aircraft, zone) by the property that matters, for example "a pilot whose certification is older than the validity period at the flight window start". Do not name a specific person, registration or zone code.>

## Test Data

- <field the rule depends on>: <a value that breaks the condition, derived from the limit in the documentation, for example "one unit beyond the documented limit">
- <other required field>: [OPEN QUESTION OQ-NNN: <what the documentation does not give, for example a concrete valid value>]

## Steps

1. Send the request that creates or submits the flight request with the data above.

## Expected Result

The response is `<status code the documentation gives for gate failures>` with `failing_gate` = `<Gate>` and `rule_reference` = `<rule_reference>`.

## Open Questions

- [OPEN QUESTION OQ-NNN: <each gap, one per line, as in the body>]
