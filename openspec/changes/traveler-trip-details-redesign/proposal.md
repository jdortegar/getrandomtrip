# Proposal: Traveler Trip Details Redesign

**Source of truth:** `openspec/changes/traveler-trip-details-redesign/prototype-reference.html` — the literal visual/markup contract, saved in-repo (base64 font blocks stripped; structure, CSS and copy intact). Exploration is at Engram `sdd/traveler-trip-details-redesign/explore`.

**All six product forks were resolved directly by the product owner (2026-08-12) and are FINAL.** `sdd-spec`, `sdd-design`, and `sdd-tasks` must treat the Resolved Decisions below as settled input and must not reopen them.

**Post-apply amendment (2026-08-12, same day, after manual QA):** four scope items below were revised directly by the product owner after reviewing the live implementation against real screenshots — see `design.md` ADR-9/ADR-10/ADR-11 for the full rationale. Resolved Decision #2 is **partially superseded** (Origin/Travel type turned out to have real schema backing; district/airport/room-type remain dropped). Two unrelated bugs found in the same review are also fixed (`design.md` "Post-apply corrections"). This is not scope creep from a fresh idea — it is the same change, corrected against its own real output.

## Intent

The `trip-fulfillment-documents` change ported an approved prototype **pair**: an admin fulfillment page and a traveler trip-details page. Only the admin half shipped (`src/components/app/admin/trip-fulfillment/`). The traveler half — the surface the *paying customer* actually sees after their destination is revealed — was never touched and still renders the generic dashboard chrome: a stock `HeaderHero` video banner, a numbered-circle itinerary list, and flat document rows. The reveal is the emotional payoff of the entire product and it currently looks like an admin table. Port the approved traveler prototype using the exact technical playbook already proven on the admin side.

## Scope

### In Scope

