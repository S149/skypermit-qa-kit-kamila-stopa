# TC-SYS-005: Validating a request whose window starts less than 6 hours away reports TIME_WINDOW as failed

- **ID:** TC-SYS-005
- **Title:** Validating a request whose window starts less than 6 hours away reports TIME_WINDOW as failed
- **Module:** gates
- **Type:** Negative
- **Layer:** API
- **Priority:** High
- **Requirement:** `06-business-rules.md` §1.4, §6; `03-api-contract.md` Endpoint 13 (`validate`); TP007 G16
- **Gate:** TIME_WINDOW
- **Rule reference:** `TSD-4 §2.1`
- **Rule condition:** Lead time too short
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and the flight-request endpoint is reachable.
2. An operator is signed in and owns a flight request in `DRAFT`.
3. The request references a pilot, an aircraft and a zone for which the `PILOT`, `AIRCRAFT` and `ZONE` gates all pass (a pilot whose rating covers the zone class and whose certification is current at `window_start`, an aircraft whose weight band is permitted by the zone, an operator whose authorisation level is at least the zone's required level, and an altitude within the zone's ceiling), so that `TIME_WINDOW` is the first gate to fail.
4. The window duration is within 15-240 minutes, the window does not fall inside the zone's curfew, and it does not overlap another `APPROVED` or `UNDER_REVIEW` request for the same aircraft, so that lead time is the only condition under test and no other condition of any gate fails.

## Test Data

- `window_start`: 5 hours 59 minutes after the moment `validate` is evaluated (one minute below the documented 6-hour minimum lead time).
- `window_end`: any value giving a duration of 15-240 minutes.
- Pilot, aircraft, zone code and altitude: [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]

## Steps

1. Send `POST /flight-requests/{id}/validate` for the request described above.

## Expected Result

The response reports the `TIME_WINDOW` gate as failed with `failing_gate` = `TIME_WINDOW` and `rule_reference` = `TSD-4 §2.1`.

## Open Questions

- [OPEN QUESTION OQ-032: the documentation gives no fixed fixtures for a passing combination beyond the zone catalogue in `06-business-rules.md` §4; the concrete choice is left to the tester]
