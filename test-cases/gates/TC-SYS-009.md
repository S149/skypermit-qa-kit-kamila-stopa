# TC-SYS-009: Submitting a request whose window_end equals window_start is rejected with TIME_WINDOW

- **ID:** TC-SYS-009
- **Title:** Submitting a request whose window_end equals window_start is rejected with TIME_WINDOW
- **Module:** gates
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `06-business-rules.md` §1.4, §6; `03-api-contract.md` "The `422` body"; TP007 G18.2
- **Gate:** TIME_WINDOW
- **Rule reference:** `TSD-4 §3`
- **Rule condition:** Duration out of range
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and the flight-request endpoint is reachable.
2. An operator is signed in and owns a flight request in `DRAFT`.
3. The request references a pilot, an aircraft and a zone for which the `PILOT`, `AIRCRAFT` and `ZONE` gates all pass (a pilot whose rating covers the zone class and whose certification is current at `window_start`, an aircraft whose weight band is permitted by the zone, an operator whose authorisation level is at least the zone's required level, and an altitude within the zone's ceiling), so that `TIME_WINDOW` is the first gate to fail.
4. The window starts between 6 hours and 60 days after the moment of the request, the window does not fall inside the zone's curfew, and it does not overlap another `APPROVED` or `UNDER_REVIEW` request for the same aircraft, so that the order of `window_start` and `window_end` is the only condition under test and no other condition of any gate fails.

## Test Data

- `window_start`: [OPEN QUESTION OQ-038: `window_start` is not given by the documentation; any instant between 6 hours and 60 days after submission is assumed valid]
- `window_end`: equal to `window_start` (a window of zero length; the documentation requires `window_end` strictly after `window_start`).
- Pilot, aircraft, zone code and altitude: [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]

## Steps

1. Send `POST /flight-requests/{id}/submit` for the request described above.

## Expected Result

The response is `422` with `failing_gate` = `TIME_WINDOW` and `rule_reference` = `TSD-4 §3`.

## Open Questions

- [OPEN QUESTION OQ-038: `window_start` is not given by the documentation; any instant between 6 hours and 60 days after submission is assumed valid]
- [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]
- [OPEN QUESTION OQ-033: `03-api-contract.md` says `submit` moves the request to `UNDER_REVIEW` or `REJECTED` while also defining `422` for gate failures; whether a failed `submit` returns `422` and also moves the request to `REJECTED` is not stated, so the request state after the response is not checked]
- [OPEN QUESTION OQ-043: the HTTP status and the `rule_reference` returned for a window whose `window_end` is equal to or before `window_start` are not stated (`422` with `TSD-4 §3` or `400`); `06-business-rules.md` §1.4 requires only "strictly after"]
