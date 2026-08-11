# Delta for trip-request-lifecycle

## ADDED Requirements

### Requirement: Server-Side Fulfillment-Visibility Gate on Fulfillment Content

`GET /api/trips/[id]` MUST NOT include itinerary, inclusions, exclusions, or `TripDocument` data in its response for a non-admin caller unless the trip's `status ∈ {REVEALED, COMPLETED, CANCELLED}` — regardless of whether the trip passed through `REVEALED` before reaching its current status. This gate MUST be enforced in the API handler itself, not only in client UI, because the traveler details page is a client component (`ssr: false`) consuming this endpoint and a UI-only gate would be bypassable by inspecting the raw response.

(Previously: this endpoint returned the assigned experience's `itinerary`/`inclusions`/`exclusions` unconditionally for any status reachable via `canAccessTrip`, with no status-based gate at all; `TripDocument` did not exist. Gate then narrowed to `{REVEALED, COMPLETED}` in an earlier revision of this spec, then widened to include `CANCELLED` on 2026-08-10 by founder decision: an already-issued voucher may be needed for a refund/cancellation dispute, and a cancelled trip has no future "surprise" left to protect regardless of reveal history.)

#### Scenario: REVEALED trip includes fulfillment content
- GIVEN a trip with `status: "REVEALED"`
- WHEN the buyer calls `GET /api/trips/[id]`
- THEN the response includes itinerary, inclusions, exclusions, and the trip's documents

#### Scenario: Pre-reveal trip omits fulfillment content
- GIVEN a trip with `status: "CONFIRMED"` (not yet revealed, not cancelled)
- WHEN the buyer calls `GET /api/trips/[id]`
- THEN the response omits itinerary, inclusions, exclusions, and documents — verified against the raw API response, not the rendered page

#### Scenario: COMPLETED trip still includes fulfillment content
- GIVEN a trip with `status: "COMPLETED"`
- WHEN the buyer calls `GET /api/trips/[id]`
- THEN the response includes fulfillment content, matching the same predicate as `REVEALED`

#### Scenario: Revealed-then-cancelled trip still includes fulfillment content
- GIVEN a trip that was `REVEALED` and is now `status: "CANCELLED"`
- WHEN the buyer calls `GET /api/trips/[id]`
- THEN the response still includes itinerary, inclusions, exclusions, and the trip's documents

#### Scenario: Cancelled-without-ever-revealed trip still includes fulfillment content
- GIVEN a trip that moved directly from `CONFIRMED` to `status: "CANCELLED"` without ever passing through `REVEALED`
- WHEN the buyer calls `GET /api/trips/[id]`
- THEN the response includes fulfillment content, because the gate is satisfied by the current `CANCELLED` status alone, independent of reveal history

#### Scenario: Companion sees the same gated result as the buyer
- GIVEN a companion traveler linked to a `REVEALED` trip
- WHEN they call `GET /api/trips/[id]` for that trip
- THEN they receive the same itinerary/documents content as the buyer

*(Needs vitest coverage — RED/GREEN per strict TDD: the status predicate gating the response shape, for pre-reveal, post-REVEALED, COMPLETED, and both CANCELLED cases (with and without prior REVEALED), and the companion-parity case.)*
