# Tasks: Traveler Trip Details Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1900-2300 (CSS module ~500 lines + 7 components + page rewrite + dictionary + tests) |
| 400-line budget risk | High |
| Chained PRs recommended | No — decided in proposal |
| Suggested split | Single PR, `size:exception` |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

`size:exception` was recorded in `proposal.md` in advance (coordinated visual port not independently shippable). This is not re-derived here; no chaining decision is pending.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Entire change, bottom-up phases below | PR 1 (only) | `size:exception`, single-pr per proposal |

## Phase 1: Foundation — Types, Countdown, CSS Module

- [x] 1.1 Create `src/types/tripDetails.ts`: `TripDetailsData`, reuse `ItineraryDayEntry` from `@/types/tripper` (ADR-6)
- [x] 1.2 RED: `src/lib/helpers/__tests__/getRevealCountdown.test.ts` — `getDepartureCountdown` future/past/boundary + regression assert `getRevealCountdown` axis unchanged (ADR-5)
- [x] 1.3 GREEN: extract `countdownTo` in `getRevealCountdown.ts`, add `getDepartureCountdown`; public shape unchanged
- [x] 1.4 Create `.../traveler/traveler-trip-details.module.css`: `.root`-scoped, class-selectors only + 2 inheritance-safe rules, day-level rail (ADR-3), `var(--font-barlow*)` not literal (ADR-1, ADR-8)

## Phase 2: Pure Helpers (TDD)

- [x] 2.1 RED `tripDetailsHelpers.test.ts`: `resolveTripDestination` 4-step fallback (incl. city-only, both-null); `buildDayDateLabels` index offset/es/en/null-startDate
- [x] 2.2 GREEN: create `tripDetailsHelpers.ts`
- [x] 2.3 RED `tripSupportHelpers.test.ts`: `buildTripSupportMessage` (message first, null lines omitted, tripId always present); `canSendTripSupport` empty/whitespace/sending
- [x] 2.4 GREEN: create `tripSupportHelpers.ts` (ADR-4)

## Phase 3: Subcomponents (dictionary keys added in-task, both locales)

- [x] 3.1 Add `TripItineraryDict.hero`/`nav` groups to `dictionary.ts` + `es.json`/`en.json` (destination-agnostic)
- [x] 3.2 Create `TripDetailsHero.tsx` — eyebrow variant, title/subtitle, meta row, countdown pill, `.heroMuted` (ADR-5, ADR-7; `.heroMuted` was later removed entirely in 7.4 — see there)
- [x] 3.3 Create `TripDetailsBackRow.tsx` — `next/link` back + `#itinerary`/`#documents` anchors
- [x] 3.4 Add `essentials` group to dictionaries; create `TripEssentialsStrip.tsx` — 2 columns, nights/pax only
- [x] 3.5 RTL: `TripEssentialsStrip` — exactly 2 items, no district/airport/room-type text
- [x] 3.6 Add `itinerary` group to dictionaries; create `TripItineraryTimeline.tsx` — one day-card per entry, day-level dot/rail (ADR-3)
- [x] 3.7 RTL: `TripItineraryTimeline` — card count matches days, padded number, no `<p>` for description-less day, no per-stop row
- [x] 3.8 Add `documents`/`support` groups to dictionaries; restyle `TripDocumentsSection.tsx` — `.docGrid`/`.docCard`, `<Button asChild>`→`<a className={styles.btn}>` (ADR-2), mimeType-based icon; props/DTO unchanged
- [x] 3.9 Update `TripDocumentsSection` RTL test — `href`/`downloadHref` rendered, no `/api/upload`, `CANCELLED`→`documentsCancelledNote`, empty state
- [x] 3.10 Create `TripDetailsHelpStrip.tsx` — dark `.help` strip, CTA opens modal via `onOpen`

## Phase 4: Support Modal

- [x] 4.1 Create `TripSupportModal.tsx` (ADR-4) — Radix `Modal`, `message`-only `TextAreaInput` (maxLength 4000), name/email from `useSession()`, fixed `interest: "Trip support"`, 4 states mirroring `ContactTravelerModal.tsx`
- [x] 4.2 RTL + fetch-mock: success on `ok`, error on `!ok`/network throw (message preserved), send disabled empty/sending, POST body carries session identity + fixed interest

## Phase 5: Page Orchestrator Wiring

- [x] 5.1 Add `footer` group to dictionaries, both locales
- [x] 5.2 Rewrite `details/page.tsx`: delete local `ItineraryDayEntry`/`TripWithExperience`, use `TripDetailsData`, drop `HeaderHero`/`Section` for this route, status-variant branching (ADR-7), mount `.root` subtree
- [x] 5.3 Wire `TripDetailsHelpStrip` → `TripSupportModal` state in `page.tsx`, pass trip context + session user
- [x] 5.4 RTL: `page.tsx` — `documents === undefined` renders pre-reveal card, no hero eyebrow (ADR-7)

## Phase 6: i18n Guard + Verification

- [x] 6.1 i18n drift-guard test: every new `tripItinerary` key non-empty in both locales (follows `common.countries` precedent)
- [x] 6.2 Run `npm run typecheck`, `npm run lint`, `npm run test`; fix failures — typecheck and test pass clean (165 files / 1209 tests); `npm run lint` / `next lint` and raw `eslint` are both broken in this environment pre-existing (Next 16.2.6 + ESLint 8.57.0 flat-config incompatibility, reproduced on untouched files too) — not a regression from this change, flagged for a separate fix
- [x] 6.3 Manual QA: screenshot-driven, iterative with the product owner (not the full ≥1280/≥360/`prefers-reduced-motion`/keyboard-focus checklist in one pass) — found and fixed 6 real defects, see Phase 7

