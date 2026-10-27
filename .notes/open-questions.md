# Open questions

The single register of open questions for this kit. Skills (`test-case-creator`, `test-plan`, `cover-gaps`) add rows; people close them.

- **What belongs here**: only questions about the product documentation and the project under test (`../skypermit`): something the docs do not state, state twice differently, or leave to the tester. Questions about the kit itself (the structure of a skill, a template, a hook, field values of our own test-case format) do not belong here: decide them or ask the user in the chat, and never put them in a case, a plan or this table.
- **ID**: `OQ-NNN`, three digits. A new row gets the next number after the highest ID in the table. An ID is never changed or reused.
- **Status**: `open` (default for a new row), `answered` (the answer is in the Answer column), `dropped` (no longer relevant; say why in Answer). Skills write `open`, with one exception: `cover-gaps` sets `dropped` ("case removed") on a row whose only Source was a case it just removed. Only a person sets `answered`.
- **Source**: where the gap was found: case IDs (`TC-SYS-004`; several are comma-separated), plan items (`TP001 S2.1`), or `cover-gaps`.
- **Gate / rule**: `<GATE> <rule_reference>` when the question concerns a business rule, otherwise `-`.
- **Duplicates**: one row per question, not per case. Before adding a row, check the table. If the same question is already there (whatever its Source), do not add a row: add the new case or plan item to that row's Source and use its ID.
- **Markers**: every case and plan carries the question as `[OPEN QUESTION OQ-007: text]` (several IDs: `OQ-001, OQ-003`). The text stays in the case so it reads on its own; the row here holds the ID and the status. The hook `validate-test-case.mjs` rejects a case whose marker has no ID or an ID missing from this table.
- **Answering**: set Status to `answered` and fill Answer, then fix the case or plan that carries the marker. The table is the index; the marker text can lag behind it until someone fixes it.

