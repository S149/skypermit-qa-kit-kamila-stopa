# TC-SYS-003: Submitting a request with a window shorter than 15 minutes is rejected with TIME_WINDOW

- **ID:** TC-SYS-003
- **Title:** Submitting a request with a window shorter than 15 minutes is rejected with TIME_WINDOW
- **Module:** gates
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `06-business-rules.md` §1.4, §6; `03-api-contract.md` "The `422` body"; TP007 G18.1
- **Gate:** TIME_WINDOW
- **Rule reference:** `TSD-4 §3`
- **Rule condition:** Duration out of range
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and the flight-request endpoint is reachable.
2. An operator is signed in and owns a flight request in `DRAFT`.
3. The request references a pilot, an aircraft and a zone for which the `PILOT`, `AIRCRAFT` and `ZONE` gates all pass (a pilot whose rating covers the zone class and whose certification is current at `window_start`, an aircraft whose weight band is permitted by the zone, an operator whose authorisation level is at least the zone's required level, and an altitude within the zone's ceiling), so that `TIME_WINDOW` is the first gate to fail.
4. `window_start` is between 6 hours and 60 days after the moment of submission, the window does not fall inside the zone's curfew, and it does not overlap another `APPROVED` or `UNDER_REVIEW` request for the same aircraft, so that duration is the only violated condition.

## Test Data

- `window_start`: [OPEN QUESTION OQ-038: the documentation gives no concrete value; any instant between 6 hours and 60 days after submission is valid]
- `window_end`: `window_start` plus 14 minutes (one minute below the documented 15-minute minimum duration; `window_end` is after `window_start`).
- Pilot, aircraft, zone code and altitude: [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]

## Steps

1. Send `POST /flight-requests/{id}/submit` for the request described above.

## Expected Result

The response is `422` with `failing_gate` = `TIME_WINDOW` and `rule_reference` = `TSD-4 §3`.

## Open Questions

- [OPEN QUESTION OQ-038: `window_start` is not given by the documentation; any instant between 6 hours and 60 days after submission is valid]
- [OPEN QUESTION OQ-032: no fixed fixtures for a passing pilot, aircraft, zone and altitude are given beyond the zone catalogue in `06-business-rules.md` §4]
