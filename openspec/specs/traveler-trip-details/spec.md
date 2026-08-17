# traveler-trip-details Specification

## Purpose

New capability (no prior spec exists). The post-reveal traveler-facing surface at `/dashboard/trips/[id]/details`: reveal hero (real experience photo), a 4-column essentials strip, day-by-day itinerary timeline, an on-brand inclusions/exclusions section, document card grid, and a support-contact CTA. Pure presentation port of an approved prototype onto data `GET /api/trips/[id]` already returns — no schema or API change, including the essentials strip's Origin/Travel type columns added after initial review. `trip-fulfillment-documents` keeps every requirement unchanged (document visibility, gating, authenticated read route); none of its requirements govern markup, so no delta spec is written against it.

## Requirements

### Requirement: Hero Renders Only Where Reveal Framing Is Valid, Muted for Non-Celebratory Statuses
The system MUST render the hero only when `trip.status` is `REVEALED`, `COMPLETED`, or `CANCELLED` — for `DRAFT`, `SAVED`, `PENDING_PAYMENT`, or `CONFIRMED` the hero MUST NOT render at all (see "Pre-Reveal Statuses Skip All Reveal-Gated Sections", below). For `CANCELLED`, the hero DOES render (same destination photo, title, subtitle, and date-range meta as `REVEALED`/`COMPLETED`) but MUST suppress the celebratory eyebrow dot and MUST NOT show a departure-countdown pill — this is a muted content variant, not an absent hero. All hero data (destination, date range, traveler count) MUST come only from the existing API payload — no fabricated or placeholder values.

#### Scenario: Revealed trip shows real hero data
- GIVEN a trip with `status: REVEALED`
- WHEN the page renders
- THEN the hero shows the real destination, date range, and traveler count from the API payload, with the celebratory eyebrow dot and (while `startDate` is in the future) a departure-countdown pill

#### Scenario: Cancelled trip shows a muted hero, never the celebratory pill
- GIVEN a trip with `status: CANCELLED` (whether or not it was ever `REVEALED`)
- WHEN the page renders
- THEN the hero still renders with the real destination and date range, but with no eyebrow dot and no departure-countdown pill

### Requirement: Hero Background Uses the Assigned Experience's Real Photo
When `trip.experience.heroImage` is present, the hero MUST render it as the background image, full-bleed, under a scrim for text legibility. It MUST NOT render illustrated placeholder graphics (star field, mountain silhouettes, or similar) instead of or in addition to a real photo. When no experience/photo is assigned, the hero MUST still render without error (a plain gradient fallback, no illustrated graphics).

#### Scenario: Assigned experience's photo renders as the hero background
- GIVEN a trip with an assigned experience whose `heroImage` is a valid URL
- WHEN the hero renders
- THEN that image renders full-bleed behind the hero content, with no illustrated star/mountain/balloon graphics present

#### Scenario: No experience assigned yet
- GIVEN a trip with no assigned experience
- WHEN the hero renders
- THEN it renders without error using a plain gradient background, still with no illustrated placeholder graphics

### Requirement: Departure Countdown Reflects Real Time Only
The "Departs in N days" pill MUST show a real, non-negative day count computed from `trip.startDate`. It MUST NOT render once `trip.startDate` has passed.

#### Scenario: Upcoming departure shows a positive count
- GIVEN a `REVEALED` trip with `startDate` 5 days in the future
- WHEN the hero renders
- THEN the pill reads "Departs in 5 days"

#### Scenario: Past departure hides the pill
- GIVEN a `COMPLETED` trip whose `startDate` has already passed
- WHEN the hero renders
- THEN the countdown pill MUST NOT render

### Requirement: Pre-Reveal Statuses Skip All Reveal-Gated Sections
For `DRAFT`, `SAVED`, `PENDING_PAYMENT`, or `CONFIRMED` — the same set the server already omits itinerary/documents for via `isFulfillmentVisible` — the hero, essentials strip, and itinerary timeline MUST NOT render. The existing pre-reveal notice (`preRevealTitle`/`preRevealDescription`) MUST render in their place, unchanged from current behavior. The documents section keeps its own existing visibility contract (unchanged, per `trip-fulfillment-documents`): it renders for `REVEALED`/`COMPLETED`/`CANCELLED` only.

#### Scenario: Confirmed-but-not-revealed trip shows the pre-reveal notice
- GIVEN a trip with `status: CONFIRMED`
- WHEN the page renders
- THEN no hero, essentials strip, or itinerary timeline render, and the pre-reveal notice renders instead

#### Scenario: Cancelled trip still shows its documents
- GIVEN a `CANCELLED` trip with existing `TripDocument` rows
- WHEN the page renders
- THEN the document grid still renders those documents, unaffected by the hero rendering its muted (non-celebratory) variant

### Requirement: Essentials Strip Shows Only Backed Fields
The essentials strip MUST render exactly four columns — Length (`trip.nights`), Party (`trip.pax`), Origin (`trip.originCity`/`trip.originCountry`), and Travel type (`trip.type`) — all real values from the API payload. It MUST NOT render district, airport, or room-type columns; none of those fields exist on `TripRequest`. Travel type MUST render a localized label for a known value and MUST fall back to the raw value for anything unmapped, never an empty string.