| # | Deliverable |
|---|---|
| 1 | **Reveal hero** replacing `HeaderHero` on this page only: eyebrow, destination title, subtitle, meta row (date range · traveler count · "Departs in N days" pill). ~~Star field, floating balloon SVG, layered mountain silhouettes~~ **superseded (ADR-11): background is the assigned experience's real `heroImage`, full-bleed, under a flat scrim; height/vertical-alignment match `HeaderHero.tsx`'s own `min-h-[40vh]` + centered-content convention, not the prototype's `78vh`/bottom-aligned original.** Data from the existing `GET /api/trips/[id]` payload — no API change. |
| 2 | **Back-to-trip row + in-page jump nav** (`#itinerary`, `#documents`). Back link is a `next/link`; the two hash anchors stay plain same-page anchors. |
| 3 | **Essentials strip**: ~~reduced to the two backed columns~~ **superseded (ADR-9): 4 columns — Length (`trip.nights`), Party (`trip.pax`), Origin (`trip.originCity`/`originCountry`), Travel type (`trip.type`)**, all real values already on the wire. District / Airport / room-type columns remain **dropped** — those three specifically still have no schema backing (Resolved Decision #2, partially superseded). |
| 4 | **Day-by-day itinerary timeline** in the prototype's day-card visual language, rendered from the real `ExperienceItineraryDay` shape (`{ day, title, description }`). Weekday/date per day derived from `trip.startDate` + index. **No per-stop model is invented** (Resolved Decision #1) **and no day-level connector is invented either (ADR-3, superseded) — the prototype's own day-marker never had one; only the per-stop rail did, which this item already excludes.** |
| 5 | **Documents section restyle**: info banner + 2-column `.doc-card` grid (icon, title, tags, metadata line, View + Download). Populated strictly from `TripDocumentDTO` — label, country tag, mimeType-derived tag, upload date (Resolved Decision #3). `TripDocumentsSection`'s props/data contract is unchanged; only markup changes. |
| 6 | **Dark help CTA strip**, repurposed from the prototype's "Message your Tripper" into a **traveler → GetRandomTrip support** action wired to the existing `POST /api/contact` with trip context prefilled (Resolved Decision #4). No new backend. |
| 7 | **New `traveler-trip-details.module.css`** ported verbatim from the prototype, scoped under a `.root` class exactly like `fulfillment.module.css`, reusing the global `--font-barlow` / `--font-barlow-condensed` vars already registered via `next/font` in `globals.css`. Icons converted from inline `<svg><use>` sprite symbols to `lucide-react`. |
| 8 | **Page split into focused subcomponents** under `src/components/app/dashboard/traveler/`, leaving `page.tsx` a thin data-fetching orchestrator per `.claude/rules/component-patterns.md`. |
| 9 | **Full es/en dictionary coverage** for every new string in `TripItineraryDict`, including the interpolated "Departs in {{n}} days", "{{n}} Nights", "{{n}} travelers" and page-footer templates, plus `originLabel`/`travelTypeLabel`/`travelTypeValues` (item 3's post-apply addition). Reuse existing keys where they already fit (`backToTrip`, `documentsNote`, `documentsCancelledNote`, `view`, `download`, `day`, empty/pre-reveal states). |
| 10 | **Inclusions/exclusions restyle** (ADR-10, post-apply — moved here from Out of Scope): card chrome, icons (`lucide-react` `Check`/`X`, not raw unicode), and colors brought in line with the rest of the page instead of the leftover generic Tailwind markup. |

### Out of Scope

- **Traveler → tripper messaging** of any kind. No such model, API, or UI exists; the prototype's "Message your Tripper" is repurposed to admin/support contact, not built as tripper messaging.
- **Any schema change.** No new fields for district, airport code/name, resolved room-type name, confirmation number, or document date-ranges. Those prototype values were sample flourishes. (Origin/Travel type did NOT require a schema change — they were already real columns, see item 3.)
- Any change to `GET /api/trips/[id]`, the fulfillment-visibility gate (`isFulfillmentVisible`), or the authenticated document read route — all shipped and correct; this change is their consumer.
- Extracting a shared CSS base between `fulfillment.module.css` and the new traveler module. Duplication is accepted for now (see Risks).
- Restyling any other dashboard page. This bespoke visual language is confined to this route's `.root` subtree.
- Per-day itinerary images. (Inclusions/exclusions restyle is now in scope — item 10 — superseding the original "keep unchanged unless design proves otherwise" note; it did.)

## Capabilities

### New Capabilities
- `traveler-trip-details`: the post-reveal traveler-facing trip-details surface — reveal hero, essentials strip, day-by-day itinerary timeline, document card grid, and support-contact CTA, all localized es/en.

### Modified Capabilities
- **None.** No existing spec's *requirements* change. `trip-fulfillment-documents` (still un-promoted, living under `openspec/changes/trip-fulfillment-documents/specs/`) keeps every requirement it has — document visibility, gating, and the authenticated read route are untouched; only their presentation changes.

## Approach

Reuse the shipped admin playbook verbatim, in this order:

1. Port the prototype CSS into `traveler-trip-details.module.css`, scoped under `.root`, dropping the base64 `@font-face` blocks in favour of the existing global font vars (Resolved Decision #6).
2. Widen the page's local `TripWithExperience` interface — today it only picks `id`/`status`/`experience`/`documents`, while the API already returns every `TripRequest` scalar (`startDate`, `endDate`, `nights`, `pax`, `actualDestination`, `destinationRevealedAt`) plus `experience.destinationCity`/`destinationCountry`. **The data is already on the wire; the client just discards it.**
3. Extract subcomponents (Hero, BackRow, Essentials, ItineraryTimeline, HelpStrip) and restyle `TripDocumentsSection` in place.
4. Add all dictionary keys in both locales in the same commits as the components that consume them.
5. Wire the help CTA to `POST /api/contact`. Exact UI shape (modal vs. inline form vs. prefilled deep link) is a `sdd-design` call; the backend-reuse decision is not.

**Deliberate divergence, stated up front so later phases do not "correct" it:** this page uses a CSS Module, not the Tailwind dashboard conventions in `.claude/rules/design-system.md`. That rule governs admin dashboard table/KPI surfaces. This is a bespoke traveler reveal surface, and its sibling — the admin fulfillment page — already shipped through review with exactly this approach. Do not re-express the hero, day-card timeline, inclusions/exclusions cards, or doc-card grid as Tailwind utilities.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/[locale]/(secure)/dashboard/trips/[id]/details/page.tsx` | Modified | Becomes a thin orchestrator; widened trip interface; `HeaderHero` removed for this route |
| `src/components/app/dashboard/traveler/traveler-trip-details.module.css` | New | Prototype CSS ported, `.root`-scoped; hero/itinerary/essentials/inclusions revised post-apply (ADR-9/10/11) |
| `src/components/app/dashboard/traveler/SectionHead.tsx` | New (post-apply) | Shared eyebrow/heading/lede block, extracted after a font-family drift bug |
| `src/components/app/dashboard/traveler/TripDetailsHero.tsx` | New | Hero + meta pills; background is the assigned experience's real photo (ADR-11) |
| `src/components/app/dashboard/traveler/TripDetailsBackRow.tsx` | New | Back link + jump nav |
| `src/components/app/dashboard/traveler/TripEssentialsStrip.tsx` | New | Four-column strip: Length, Party, Origin, Travel type (ADR-9) |
| `src/components/app/dashboard/traveler/TripItineraryTimeline.tsx` | New | Day cards from `ExperienceItineraryDay`, no dot/rail at any level |
| `src/components/app/dashboard/traveler/TripDetailsHelpStrip.tsx` | New | Dark CTA strip → `POST /api/contact` |
| `src/components/app/dashboard/traveler/TripDocumentsSection.tsx` | Modified | Flat rows → `.doc-card` grid; props/DTO contract unchanged |
| `src/types/tripDetails.ts` | Modified (post-apply) | Widened with `type`, `originCity`, `originCountry` |
| `src/lib/types/dictionary.ts` (`TripItineraryDict`) | Modified | New keys/templates, plus `essentials.originLabel`/`travelTypeLabel`/`travelTypeValues` (post-apply) |
| `src/dictionaries/{es,en}.json` | Modified | Same keys, both locales (mandatory) |
| `src/app/api/contact/route.ts` | **Unchanged (deliberate)** | Reused as-is; the new CTA is just another caller |
| `prisma/schema.prisma`, `src/app/api/trips/[id]/route.ts` | **Unchanged (deliberate)** | No schema or payload change is needed — verified 2026-08-12 |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The `.root`-scoped module's base element rules (`.root a`, `.root button`) leak into shared children (`Button`, `SecureRoute` chrome) rendered inside the subtree | Med | Same containment the admin module already relies on; `sdd-design` must enumerate which shared primitives render inside `.root` and verify each visually |
| ~500 lines of CSS duplicated across the admin and traveler modules with no shared base | Med | Accepted. Flagged as a convention gap for a later extraction; splitting it now would force a refactor of already-shipped, already-reviewed admin CSS |
| The prototype's timeline gets its visual richness from per-stop rows that have no data model; flattening to one day-card per day may read as visually thin | Med | Resolved Decision #1 is final. Design first tried inventing a day-level dot/rail to preserve some of that richness (ADR-3); manual QA showed it didn't work (a disconnected floating dot) and, on re-checking the prototype, the day-marker never had one at any granularity — so the final answer is no connector at all, matching the prototype's own day-marker exactly. Resolved as of ADR-3's supersession |
| The prototype is English-only sample copy tuned to Mendoza; literal translation ships destination-specific text to every trip | Med | Every lede/eyebrow must be generalized before translation. `sdd-spec` asserts no destination-, region-, or drop-specific wording in any dictionary value |
| `POST /api/contact` is unauthenticated and un-rate-limited; a logged-in CTA makes it easier to spam `hola@getrandomtrip.com` | Low | Pre-existing property of an already-public endpoint. Not widened here; button-level pending/disabled state only |
| The redesigned page renders for pre-reveal / cancelled statuses where the hero's celebratory framing is wrong | Med | The server already omits itinerary/documents for non-visible statuses and the page keys its pre-reveal notice off that. `sdd-spec` must state what the hero renders in the pre-reveal and cancelled cases |
| **Single-PR size** — see Delivery below | High | Accepted via `size:exception` |

## Delivery

`delivery_strategy: single-pr`, per the session's cached decision. This change is a coordinated visual port: a CSS module, its consuming components, and their dictionary keys are not independently shippable without landing a half-styled page in production. Estimated well over the 400-line review budget (a ~500-line CSS module alone), so **`size:exception` is recorded here in advance**. Do **not** propose chained or stacked PRs at `sdd-tasks`.

## Rollback Plan

Purely additive and presentational — no schema change, no API change, no data migration. A single `git revert` of the PR restores today's `HeaderHero` + Tailwind page exactly. The new CSS module and subcomponent files are unreferenced after revert and can be deleted independently. Dictionary additions are additive keys; leaving them in place after a revert breaks nothing.

## Dependencies

- `trip-fulfillment-documents` must remain in place — this change consumes its `TripDocumentDTO`, its authenticated document route, and its `isFulfillmentVisible` gate.
- `--font-barlow` / `--font-barlow-condensed` are already registered globally via `next/font` in `globals.css` (verified via the admin module). No new font loading.
- `getRevealCountdown` (`src/lib/helpers/getRevealCountdown.ts`) and `interpolateTemplate` already exist — compose them for the "Departs in N days" pill, do not re-express either.

## Success Criteria

- [x] A traveler on a `REVEALED` trip sees the hero with their real destination, date range, traveler count, a correct "Departs in N days" pill, and the assigned experience's real photo as background (ADR-11).
- [x] The essentials strip shows exactly four columns (Length, Party, Origin, Travel type) with real values — no placeholder district, airport, or room-type text anywhere on the page (ADR-9).
- [x] The itinerary renders one styled day card per `ExperienceItineraryDay`, with derived weekday/date, no invented per-stop rows, and no invented day-level connector either (ADR-3, superseded).
- [x] Document cards render from `TripDocumentDTO` only: label, country tag, mimeType tag, upload date — no fabricated confirmation numbers or date ranges.
- [x] Every `.btn`-styled action (View/Download/support CTA) renders with its own variant color — no base-element rule silently overrides it (post-apply correction).
- [x] The help CTA sends a real message through `POST /api/contact` carrying trip context, and shows a distinct success and failure state.
- [x] The page renders correctly in the pre-reveal and cancelled cases, with no broken or celebratory-but-empty hero.
- [x] Rendering matches `prototype-reference.html`'s visual language at ≥1280px and degrades cleanly at ≥360px, for every section including inclusions/exclusions (ADR-10).
- [x] Every user-visible string exists in both `src/dictionaries/es.json` and `en.json`, with no destination-specific wording; day titles/descriptions remain tripper-authored content and are **not** in the dictionary.
- [x] No `.root` style leaks into any other route; `npm run typecheck` and `npm run test` pass (`npm run lint`/`next lint` fails on a pre-existing, unrelated Next 16.2.6 + ESLint 8.57.0 flat-config incompatibility, reproduced on untouched files — not a regression from this change).

## Resolved Decisions (product owner, 2026-08-12 — FINAL, do not reopen)

| # | Decision |
|---|---|
| 1 | **Itinerary timeline** renders using the REAL `ExperienceItineraryDay` data model (day number, title, description — one entry per day, no per-stop time/icon breakdown), styled in the prototype's day-card visual language. Do NOT invent a new per-stop data model. Matches how the admin's itinerary-reference view already renders the same data. |
| 2 | **Essentials strip** keeps only fields with real backing. ~~Nights and pax only~~ **Partially superseded post-apply (ADR-9, 2026-08-12): Origin (`originCity`/`originCountry`) and Travel type (`type`) are ALSO real, always-populated `TripRequest` fields — 4 columns total (Length, Party, Origin, Travel type).** District, airport code/name, and room-type columns remain DROPPED — those three specifically have no schema backing and were prototype-only sample flourishes; this part of the decision stands. The "Departs in N days" pill IS in scope — trivial date math, same pattern as the shipped `getRevealCountdown` in the admin fulfillment header. |
| 3 | **Document cards** populate from the REAL `TripDocumentDTO` shape (`id, label, country, mimeType, originalFilename, sizeBytes, createdAt, href, downloadHref`). Show label, a country tag, a mimeType-derived tag (e.g. "PDF"/"JPG"), and upload date. DROP the prototype's invented confirmation-number/room-type/date-range sample copy — that data doesn't exist and must not be fabricated. |
| 4 | **"Message your Tripper" CTA** is RENAMED/REPURPOSED to a traveler→admin contact action (NOT tripper — no traveler→tripper messaging mechanism exists or is in scope). Wired to the EXISTING general contact endpoint `POST /api/contact` (`src/app/api/contact/route.ts`, sends via `sendMail` to `hola@getrandomtrip.com`, required fields `name/email/interest/message`). No new backend — reuse this endpoint, prefilling trip context (trip id/destination) into the message and/or a fixed `interest` value appropriate for trip support. The exact prefill/UI shape (modal vs. inline form vs. simple deep-link) is decided in `sdd-design`, not here; the backend-reuse decision itself is FINAL. |
| 5 | **i18n**: every user-visible string (labels, eyebrows, section headings, help copy, button text, empty/error states) MUST get `es`/`en` dictionary keys per `.claude/rules/i18n-and-types.md` — no exceptions, including the interpolated "Departs in {{n}} days" pattern. Day/stop titles and descriptions are tripper-authored CONTENT (already stored per-trip in the DB), not dictionary strings — do not add them to the dictionary. |
| 6 | **Fonts**: reuse whatever font-loading mechanism the admin fulfillment CSS module already established (global `--font-barlow` / `--font-barlow-condensed` vars registered via `next/font`) rather than re-embedding the prototype's base64 `@font-face` blocks. |

## Open Questions

**None.** All six original forks were resolved by the product owner before this proposal was written. The post-apply amendment above (essentials 4-column expansion, hero real-photo/height rework, itinerary connector removal, inclusions/exclusions restyle, two bug fixes) settled every item it touched — see `design.md` ADR-9/10/11 and "Post-apply corrections" for full rationale. Nothing is left pending.