## Phase 7: Post-Apply Revisions (2026-08-12, product-owner-directed, post initial apply)

Manual QA surfaced defects and scope corrections the initial apply batch didn't catch. Each is a real, verified fix — not a stylistic preference. `design.md`/`spec.md`/`proposal.md` are updated to match; ADR-3 and Resolved Decision #2 are **superseded**, not just amended.

- [x] 7.1 Fix: `TripItineraryTimeline`'s and `TripDocumentsSection`'s section headings independently composed `.heading .headingSection`; one included `.cond` (Barlow Condensed), the other silently didn't. Extracted shared `SectionHead.tsx` (single composition point) and adopted it in both — closes the defect class, not just the one instance
- [x] 7.2 Fix: extracted local `EssentialItem` sub-component inside `TripEssentialsStrip.tsx` (Length/Party blocks were duplicated inline)
- [x] 7.3 Fix: `.root a { color: inherit }` (class+type selector, specificity 0,1,1) silently beat `.btnFill { color: #fff }` (single class, 0,1,0) on every `.btn`-styled anchor — the filled "View" document button rendered ink-on-ink (invisible). Changed to `.root a:not(.btn)` so button-styled anchors are excluded from the base reset entirely
- [x] 7.4 Hero revision: height changed to `min-height: 40vh` matching `HeaderHero.tsx`'s own convention (not the prototype's `78vh`, and not the marketing home hero's `100vh` — tried and corrected); content vertically centered (`align-items: center`, was `flex-end`); illustrated star field / mountain silhouettes / floating balloon **dropped entirely** in favor of the assigned experience's real `heroImage` full-bleed, under a flat dark scrim (`VideoBackground`'s pattern). `.heroMuted` CSS class removed entirely (no balloon left to hide, no separate fallback-gradient variant); `REVEALED`/`COMPLETED`/`CANCELLED` is now a content-only distinction (eyebrow copy, dot, pill) — the hero's visual chrome is identical across all three (sdd-verify caught this doc/code drift; fixed 2026-08-12)
- [x] 7.5 Itinerary revision: **ADR-3 superseded**. Verified the prototype's own `.day__marker` never had a dot/rail of its own — that decoration only ever existed at stop granularity (`.stop__dot`/`.stop__line`), which Resolved Decision #1 already excludes. The day-level dot/rail invented in ADR-3 didn't visually connect anything (cards are separate boxes with a real gap; the rail only extended 0.2rem past the marker) and read as a stray floating circle. Removed `.dayDot`/`.dayRail` and their JSX entirely — day cards now render number/weekday/date + title/description only, matching the prototype's actual day-marker with no invented connector
- [x] 7.6 Inclusions/exclusions restyle: moved from proposal "Out of Scope" (kept unchanged) to in-scope. New `.inclCard`/`.inclCardTitle`/`.inclList`/`.inclItem` classes matching `.day`/`.docCard`'s chrome (`1rem` radius, existing border/shadow tokens); reused `.docGrid` for the 2-column layout; raw unicode `✓`/`✗` replaced with `lucide-react` `Check`/`X`, matching every other icon on the page
- [x] 7.7 Essentials strip widened to 4 columns: **Resolved Decision #2 superseded** for Origin/Travel type specifically (district/airport/room-type stay dropped — still no schema backing). `GET /api/trips/[id]` uses `include` (not `select`) at the top level, so every `TripRequest` scalar — including `type`, `originCity`, `originCountry` — was already on the wire; the client interface simply hadn't declared them, same class of gap the original design already found and fixed once. Added `resolveTripOrigin()` (RED→GREEN, `tripDetailsHelpers.ts`) joining `originCity`/`originCountry`; added `travelTypeValues` label map (`solo`/`couple`/`family`/`group`/`honeymoon`/`paws`) to `TripItineraryDict.essentials` with a raw-value fallback for anything unmapped; `.essentials` grid restored to `repeat(4, 1fr)` with the prototype's original 860px→2-col / 520px→1-col breakpoints (including the `nth-child(3)` border-left reset at 860px)
- [x] 7.8 Travel type value rendered with `text-transform: capitalize` (new `.essentialsValueCapitalize` class, applied via an `EssentialItem` `capitalize` prop) so both mapped labels and the unmapped-value fallback always display capitalized
- [x] 7.9 `npm run typecheck` and `npm test` re-run clean after every fix above (final: 1212/1212 tests, 165 files)
- [x] 7.10 `sdd-verify` re-run against the updated artifacts caught 3 real issues, all fixed same session: (1) CRITICAL — `spec.md`'s Hero requirement said CANCELLED trips MUST NOT show the hero; actual (and correctly tested) behavior is a muted content variant — same photo/layout, no eyebrow dot, no pill. Fixed the spec text/scenario to match reality rather than changing already-correct, already-tested code. (2) WARNING — `design.md`'s Testing Strategy claimed a test asserted no day-level dot/rail renders; no such assertion existed. Added one (`TripItineraryTimeline.test.tsx`, asserts zero `[class*="dayDot"]`/`[class*="dayRail"]` elements). (3) WARNING — `design.md`/`tasks.md` still described a `.heroMuted` CSS class; it was fully removed during 7.4 and never existed as a class after that point — corrected the docs to describe the actual content-only status branching
