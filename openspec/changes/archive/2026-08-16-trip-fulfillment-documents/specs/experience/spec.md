# Delta for experience

## ADDED Requirements

### Requirement: Case-Normalized Experience Type Filtering

`GET /api/admin/experiences` MUST normalize an incoming `type` query filter to the same case in which `Experience.type` values are stored (uppercase) before applying Prisma's exact-match `where.type = { has: filterType }`. Callers MAY send either case; the comparison MUST NOT depend on the caller's casing.

(Fixes: `buildAssignableExperiencesQuery` forwards `TripRequest.type` verbatim, e.g. `"xsed"` lowercase, while `Experience.type` is stored uppercase, e.g. `["XSED"]`; the previous exact-match comparison always returned zero results for this caller.)

#### Scenario: Lowercase filter matches uppercase stored type
- GIVEN an `ACTIVE` experience with `type: ["XSED"]`
- WHEN `GET /api/admin/experiences?type=xsed` is called
- THEN that experience is included in the results

#### Scenario: Existing uppercase callers are unaffected
- GIVEN the admin catalog-browsing caller sends `type=XSED`
- WHEN the request is processed
- THEN the same matching experiences are returned as before this change

#### Scenario: Admin assignment dropdown is no longer empty
- GIVEN an XSED `TripRequest` with `type: "xsed"` and at least one `ACTIVE` experience with `type: ["XSED"]`
- WHEN the admin trip-request page loads assignable experiences
- THEN the dropdown is non-empty

### Requirement: XSED Drop Itinerary, Inclusions, and Exclusions Authoring

`XsedDropDraft`, the `XsedDropShell` step map, and `PUT /api/admin/xsed/[id]`'s field whitelist MUST support `itinerary`, `inclusions`, and `exclusions`. These fields MUST persist through the update endpoint and be readable back unchanged.

(Previously: all three fields were absent from `XsedDropDraft` and omitted from the `PUT` whitelist, so any value sent was silently dropped.)

#### Scenario: Itinerary, inclusions, exclusions round-trip
- GIVEN an admin adds itinerary days, inclusions, and exclusions to an XSED drop
- WHEN the admin saves via `PUT /api/admin/xsed/[id]`
- THEN a subsequent read of that drop returns the same itinerary, inclusions, and exclusions

#### Scenario: Previously-dropped fields are no longer silently discarded
- GIVEN a `PUT /api/admin/xsed/[id]` request includes `itinerary`
- WHEN the request is processed
- THEN `itinerary` is persisted, not silently omitted as before this change
