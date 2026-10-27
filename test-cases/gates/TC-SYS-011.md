# TC-SYS-011: Validating a request with a window of exactly 240 minutes passes the TIME_WINDOW duration check

- **ID:** TC-SYS-011
- **Title:** Validating a request with a window of exactly 240 minutes passes the TIME_WINDOW duration check
- **Module:** gates
- **Type:** Positive
- **Layer:** API
- **Priority:** High
- **Requirement:** `06-business-rules.md` §1.4, §6; `03-api-contract.md` Endpoint 13 (`validate`); TP007 G18.1
- **Gate:** TIME_WINDOW
- **Rule reference:** `TSD-4 §3`
- **Rule condition:** Duration out of range
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and the flight-request endpoint is reachable.
2. An operator is signed in and owns a flight request in `DRAFT`.
3. The request references a pilot, an aircraft and a zone for which the `PILOT`, `AIRCRAFT` and `ZONE` gates all pass (a pilot whose rating covers the zone class and whose certification is current at `window_start`, an aircraft whose weight band is permitted by the zone, an operator whose authorisation level is at least the zone's required level, and an altitude within the zone's ceiling), so that `TIME_WINDOW` is the first gate to fail.
4. The window starts between 6 hours and 60 days after the moment of the request, the window does not fall inside the zone's curfew, and it does not overlap another `APPROVED` or `UNDER_REVIEW` request for the same aircraft, so that duration is the only condition under test and no other condition of any gate fails.

## Test Data

- `window_start`: [OPEN QUESTION OQ-038: `window_start` is not given by the documentation; any instant between 6 hours and 60 days after submission is assumed valid]
- `window_end`: `window_start` plus 240 minutes (the documented maximum duration, inclusive).
- Pilot, aircraft, zone code and altitude: [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]

## Steps

1. Send `POST /flight-requests/{id}/validate` for the request described above.

## Expected Result

The `TIME_WINDOW` gate passes: the response does not report `failing_gate` = `TIME_WINDOW` with `rule_reference` = `TSD-4 §3`.

## Open Questions

- [OPEN QUESTION OQ-038: `window_start` is not given by the documentation; any instant between 6 hours and 60 days after submission is assumed valid]
- [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]
- [OPEN QUESTION OQ-041: the status code and the body of `POST /flight-requests/{id}/validate` for a passing gate and for a failing gate are not stated (`03-api-contract.md` says it runs the gates "exactly as `submit` would" and shows "four gate results", but defines no response shape)]
