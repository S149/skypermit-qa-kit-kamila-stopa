# Test Plan #TP007

Project: Skypermit
Site: https://skypermit.vercel.app/

Source: ../skypermit/docs/06-business-rules.md

## Introduction

This plan covers `06-business-rules.md` ("SkyPermit — Business Rules"), a compilation of the decision logic for the four gates (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`), pilot currency, aircraft weight bands, the zone catalogue, the cancellation deadline and the `rule_reference` values. It is not itself a governing document: each rule carries a citation to the document and section that governs it.

## Goals

Verify that the system applies the following rules and returns the stated citations.

### Authority and sources

- G1. Where this compilation and a source document disagree, the source document governs. One exception: the `AIRCRAFT`/`ZONE` gate assignment for the weight-band check was corrected per `docs/07-clarifications.md`, because the rules owner confirmed that the literal "fails the zone gate" wording of `ZC-2026.1` §2 is a corpus error.
- G2. Sources in force: `OH-1` v2.0 (pilot ratings/currency, aircraft weight bands, operator authorisation levels), `ZC-2026.1` as amended by `A-7`, `TSD-4`, and `API-REF` (§4.1, the `422` `rule_reference` contract; §5, gate evaluation order).
- G3. `CR-1` (Airspace Policy Group, 2026-03-02) is explicitly not a source. It is a proposal that would replace the pilot qualification model, extend the weight scale and revise the zone catalogue; nothing in it is in force. `OH-1` v1.4 is superseded, retained for audit only, and is not a source.

### Evaluation order

- G4. Gates run in the fixed order `PILOT` → `AIRCRAFT` → `ZONE` → `TIME_WINDOW`, and evaluation stops at the first failure. `failing_gate` in a `422` response always names the first gate to fail, never every gate that would fail (`API-REF` §5). [OPEN QUESTION: the order in which multiple failing conditions inside one gate (two in `PILOT`, three in `ZONE`, five in `TIME_WINDOW`) are reported is not stated]

### `PILOT` gate

- G5. Two independent conditions; both must hold.
- G6. Rating covers the zone's class (`OH-1` §2.1): `R_BASIC` → `OPEN` only; `R_ADVANCED` → `OPEN`, `CONTROLLED`; `R_BVLOS` → `OPEN`, `CONTROLLED`, `RESTRICTED`. It is evaluated independently of the zone gate, so a request can fail one without the other.
- G7. Certification current (`OH-1` §2.3): current for 18 months from `certified_on`, with no grace period. It is checked against the flight's `window_start`, not submission time, so a rating current at submission but lapsed by the flight window fails this gate. Currency is never stored; it is computed at the moment it is checked. [OPEN QUESTION: how "18 months" is calculated (calendar months) and whether the exact 18-month date is still current are not stated]

### `AIRCRAFT` gate

- G8. The aircraft's derived weight band must be one of the zone's `permitted_bands` (`ZC-2026.1` §2). The gate assignment was corrected from `ZONE` to `AIRCRAFT`; the rule and citation are unchanged. It is implemented in `lib/gates/aircraft-gate.ts`.
- G9. Shared citation: `ZC-2026.1` §2 covers both the weight-band rule and the altitude-vs-ceiling rule, and both cite `"ZC-2026.1 §2"` verbatim with no `.a`/`.b` suffix. This is not a copy-paste error. In a `422` response `failing_gate` (`AIRCRAFT` vs. `ZONE`) disambiguates them; `failing_gate` is read first and `rule_reference` is a citation, not a unique identifier.
- G10. Registration-time precondition, not a gate: an aircraft with `mtom_grams` > 30,000 g is refused registration outright with a `422` at the `/aircraft` write, before any gate runs and before the aircraft record exists (`OH-1` §3; `API-REF` §4). It never reaches a `FlightRequest`.
- G11. `Aircraft.status` (`ACTIVE`/`RETIRED`) is not tied to this or any gate by any source document (`docs/07-clarifications.md` item 2). It is left unwired.

### `ZONE` gate

- G12. Altitude within ceiling: `requested_altitude_metres` must be ≤ the zone's `ceiling_metres` (`ZC-2026.1` §2, explicit: the text says "fails the zone gate").
- G13. Operator authorisation level: the operator's `authorisation_level` must be ≥ the zone's `required_authorisation_level` (`L1` < `L2` < `L3`), independent of pilot rating and aircraft band (`OH-1` §4). Confirmed by the rules owner (`docs/07-clarifications.md` item 4).
- G14. Zone active: an inactive zone fails any flight request against it (`ZC-2026.1` §4). Inferred: the source says "fails validation" and does not name a specific gate. The citation is not yet confirmed. [OPEN QUESTION: confirmation of the `ZC-2026.1 §4` citation]
- G15. The weight-band-vs-zone rule that appeared in earlier drafts has moved to `AIRCRAFT` (see G8).

### `TIME_WINDOW` gate

- G16. Minimum lead time: ≥ 6 hours between submission and `window_start` (`TSD-4` §2.1).
- G17. Maximum advance booking: ≤ 60 days before `window_start` (`TSD-4` §2.2, restated in `OH-1` §5).
- G18. Duration: 15-240 minutes, inclusive at both ends; `window_end` strictly after `window_start` (`TSD-4` §3).
- G19. Curfew: no part of the window may fall inside the zone's curfew, if it has one. It is evaluated minute-by-minute across the whole window, not just the endpoints. Curfews crossing midnight are one continuous period (`TSD-4` §4). [OPEN QUESTION: whether the curfew start and end instants themselves are inside the curfew is not stated]
- G20. No overlap: no other `APPROVED` or `UNDER_REVIEW` request for the same aircraft may share an instant with this window. Windows that only touch at a boundary (one ends 14:00, next starts 14:00) do not overlap. `DRAFT`, `REJECTED`, `CANCELLED` and `COMPLETED` requests are not considered (`TSD-4` §5).
- G21. UTC vs. zone-local time: `window_start`/`window_end` are stored and compared in UTC. Curfews are defined in zone-local time. The conversion happens at evaluation time, not at write time, and there is no stored "curfew in UTC" value. [OPEN QUESTION: daylight-saving or offset handling for the zone-local conversion is not stated]
- G22. Curfew values per zone in force today (`ZC-2026.1` general value, overridden where `A-7` applies):

  | Zone | Curfew | Source |
  |---|---|---|
  | `KBP-CTR-3` | 23:00-05:00 | `A-7` §1 narrows the `ZC-2026.1` general value of 22:00-06:00; `A-7` §4 says the amendment governs where the two disagree |
  | `ODS-CTR-5` | 23:00-05:00 | `A-7` §1, same override |
  | `LVV-RST-2` | 22:00-06:00 | `ZC-2026.1` §3, unamended |
  | `ZTM-RST-7` | 22:00-06:00 | `ZC-2026.1` §3, unamended |
  | `DNI-OPN-1` | none | `ZC-2026.1` §3 |
  | `KHR-OPN-4` | none | `ZC-2026.1` §3 |

- G23. The amendment register must be checked before trusting the base catalogue's curfew column for `KBP-CTR-3` or `ODS-CTR-5`; this is the one place the two documents disagree and the amendment wins.

### Pilot currency threshold (§2)

- G24. A pilot's certification is current for 18 months from `certified_on`, with no grace period: one day past the 18-month mark is not current. It is evaluated against the flight's `window_start`, not the submission time. Currency is derived, never stored. Source: `OH-1` v2.0 §2.3, the currently governing value.
- G25. `OH-1` v1.4 (superseded, audit-only) used 24 months. A historical record or old ticket citing 24 months must not be carried into the current implementation.

### Aircraft weight bands (§3)

- G26. Four bands, upper bound inclusive, the complete taxonomy in force:

  | Band | Lower bound | Upper bound |
  |---|---|---|
  | `C0` | 0 g | 900 g (inclusive) |
  | `C1` | above 900 g | 3,500 g (inclusive) |
  | `C2` | above 3,500 g | 12,000 g (inclusive) |
  | `C3` | above 12,000 g | 30,000 g (inclusive) |

- G27. Exactly 900 g is `C0`; exactly 3,500 g is `C1`; exactly 12,000 g is `C2`. There is no `C4` or `C5` in any governing document (they appear only in the unadopted `CR-1`). `Zone.permitted_bands` references the same `C0`-`C3` taxonomy; nothing outside it is valid.
- G28. Above 30,000 g: not accepted for registration under any circumstance. It is enforced at the `/aircraft` write with a `422`, before the aircraft record and before any gate exists; there is currently no path for such an aircraft to reach a flight request. Source: `OH-1` v2.0 §3, the currently governing table.
- G29. `OH-1` v1.4 (superseded) set the `C1`/`C2` boundary at 4,000 g rather than 3,500 g. When reconciling old data or old test fixtures, that boundary shift is checked first.

### Zone catalogue (§4)

- G30. Six zones, all currently active. Base values from `ZC-2026.1` §3, with `A-7`'s curfew narrowing applied to the two zones it covers:

  | Code | Name | Class | Ceiling | Permitted bands | Curfew | Required auth. level | Active |
  |---|---|---|---|---|---|---|---|
  | `KBP-CTR-3` | Kyiv Boryspil Corridor 3 | `CONTROLLED` | 120 m | C0-C2 | 23:00-05:00 (per `A-7`) | `L2` | yes |
  | `ODS-CTR-5` | Odesa Corridor 5 | `CONTROLLED` | 90 m | C0-C2 | 23:00-05:00 (per `A-7`) | `L2` | yes |
  | `LVV-RST-2` | Lviv Restricted 2 | `RESTRICTED` | 60 m | C0-C1 | 22:00-06:00 | `L3` | yes |
  | `ZTM-RST-7` | Zhytomyr Restricted 7 | `RESTRICTED` | 45 m | C0 | 22:00-06:00 | `L3` | yes |
  | `DNI-OPN-1` | Dnipro Open 1 | `OPEN` | 120 m | C0-C3 | none | `L1` | yes |
  | `KHR-OPN-4` | Kharkiv Open 4 | `OPEN` | 120 m | C0-C3 | none | `L1` | yes |

- G31. `zone_class` also gates pilot rating independently of the table: `OPEN` accepts any rating, `CONTROLLED` requires `R_ADVANCED` or `R_BVLOS`, `RESTRICTED` requires `R_BVLOS` (`ZC-2026.1` §2, `OH-1` §2.1), restated so a seed file does not need to derive it from `zone_class` alone.
- G31a. Source of the zone catalogue: `ZC-2026.1` §3-§4; `A-7` §1, §4.

### Cancellation deadline (§5)

- G32. An `APPROVED` request may be cancelled up to 2 hours before `window_start`. A cancellation attempted closer than that is rejected; the request must proceed or be handled by reviewer action instead (`TSD-4` §6). [OPEN QUESTION: whether a cancellation exactly 2 hours before `window_start` is allowed, the response for a rejected cancellation, and the cancellation rules for states other than `APPROVED` are not stated in this document]

### `rule_reference` values (§6)

- G33. The `rule_reference` returned for each condition:

  | Gate | Condition | `rule_reference` |
  |---|---|---|
  | `PILOT` | Rating doesn't cover zone class | `OH-1 §2.1` |
  | `PILOT` | Certification not current | `OH-1 §2.3` |
  | `AIRCRAFT` | Weight band not permitted | `ZC-2026.1 §2` (shared citation) |
  | `ZONE` | Altitude exceeds ceiling | `ZC-2026.1 §2` (shared citation) |
  | `ZONE` | Operator authorisation level too low | `OH-1 §4` |
  | `ZONE` | Zone inactive | `ZC-2026.1 §4` (citation not yet fully confirmed) |
  | `TIME_WINDOW` | Lead time too short | `TSD-4 §2.1` |
  | `TIME_WINDOW` | Booked too far in advance | `TSD-4 §2.2` |
  | `TIME_WINDOW` | Duration out of range | `TSD-4 §3` |
  | `TIME_WINDOW` | Falls within curfew, `KBP-CTR-3`/`ODS-CTR-5` | `A-7 §1` |
  | `TIME_WINDOW` | Falls within curfew, other zones | `ZC-2026.1 §3` |
  | `TIME_WINDOW` | Overlaps another request | `TSD-4 §5` |
  | not a gate (registration) | Aircraft `mtom_grams` > 30,000 g | `OH-1 §3` |

- G34. The format matches the `API-REF` §4.1 example (`"TSD-4 §3.2"`), which is illustrative, not a real citation.

### Open questions (§7) and currency of the document

- G35. Canonical status of open questions lives in `docs/05-open-questions.md`. Only the `Operator.status = SUSPENDED` response shape and the zone-`active` citation remain open, and neither blocks gate implementation. [OPEN QUESTION: the status code and response body for a suspended operator are undefined]
- G36. The document reflects the corpus as of the dates on its sources: `TSD-4` and `ZC-2026.1` effective 2026-01-01, `A-7` effective 2026-02-10, `OH-1` v2.0 effective 2026-01-15. It does not reflect `CR-1`.

## Risks

- R1. The weight-band check implemented in the wrong gate (G8, G9).
- R2. The shared `ZC-2026.1 §2` citation read as a unique identifier instead of using `failing_gate` (G9).
- R3. Currency computed against submission time instead of `window_start`, or with a grace period, or with the superseded 24 months (G7, G24, G25).
- R4. Superseded or unadopted values (`OH-1` v1.4 24 months and 4,000 g boundary, `CR-1` bands, base curfew for `KBP-CTR-3`/`ODS-CTR-5`) used by mistake (G3, G23, G25, G27, G29).
- R5. Boundary mistakes: 900 / 3,500 / 12,000 / 30,000 g, 15 and 240 minutes, 6 hours, 60 days, touching windows, midnight-crossing curfews (G16-G20, G26-G28).
- R6. Time zone conversion errors between UTC windows and zone-local curfews (G21).
- R7. Stopping at the first failing gate not honoured, so `failing_gate` names a later gate (G4).
- R8. Aircraft above 30,000 g reaching a flight request, or being refused with a gate failure instead of a registration `422` (G10, G28).
- R9. `Aircraft.status` or `Pilot.status` wired to a gate (G11).
- R10. Zone `active` citation not authoritative (G14).
- R11. Suspended operator handling undefined (G35).

## In Scope / Out Of Scope

### In Scope

- Gate evaluation order and first-failure behaviour (G4)
- `PILOT`, `AIRCRAFT`, `ZONE` and `TIME_WINDOW` gate logic (G5-G23)
- Pilot currency, weight bands, zone catalogue seed values, curfew values (G22-G31)
- Registration-time refusal above 30,000 g at the `/aircraft` write (G10, G28)
- Cancellation deadline for `APPROVED` requests (G32)
- `rule_reference` values (G33, G34)

### Out Of Scope

- Persisted fields, states, endpoints and response contracts: `06-business-rules.md` ("Companion to") says they are defined in *SkyPermit — System Reference*, which this document does not restate. That document is not part of the input.
- The `CR-1` proposal: `06-business-rules.md` (header) says it is explicitly not a source and nothing in it is in force.
- `OH-1` v1.4: `06-business-rules.md` (header) says it is superseded and retained for audit only (its superseded values are covered only as things not to carry forward, G25, G29).
- Reasoning behind resolutions and canonical open-question status: `06-business-rules.md` (§7) hands this to `docs/05-open-questions.md` and `docs/07-clarifications.md`. Those documents are not part of the input.

## Entry Criteria / Environments

### Entry Criteria

1. Requirements, test goals are clear for testers
2. All test environments and test tools are ready and can be used
3. Test data / test documentation are available and can be used
4. Test cases are ready and can be used

### Environments

- OS: Microsoft Windows 11 Pro (version 10.0.26200)
- Browser: Chrome (latest version)

## Exit Criteria / Tools

### Exit Criteria

1. Test time was finished
2. More than 85% of all test cases were passed
3. Test Report is ready and can be provided to stakeholders

### Tools

- SVC: GitHub
- Test design: Claude Code
- API: `422` response contract with `failing_gate`, `rule_reference` and `message`; the `/aircraft` write endpoint, as named in the documentation

## Schedule and Estimations / People

### Schedule and Estimations

- Start date: [OPEN QUESTION: not provided]
- End date: [OPEN QUESTION: not provided]
- Analyses and investigation of testing scope: [OPEN QUESTION: estimation not provided]
- Create Test Documentation (Test Plan and Test Cases): [OPEN QUESTION: estimation not provided]
- Testing: [OPEN QUESTION: estimation not provided]
- Create Test Report: [OPEN QUESTION: estimation not provided]

### People

Kamila Stopa, Senior Test Engineer