| ID | Status | Added | Source | Gate / rule | Question | Answer |
|---|---|---|---|---|---|---|
| OQ-001 | open | 2026-10-27 | TC-OP-001, TC-OP-002, TC-OP-003, TC-OP-004, TC-OP-005, TC-OP-006, TC-OP-007, TC-OP-011 | - | Registration request: the name of the password field and the password rules are not stated | |
| OQ-002 | open | 2026-10-27 | TC-OP-001, TC-OP-002, TC-OP-003, TC-OP-004, TC-OP-005, TC-OP-006, TC-OP-007 | - | Registration request: whether `phone`, `address_line`, `city`, `postal_code` are required or optional is not stated | |
| OQ-003 | open | 2026-10-27 | TC-OP-009, TC-OP-011 | - | Registration form/request: the full list of Operator fields (behind "etc." in `04-frontend-spec.md`) is not stated | |
| OQ-004 | open | 2026-10-27 | TC-OP-001, TC-OP-002, TC-OP-003, TC-OP-004, TC-OP-005, TC-OP-006, TC-OP-007, TC-OP-011, TC-OP-013, TC-OP-014, TC-OP-015, TC-OP-018, TC-OP-019 | - | No concrete example values (email, password, request fields) are given in the documentation | |
| OQ-005 | open | 2026-10-27 | TC-OP-001, TC-OP-003, TC-OP-004 | - | `POST /operators`: the success HTTP status code and the response body are not stated (so whether `id` or `authorisation_level` is returned is unknown) | |
| OQ-006 | open | 2026-10-27 | TC-OP-004, TC-OP-013 | - | The name and attributes of the session cookie are not stated | |
| OQ-007 | open | 2026-10-27 | TC-OP-001, TC-OP-005, TC-OP-013 | - | `GET /auth/me`: the fields of the returned operator profile are not stated (does it include `authorisation_level`?) | |
| OQ-008 | open | 2026-10-27 | TC-OP-002 | - | How a tester reads `auth.users` and the Operator table (access, tool) is not stated | |
| OQ-009 | open | 2026-10-27 | TC-OP-005 | - | `POST /operators` with `authorisation_level` in the body: ignored or rejected is not stated | |
| OQ-010 | open | 2026-10-27 | TC-OP-006 | - | `POST /operators` with a duplicate email: the HTTP status code and the response body are not stated | |
| OQ-011 | open | 2026-10-27 | TC-OP-007 | - | `POST /operators` with a duplicate `national_id`: status code and body are not stated; whether a Supabase Auth user is left behind is not stated | |
| OQ-012 | open | 2026-10-27 | TC-OP-008 | - | `POST /operators`: what counts as a "malformed request body" (and the required fields and validation rules) is not stated | |
| OQ-013 | open | 2026-10-27 | TC-OP-008, TC-OP-016 | - | The structure of the validation detail in the `400` body is not stated | |
| OQ-014 | open | 2026-10-27 | TC-OP-008 | - | Whether an operator (Auth user or profile) is created when `POST /operators` returns `400` is not stated | |
| OQ-015 | open | 2026-10-27 | TC-OP-009, TC-OP-010, TC-OP-011 | - | The `data-testid` values of the register form, its fields and its submit button are not stated | |
| OQ-016 | open | 2026-10-27 | TC-OP-009 | - | The labels of the register form fields and submit button are not stated | |
| OQ-017 | open | 2026-10-27 | TC-OP-010 | - | What counts as an input that names the authorisation level on the register form is not stated | |
| OQ-018 | open | 2026-10-27 | TC-OP-011 | - | The page the user lands on after a successful registration is not stated | |
| OQ-019 | open | 2026-10-27 | TC-OP-012 | - | Which page counts as "the application" (start page) and where the register link is placed are not stated | |
| OQ-020 | open | 2026-10-27 | TC-OP-012 | - | The target of the register link (whether it leads to `/register`) is not stated | |
| OQ-021 | open | 2026-10-27 | TC-OP-014, TC-OP-015 | - | Login request: the name of the password field is not stated | |
| OQ-022 | open | 2026-10-27 | TC-OP-014 | - | `POST /auth/login` with wrong credentials: the HTTP status code and the body are not stated | |
| OQ-023 | open | 2026-10-27 | TC-OP-015 | - | `POST /auth/login` with an unregistered email: status code and body are not stated, nor whether it differs from the wrong-password response | |
| OQ-024 | open | 2026-10-27 | TC-OP-014, TC-OP-015 | - | Whether a failed `POST /auth/login` sets any session cookie is not stated | |
| OQ-025 | open | 2026-10-27 | TC-OP-016 | - | `POST /auth/login`: what counts as a "malformed request body" (and the required fields and validation rules) is not stated | |
| OQ-026 | open | 2026-10-27 | TC-OP-016 | - | Whether `400` applies to `POST /auth/login` at all is not stated explicitly (the contract defines `400` as "Malformed request body" in general) | |
| OQ-027 | open | 2026-10-27 | TC-OP-017, TC-OP-018, TC-OP-019 | - | What the login page contains is not stated: the fields, the submit button and their `data-testid` values are not documented | |
| OQ-028 | open | 2026-10-27 | TC-OP-017 | - | The base URL of the application under test is not stated (the test plan names `https://skypermit.vercel.app/` as the site) | |
| OQ-029 | open | 2026-10-27 | TC-OP-018, TC-OP-019 | - | The page the user lands on after a successful login is not stated | |
| OQ-030 | open | 2026-10-27 | TC-OP-018 | - | The content of `operator-session-info` (for example the email or the legal name) is not stated | |
| OQ-031 | open | 2026-10-27 | TC-SYS-001, TC-SYS-002, TC-SYS-004, TC-SYS-005, TC-SYS-006, TC-SYS-007 | TIME_WINDOW `TSD-4 §2.1`; TIME_WINDOW `TSD-4 §2.2` | `window_end` is not given by the documentation; any duration of 15-240 minutes is assumed valid | |
| OQ-032 | open | 2026-10-27 | TC-SYS-001, TC-SYS-002, TC-SYS-003, TC-SYS-004, TC-SYS-005, TC-SYS-006, TC-SYS-007, TC-SYS-008, TC-SYS-009, TC-SYS-010, TC-SYS-011, TC-SYS-012, TC-SYS-013 | TIME_WINDOW `TSD-4 §2.1`; TIME_WINDOW `TSD-4 §2.2`; TIME_WINDOW `TSD-4 §3` | No fixed fixtures for a passing pilot, aircraft, zone and altitude are given beyond the zone catalogue in `06-business-rules.md` §4 | |
| OQ-033 | open | 2026-10-27 | TC-SYS-001, TC-SYS-002, TC-SYS-003, TC-SYS-008, TC-SYS-009, TC-SYS-013 | TIME_WINDOW `TSD-4 §2.1`; TIME_WINDOW `TSD-4 §2.2`; TIME_WINDOW `TSD-4 §3` | Failed `submit`: whether it returns `422` and also moves the request to `REJECTED` is not stated (`03-api-contract.md` says both), so the state after the response is not checked | |
| OQ-034 | dropped | 2026-10-27 | TC-SYS-001 | TIME_WINDOW `TSD-4 §2.1` | Further checks not covered: exactly 6 hours before `window_start` (passing boundary); the same rule through `POST /flight-requests/{id}/validate`  | split into separate cases TC-SYS-004..013 |
| OQ-035 | dropped | 2026-10-27 | TC-SYS-002 | TIME_WINDOW `TSD-4 §2.2` | Further checks not covered: exactly 60 days before `window_start` (passing boundary); the same rule through `POST /flight-requests/{id}/validate`  | split into separate cases TC-SYS-004..013 |
| OQ-036 | dropped | 2026-10-27 | TC-SYS-003 | TIME_WINDOW `TSD-4 §3` | Further checks not covered: 241 minutes (upper boundary); `window_end` equal to or before `window_start`; the passing 15- and 240-minute boundaries; the same rule through `POST /flight-requests/{id}/validate`  | split into separate cases TC-SYS-004..013 |
| OQ-037 | open | 2026-10-27 | TC-SYS-002, TC-SYS-006, TC-SYS-007 | TIME_WINDOW `TSD-4 §2.2` | The moment the 60-day limit is measured from is not stated; submission time is assumed | |
| OQ-038 | open | 2026-10-27 | TC-SYS-003, TC-SYS-008, TC-SYS-009, TC-SYS-010, TC-SYS-011, TC-SYS-012, TC-SYS-013 | TIME_WINDOW `TSD-4 §3` | `window_start` is not given by the documentation; any instant between 6 hours and 60 days after submission is assumed valid | |
| OQ-039 | dropped | 2026-10-27 | test-case-creator skill | - | Confirm the allowed values of the case field Status (`Draft`, `Ready`, `Deprecated`) | not a documentation question (skill structure); marker removed |
| OQ-040 | dropped | 2026-10-27 | test-case-creator skill | - | Confirm the allowed values of the case field Execution Result (`Not Run`, `Passed`, `Failed`, `Blocked`) | not a documentation question (skill structure); marker removed |
| OQ-041 | open | 2026-10-27 | TC-SYS-004, TC-SYS-005, TC-SYS-006, TC-SYS-007, TC-SYS-010, TC-SYS-011, TC-SYS-012 | TIME_WINDOW | The status code and the body of `POST /flight-requests/{id}/validate` for a passing gate and for a failing gate are not stated (`03-api-contract.md` says it runs the gates "exactly as `submit` would" and shows "four gate results", but defines no response shape) | |
| OQ-042 | open | 2026-10-27 | TC-SYS-004, TC-SYS-006 | TIME_WINDOW | How a tester sets `window_start` to exactly 6 hours or exactly 60 days after the server's moment of evaluation is not stated (no clock control or tolerance is documented) | |
| OQ-043 | open | 2026-10-27 | TC-SYS-009, TC-SYS-013 | TIME_WINDOW | The HTTP status and the `rule_reference` returned for a window whose `window_end` is equal to or before `window_start` are not stated (`422` with `TSD-4 §3` or `400`); `06-business-rules.md` §1.4 requires only "strictly after" | |
