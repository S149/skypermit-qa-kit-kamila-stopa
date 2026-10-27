# TC-OP-020: Creating a request whose window_end equals window_start is rejected with 400

- **ID:** TC-OP-020
- **Title:** Creating a request whose window_end equals window_start is rejected with 400
- **Module:** flight-requests
- **Type:** Negative
- **Layer:** API
- **Priority:** Medium
- **Requirement:** `01-data-model.md` FlightRequest (`window_end`: "must be after `window_start`"); `06-business-rules.md` §1.4 (Duration: `window_end` strictly after `window_start`); `03-api-contract.md` endpoint 9 (`POST /flight-requests`) and "Error semantics" (`400`); TP007 G18.2
- **Status:** Draft
- **Execution Result:** Not Run

## Preconditions

1. The application is running and `POST /api/v1/flight-requests` is reachable.
2. An operator is signed in (session cookie) and owns a pilot and an aircraft.

## Test Data

Request body of `POST /api/v1/flight-requests`:

- `pilot_id`: the UUID of a pilot owned by the signed-in operator
- `aircraft_id`: the UUID of an aircraft owned by the signed-in operator
- `zone_code`: a zone code from the catalogue in `06-business-rules.md` §4
- `window_start`: any valid UTC timestamp
- `window_end`: equal to `window_start` (a window of zero length; the documentation requires `window_end` strictly after `window_start`)
- `requested_altitude_metres`: a positive integer
- `flight_purpose`: omitted (optional)

[OPEN QUESTION OQ-004: no concrete example values for these fields are given in the documentation]

## Steps

1. Send `POST /api/v1/flight-requests` with the request body from Test Data.

## Expected Result

The response is `400` with the body `{ "error": "window_end must be after window_start." }`.

## Open Questions

- [OPEN QUESTION OQ-004: no concrete example values for the request fields are given in the documentation]
