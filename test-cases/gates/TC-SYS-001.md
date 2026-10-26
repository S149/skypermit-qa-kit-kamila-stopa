# TC-SYS-001: Submitting a request whose window starts less than 6 hours away is rejected with TIME_WINDOW

- **ID:** TC-SYS-001
- **Title:** Submitting a request whose window starts less than 6 hours away is rejected with TIME_WINDOW
- **Module:** gates
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `06-business-rules.md` §1.4, §6; `03-api-contract.md` "The `422` body"; TP007 G16
- **Gate:** TIME_WINDOW
- **Rule reference:** `TSD-4 §2.1`
- **Rule condition:** Lead time too short
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and the flight-request endpoint is reachable.
2. An operator is signed in and owns a flight request in `DRAFT`.
3. The request references a pilot, an aircraft and a zone for which the `PILOT`, `AIRCRAFT` and `ZONE` gates all pass (a pilot whose rating covers the zone class and whose certification is current at `window_start`, an aircraft whose weight band is permitted by the zone, an operator whose authorisation level is at least the zone's required level, and an altitude within the zone's ceiling), so that `TIME_WINDOW` is the first gate to fail.
4. The window duration is within 15-240 minutes, the window does not fall inside the zone's curfew, and it does not overlap another `APPROVED` or `UNDER_REVIEW` request for the same aircraft, so that lead time is the only violated condition.

## Test Data

- `window_start`: 5 hours 59 minutes after the moment of submission (one minute below the documented 6-hour minimum lead time).
- `window_end`: [OPEN QUESTION: the documentation does not give a concrete `window_end`; any value giving a duration of 15-240 minutes is valid]
- Pilot, aircraft, zone code and altitude: [OPEN QUESTION: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]

## Steps

1. Send `POST /flight-requests/{id}/submit` for the request described above.

## Expected Result

The response is `422` with `failing_gate` = `TIME_WINDOW` and `rule_reference` = `TSD-4 §2.1`.

## Open Questions

- [OPEN QUESTION: `window_end` is not given by the documentation; any duration of 15-240 minutes is valid]
- [OPEN QUESTION: no fixed fixtures for a passing pilot, aircraft, zone and altitude are given beyond the zone catalogue in `06-business-rules.md` §4]
- [OPEN QUESTION: `03-api-contract.md` says `submit` moves the request to `UNDER_REVIEW` or `REJECTED` while also defining `422` for gate failures; whether a failed `submit` returns `422` and also moves the request to `REJECTED` is not stated, so the request state after the response is not checked]
- [OPEN QUESTION: further checks not covered: exactly 6 hours before `window_start` (boundary that passes, "≥ 6 hours"); the same rule through `POST /flight-requests/{id}/validate`]