#### Scenario: Strip shows exactly four real-data columns
- GIVEN a `REVEALED` trip with `nights: 5`, `pax: 2`, `originCity: "Santiago"`, `originCountry: "Chile"`, and `type: "honeymoon"`
- WHEN the essentials strip renders
- THEN it shows exactly four columns with those values (the origin joined as "Santiago, Chile", the travel type as its localized label) and no district/airport/room-type text anywhere

#### Scenario: Unmapped travel type falls back to the raw value
- GIVEN a trip with `type` set to a value not present in the travel-type label map
- WHEN the essentials strip renders
- THEN the Travel type column shows that raw value rather than an empty or missing label

### Requirement: Itinerary Timeline Renders One Card Per Real Day
The timeline MUST render exactly one card per `ExperienceItineraryDay` entry (`{ day, title, description }`), with weekday/date derived from `trip.startDate` plus the entry's index. The system MUST NOT invent a per-stop/per-time sub-model.

#### Scenario: Timeline matches itinerary length
- GIVEN an experience with 4 `ExperienceItineraryDay` entries
- WHEN the timeline renders
- THEN exactly 4 day cards render, each showing its real title/description and a derived weekday/date

### Requirement: Document Cards Show Only Real DTO Fields
Each document card MUST render only fields present on `TripDocumentDTO`: label, a country tag, a MIME-type-derived tag, and upload date. The system MUST NOT fabricate confirmation numbers, room-type names, or date ranges not present on the DTO.

#### Scenario: Card renders only backed fields
- GIVEN a `TripDocumentDTO` with `label`, `country`, `mimeType`, `createdAt`
- WHEN its card renders
- THEN it shows exactly those derived fields and no invented confirmation number or date range

### Requirement: Support CTA Reuses the Existing Contact Endpoint
The help CTA MUST submit through the existing `POST /api/contact`, prefilling trip context (trip id and/or destination) into the message and/or `interest` field. It MUST show a distinct success state and a distinct failure state, and MUST NOT introduce a new backend endpoint.

#### Scenario: Successful submission
- GIVEN a traveler submits the help CTA with a message
- WHEN `POST /api/contact` returns `200`
- THEN the UI shows a success state

#### Scenario: Failed submission
- GIVEN a traveler submits the help CTA
- WHEN `POST /api/contact` returns a non-2xx response
- THEN the UI shows a distinct failure state and does not silently discard the error

### Requirement: No Destination-Specific Wording in Dictionary Values
Every dictionary string added for this capability MUST be destination/region/drop-agnostic. Only interpolated real trip data (e.g. `{{destination}}`, `{{n}}`) MAY vary per trip; no dictionary value MAY hardcode a specific destination, city, or region name.

#### Scenario: Dictionary value is generic
- GIVEN any new `es.json`/`en.json` key added for this capability
- WHEN its value is inspected
- THEN it contains no hardcoded destination/region name — only generic copy and/or template placeholders

### Requirement: Full es/en Dictionary Parity
Every user-visible string introduced by this capability MUST exist as a matching key in both `src/dictionaries/es.json` and `en.json`, typed under `TripItineraryDict` in `src/lib/types/dictionary.ts`. Tripper-authored day titles/descriptions are trip content, not dictionary strings, and MUST NOT be added to the dictionary.

#### Scenario: New key exists in both locales
- GIVEN a new key added to support this capability
- WHEN `es.json` and `en.json` are compared
- THEN the key exists with a value in both files

### Requirement: Scoped Styling With No Cross-Route Leakage
All new CSS MUST be scoped under a single `.root` class in `traveler-trip-details.module.css`. Base-element rules under `.root` MUST NOT alter the visual appearance of shared components (e.g. `Button`) when those components render outside this route's subtree.

#### Scenario: Shared Button unaffected elsewhere
- GIVEN the `Button` component is used both inside this route and on another dashboard page
- WHEN both pages render
- THEN the Button's appearance on the other page is unchanged by this route's CSS module

### Requirement: Base-Element Rules MUST NOT Override Button-Variant Styling Within `.root`
A base-element rule scoped under `.root` (e.g. a default link color) MUST NOT take visual precedence over a `.btn`-family variant class's own styling for the same property, regardless of CSS specificity or source order. Every `.btn`-styled element's color, background, and other variant-defined properties MUST render as that variant defines them.

#### Scenario: Filled document-action button renders with its own variant color
- GIVEN a document card's "View" action uses `.btn .btnFill` (filled, white text/icon on a dark background)
- WHEN the page renders
- THEN the button's text and icon render in the color `.btnFill` defines, not the base link-color reset's inherited color

### Requirement: Inclusions/Exclusions Match the Page's Visual Language
The inclusions/exclusions section, when rendered, MUST use this route's own card chrome, icon set, and color tokens — not generic, unstyled defaults inconsistent with the rest of the page. Included/excluded markers MUST be rendered as icons (not raw unicode glyphs).

#### Scenario: Inclusions/exclusions cards match sibling sections
- GIVEN a trip whose assigned experience has both inclusions and exclusions
- WHEN the page renders
- THEN both cards use the same card border/radius/shadow treatment as the itinerary and document cards, and each list item shows an icon (not a raw `✓`/`✗` character)
