# Design: Traveler Trip Details Redesign

Executes `proposal.md`. The six **Resolved Decisions are settled input** and are not reopened anywhere below, except where a post-apply ADR explicitly supersedes one (ADR-9 supersedes part of Resolved Decision #2 — Origin/Travel type turned out to have real schema backing). This document fixes the technical shape only, and closes the three forks the proposal explicitly delegated here (ADR-2, ADR-3, ADR-4). Two verified-code corrections are recorded during design (ADR-5, ADR-8), both preserving the proposal's stated intent. **Four more corrections were recorded after the initial apply batch**, once the product owner reviewed the live page against real screenshots: ADR-3 is superseded entirely (the day-level dot/rail it introduced didn't exist in the prototype and didn't visually work), ADR-9 widens the essentials strip back to 4 real-data columns, ADR-10 brings the previously out-of-scope inclusions/exclusions section in line with the rest of the page, ADR-11 replaces the illustrated hero background with the assigned experience's real photo and matches `HeaderHero`'s height/alignment convention instead of the prototype's — plus two plain bug fixes ("Post-apply corrections", below ADR-11).

The visual contract is `prototype-reference.html`. The technical playbook is the shipped admin half (`src/components/app/admin/trip-fulfillment/`). This is a **port**, not a reinterpretation: class-for-class, value-for-value, except where an ADR below names the divergence.

## Technical Approach

One PR (`size:exception` recorded in the proposal), built bottom-up:

1. `src/types/tripDetails.ts` + the `getRevealCountdown.ts` refactor — pure, RED-first (ADR-5, ADR-6).
2. `traveler-trip-details.module.css` — prototype CSS ported under `.root` (ADR-1).
3. Subcomponents (`Hero`, `BackRow`, `EssentialsStrip`, `ItineraryTimeline`, `HelpStrip`) + `TripDocumentsSection` restyled in place.
4. `details/page.tsx` reduced to a data-fetching orchestrator with status-variant routing (ADR-7).
5. `TripItineraryDict` + both locale JSONs, in the same commits as the components consuming them.

## Architecture Decisions

### ADR-1: The module ports **class selectors only**; exactly two base-element rules survive, both inheritance-safe

The prototype's global resets (`* { box-sizing }`, `html`, `body`, `img, svg { display: block; max-width: 100% }`, `a { color: inherit }`, `button { font: inherit }`, the `:root` var block, the `@media (prefers-color-scheme: dark)` / `[data-theme]` overrides, and all six `@font-face` blocks) are **dropped**. Tailwind preflight already sets `box-sizing` and `svg { display: block }` app-wide; `<body>` is already locked light (`design-system.md`), so the three theme-pinning blocks are dead weight.

What survives as element-level, matching the admin precedent verbatim:

```css
.root { /* the prototype's :root custom properties + font/line-height/color */ }
.root a { color: inherit; }
.root button, .root input, .root textarea, .root select { font-family: inherit; }
```

`font-family` only — **not** the prototype's `font: inherit` shorthand, which would reset `font-size`/`font-weight`/`line-height` and flatten any Tailwind-styled child. `.root` deliberately does **not** set `font-size` (the admin module's `font-size: 14px` is safe there because that page is 100% module-styled; here every prototype value is already `rem`, which is `html`-relative, so setting it would only shrink `em`-based children for no gain).

Every other rule is anchored to a generated class. Descendant `svg` sizing is anchored to a class that only ever wraps a `lucide-react` icon we render (`.metaItem svg`, `.btn svg`, `.docCardIcon svg`, `.essentialsLabel svg`) — **never** `.root svg`. The prototype's combined `.btn:focus-visible, a:focus-visible, .jumpnav a:focus-visible` is split: the bare `a:focus-visible` arm is dropped; the class-anchored arms (`.btn`, `.jumpnav a`, `.backlink`) are kept.

| Option | Tradeoff | Decision |
|---|---|---|
| Port the prototype CSS as-is under `.root` | `.root button { font: inherit }` and `.root svg { max-width: 100% }` silently restyle every shared child | **Rejected** |
| Class-selectors-only + 2 inheritance-safe element rules | ~15 lines of prototype reset dropped; must verify each shared child once | **Chosen** |
| `:where()` de-specification wrappers | Extra machinery for a problem the two rules above don't have | Rejected |

### ADR-2 (fork #1 closed): shared primitives inside `.root` are reduced to two, and both are structurally immune

Enumeration of every shared component that renders inside the new `.root` subtree, after this change:

| Shared thing | Inside `.root`? | Exposure to module rules | Resolution |
|---|---|---|---|
| `SecureRoute`, `LoadingSpinner` | No — they wrap/precede `.root` | None | Untouched |
| `HeaderHero`, `Section` | **Removed from this route** | — | The prototype's `.hero` + `.wrap` replace them |
| `next/link` (back link) | Yes | `.root a { color: inherit }` — intended, it is module-styled via `.backlink` | Keep |
| `Button` (`@/components/ui/Button`) in `TripDocumentsSection` View/Download | **No longer** | — | See below |
| `Modal` / `FormField` / `TextAreaInput` / `Button` in the help CTA | No — Radix `Dialog` portals to `document.body` | Zero: the DOM node is outside `.root` | Keep, unmodified |

**`TripDocumentsSection`'s View/Download stop going through `<Button asChild>` and become `<a className={styles.btn}>` / `<a className={styles.btnIcon}>`.** This is the same call the admin half already shipped through review (`TripFulfillmentHeader` renders raw `<Link className={styles.backLink}>` and `<button className={styles.backLink}>`, not `Button`). `design-system.md`'s "never a raw styled `<a>`" governs Tailwind dashboard surfaces; the proposal states up front that this bespoke `.root` subtree is a deliberate divergence. The alternative — keeping `<Button>` and writing defensive overrides so `.doc-card__actions` doesn't fight Tailwind's variant classes — is strictly more code and more fragile. `TripDocumentsSection`'s props and `TripDocumentDTO` contract are unchanged; only its markup is.

Result: **no shared primitive is subject to any module rule.** The containment risk in the proposal's risk table is closed by construction, not by vigilance. The help CTA choosing a Radix modal (ADR-4) is partly *because* of this property.

### ADR-3 (fork #2 closed, then **superseded** — see below): no connector is invented at any level

**Original decision (superseded 2026-08-12):** promote the rail from stop-level to day-level — each day card owns a dot+rail in the gutter between the marker column and the body, carrying the prototype's cyan-ring-dot-and-hairline visual DNA up one level since Resolved Decision #1 forbids inventing per-stop data.

**Why it was superseded:** manual QA against the live page showed the day-level dot as a stray floating circle beside each title, with no visible connecting line between cards — because `.day` cards are separate boxes with a real `1.6rem` gap between them, and the rail only extended `bottom: -0.2rem` past the marker (nowhere close to reaching the next card). Re-reading `prototype-reference.html` directly settled it: **the prototype's own `.day__marker` never had a dot or rail at all.** That decoration exists *only* on `.stop__dot`/`.stop__line`, scoped to the per-stop list inside a single day — which Resolved Decision #1 already excludes. The day-level connector was invented during this design, not ported from the source.

**Final decision:** render the day marker column and card shell exactly as the prototype's `.day__marker` — day number, weekday, date, title, description — with no dot, no rail, at any granularity.

```tsx
<li className={styles.day}>
  <div className={styles.dayMarker}>
    <span className={`${styles.dayNum} ${styles.cond}`}>{padded}</span>   {/* "01" */}
    <span className={styles.dayDow}>{weekday}</span>                       {/* "Saturday" */}
    <span className={styles.dayDate}>{dateShort}</span>                    {/* "Aug 22" */}
  </div>
  <div className={styles.dayBody}>
    <h3 className={`${styles.dayTitle} ${styles.cond}`}>{day.title}</h3>
    {day.description ? <p className={styles.dayDesc}>{day.description}</p> : null}
  </div>
</li>
```

```css
.day { display: grid; grid-template-columns: 5.5rem 1fr; gap: 1.2rem; /* …prototype .day verbatim… */ }
.dayMarker { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; text-align: center; }
.dayTitle { /* prototype .day__title verbatim, margin-bottom 0.6rem instead of 1.1rem */ }
.dayDesc  { margin: 0; max-width: var(--measure); font-size: 0.95rem; color: #4b5563; }
@media (max-width: 640px) {
  .day { grid-template-columns: 1fr; }
  .dayMarker { flex-direction: row; justify-content: flex-start; gap: 0.6rem; margin-bottom: 0.4rem; }
  .dayNum { font-size: 1.9rem; }
}
```

A description-less day renders title-only and the card simply reads compact — no placeholder text is fabricated. Weekday/date come from `trip.startDate + index` days (ADR-6), formatted per locale; when `startDate` is null the marker renders `dayNum` only.

### ADR-4 (fork #3 closed): **modal**, reusing `POST /api/contact` unchanged, trip context appended to `message`

| Option | Tradeoff | Decision |
|---|---|---|
| `mailto:` deep link | No success/failure state (Success Criterion requires both); depends on a configured mail client | **Rejected** |
| Inline form in the dark help strip | Lives *inside* `.root` → re-opens ADR-2's containment problem for 4 form primitives; a 2-line CTA strip becomes a form panel and breaks the prototype's layout | **Rejected** |
| Radix `Modal` (`@/components/ui/Modal`), CTA button opens it | Portals to `document.body` → zero `.root` exposure; reuses `FormField`/`TextAreaInput`/`Button` at their native Tailwind look; mirrors the just-shipped `ContactTravelerModal` structure 1:1 | **Chosen** |

`TripDetailsHelpStrip` renders the prototype's `.help` strip with a `<button className={styles.btn}>` that opens `TripSupportModal`. The modal collects **only `message`** (a `TextAreaInput`, `maxLength={4000}`). `name` and `email` come from `useSession()` — the traveler is authenticated, so they are never asked for and never editable. `interest` is a fixed constant `"Trip support"`; it is not user-visible (it only lands in the ops email's `Contact form - {interest}` subject at `hola@getrandomtrip.com`), so it is **not** a dictionary string.

Trip context is composed at submit time by a pure helper, **appended to `message`** — not a hidden field, because `POST /api/contact` accepts exactly `name/email/interest/message` and Resolved Decision #4 forbids touching it:

```ts
// src/components/app/dashboard/traveler/tripSupportHelpers.ts
/** Ops-facing footer appended to the traveler's message. English by design:
 *  it is never rendered in the UI, only inside the internal contact email. */
export function buildTripSupportMessage(
  message: string,
  ctx: { destination: string | null; startDate: string | null; tripId: string },
): string;
export function canSendTripSupport(message: string, sending: boolean): boolean;
```

Output shape: `"{message}\n\n---\nTrip ID: {tripId}\nDestination: {destination}\nDeparture: {startDate}"`, with null lines omitted. Prepending is rejected — the ops reader wants the human message first.

States, mirroring `ContactTravelerModal` exactly:

| State | UI |
|---|---|
| idle | textarea + `send` button, disabled while `message.trim()` is empty |
| sending | button label swaps to `sending`, both buttons `disabled` (the only rate-limit affordance — the proposal accepts the endpoint's un-throttled nature and does not widen it) |
| success (`res.ok`) | body replaced by `successTitle` + `successBody`; footer shows a single `close` button |
| failure (`!res.ok` or network throw) | red error line under the textarea using `copy.support.errorGeneric`; form state preserved so the traveler can retry without retyping |

### ADR-5 (correction): the pill counts down to **departure**, so `getRevealCountdown` is composed — not called on the wrong axis

Verified: `getRevealCountdown(startDate, now)` counts down to `startDate − 48h` (the reveal moment), and returns `{ revealed: true, … }` once passed. The pill reads *"Departs in N days"* — a different axis. Calling the existing helper and using its `days` would render a number that is 2 days short, silently.

The proposal says *"compose `getRevealCountdown`, do not re-express it."* The composition is a 6-line extraction inside the existing file, with **zero behavior change** to `getRevealCountdown` (its unit tests stay green untouched, and the admin header's "Reveals in" callout is correct for its own axis and is not modified):

```ts
// src/lib/helpers/getRevealCountdown.ts
interface Countdown { elapsed: boolean; days: number; hours: number; minutes: number; seconds: number }
function countdownTo(target: Date, now: Date): Countdown;          // the existing arithmetic, extracted

export function getRevealCountdown(startDate: Date, now: Date): RevealCountdown {
  const { elapsed, ...rest } = countdownTo(getRevealAt(startDate), now);
  return { revealed: elapsed, ...rest };                            // public shape unchanged
}
/** Countdown to departure itself. `elapsed: true` once the trip has started. */
export function getDepartureCountdown(startDate: Date, now: Date): Countdown {
  return countdownTo(startDate, now);
}
```

Pill render rule: only when `startDate` exists, `status === "REVEALED"`, and `!elapsed`. `days > 0` → `departsInDays` (`"Departs in {{n}} days"`); `days === 0` → `departsToday`. `COMPLETED` / `CANCELLED` never render it.

### ADR-6: the widened trip shape moves to `src/types/`, and `ItineraryDayEntry` is reused, not redeclared

`.claude/rules/i18n-and-types.md` forbids component-local domain types; today's `page.tsx:20-37` declares two. Widening them is the moment to fix it. The local `ItineraryDayEntry` is **deleted** in favour of the existing `@/types/tripper` export (identical shape, already the source for the tripper/XSED authoring flows).

Every added field was verified present on the wire — `GET /api/trips/[id]` returns the whole `TripRequest` row plus a `select`ed experience (`route.ts:33-50`); the client was simply discarding it. Prisma `DateTime` serializes to an ISO `string` through `NextResponse.json`, so all date fields are typed `string | null`, not `Date`.

```ts
// src/types/tripDetails.ts
import type { ItineraryDayEntry } from "@/types/tripper";
import type { TripDocumentDTO } from "@/types/tripDocument";

export interface TripDetailsData {
  id: string;
  status: string;                    // TripRequestStatus values, string per the API's serialization
  startDate: string | null;          // ISO
  endDate: string | null;            // ISO
  nights: number;
  pax: number;
  actualDestination: string | null;
  destinationRevealedAt: string | null;  // ISO
  experience?: {
    id: string;
    title: string;
    heroImage: string | null;
    destinationCity: string | null;
    destinationCountry: string | null;
    itinerary: ItineraryDayEntry[] | null;
    inclusions: unknown[] | null;
    exclusions: unknown[] | null;
  } | null;
  /** Absent (not empty) when the server's fulfillment gate hid it — see ADR-7. */
  documents?: TripDocumentDTO[];
}
```

Hero destination resolution, in order: `actualDestination` → `[destinationCity, destinationCountry].filter(Boolean).join(", ")` → `experience.title` → `copy.hero.destinationFallback`. Extracted as a pure `resolveTripDestination(trip)` so it is unit-tested rather than inlined in JSX.

### ADR-7: status variants are resolved in the orchestrator, **before** `.root` is mounted

`page.tsx` keeps no gating logic of its own — it reads what the server sent (the visible set is `{REVEALED, COMPLETED, CANCELLED}`, owned by `isFulfillmentVisible`, untouched here) and branches:

```
loading ──────────────► LoadingSpinner                      (unchanged)
documents === undefined ──► early return: today's Tailwind pre-reveal card + back link.
                            The .root subtree is NEVER mounted — no dark hero, no
                            animation, no CSS module loaded for a trip with no reveal.
otherwise ────────────► <div className={styles.root}> … full ported subtree … </div>
                            status === "REVEALED"  → real experience photo + departure pill
                            status === "COMPLETED" → real experience photo, eyebrow.completed, no pill
                            status === "CANCELLED" → real experience photo, eyebrow.cancelled, no pill,
                                                     no eyebrow dot; documents render with the
                                                     existing documentsCancelledNote
```

There is no `.heroMuted` CSS class (see ADR-11 — it was removed along with the illustrated gradient it used to modify). The `REVEALED`/`COMPLETED`/`CANCELLED` distinction is now purely a content-level branch inside `TripDetailsHero.tsx` (`isCancelled`/`trip.status` checks controlling the eyebrow copy, the eyebrow dot, and the pill) — the background, height, and layout are visually identical across all three statuses, since the same real photo (or the same fallback gradient) renders regardless.

### ADR-8 (correction): the module references `var(--font-barlow)`, not the literal family name

Resolved Decision #6 says reuse the mechanism the admin module established: the global `next/font` vars. Verified at `src/app/layout.tsx:19-32,76` — `Barlow` and `Barlow_Condensed` are registered via `next/font/google` with `variable: "--font-barlow"` / `"--font-barlow-condensed"`, applied on `<html>`, and re-exported through `@theme` in `globals.css:81-83`. `next/font/google` emits a **hashed** family name (`__Barlow_xxxxxx`); the literal string `"Barlow"` matches nothing and silently falls through to the next family in the stack. The admin module's `font-family: "Barlow", …` (`fulfillment.module.css:51,68`) is therefore a latent no-op, not a pattern to copy. This module uses:

```css
.root { font-family: var(--font-barlow), -apple-system, "Segoe UI", sans-serif; }
.cond { font-family: var(--font-barlow-condensed), "Arial Narrow", sans-serif; }
```

Fixing `fulfillment.module.css` is **out of scope** here (shipped, reviewed, separately revertible) — recorded as a one-line follow-up.

### ADR-9 (2026-08-12, post-apply): essentials strip widened to 4 columns — Origin and Travel type are real fields, not invented ones

Resolved Decision #2 said "exactly two columns, District/Airport/room-type have no schema backing." That premise was correct for those three specific fields — but incomplete: it didn't check for *other* real `TripRequest` fields that could fill the remaining two prototype slots. Re-verified against `prisma/schema.prisma`: `originCity`/`originCountry` (both non-nullable) and `type` (`solo`/`couple`/`family`/`group`/`honeymoon`/`paws`, fixed 6-value set) are real, always-populated columns — and, per ADR-6's original finding pattern, already on the wire (`GET /api/trips/[id]`'s top-level `include` returns every `TripRequest` scalar; the client interface simply hadn't declared them).

| Column | Source | Icon |
|---|---|---|
| Length | `trip.nights` | `Moon` |
| Party | `trip.pax` | `Users` |
| Origin | `resolveTripOrigin(trip)` = `` `${originCity}, ${originCountry}` `` (new pure helper, RED→GREEN tested — no fallback chain needed, both fields non-nullable) | `MapPin` |
| Travel type | `trip.type`, mapped through `TripItineraryDict.essentials.travelTypeValues` (new label map), raw value as fallback for anything unmapped; rendered with `text-transform: capitalize` so the fallback path is never lowercase-raw-looking | `Heart` |

District, airport, and room-type remain dropped — genuinely no schema backing exists for those three. `.essentials` grid restored to the prototype's original `repeat(4, 1fr)` with its `860px` → 2-col (`nth-child(3)` border-left reset) and `520px` → 1-col breakpoints, both of which had been removed when the strip was first cut to 2 columns.

A duplicated `EssentialItem` block (Length/Party had near-identical JSX) was extracted as a local, non-exported subcomponent inside `TripEssentialsStrip.tsx` at the same time — pure cleanup, not a new file (only used within this one component).

### ADR-10 (2026-08-12, post-apply): inclusions/exclusions restyled to match this page's own design language

The proposal marked inclusions/exclusions "Out of Scope... keep the current markup below the timeline unless design proves otherwise," since the prototype has no equivalent section. Once every other section on the page was ported to the module's card/icon/color language, the untouched plain-Tailwind block (`rounded-lg border-gray-200 shadow-sm`, raw unicode `✓`/`✗` glyphs, generic `text-gray-600`) read as visibly off-brand next to its now-styled neighbors — design *did* prove otherwise, per the proposal's own escape hatch.

New classes in `traveler-trip-details.module.css`, mirroring `.day`/`.docCard`'s existing chrome rather than inventing a new visual vocabulary:

```css
.inclCard { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; box-shadow: 0 1px 2px rgba(17,24,39,0.04); padding: 1.4rem; }
.inclCardTitle { margin: 0 0 0.9rem; font-weight: 700; font-size: 0.98rem; color: var(--ink); }
.inclList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.inclItem { display: flex; align-items: flex-start; gap: 0.55rem; font-size: 0.9rem; color: #4b5563; }
.inclItemOk svg { color: #22c55e; }   /* was raw "✓" */
.inclItemNo svg { color: #f87171; }   /* was raw "✗" */
```

The 2-column grid reuses `styles.docGrid` directly (identical `repeat(2,1fr)` + `1rem` gap + `720px` breakpoint already defined for the documents section) rather than declaring a duplicate. Icons are `lucide-react` `Check`/`X`, matching every other icon on the page. `page.tsx`'s inline JSX for this block is otherwise unchanged — same conditional rendering, same `copy.inclusions`/`copy.exclusions` keys.

### ADR-11 (2026-08-12, post-apply): hero background is the assigned experience's real photo; height/alignment match `HeaderHero`, not the prototype

**Original decision (ADR-7, above):** port the prototype's illustrated hero verbatim — dark gradient, CSS star field, floating balloon SVG, layered mountain silhouettes, `78vh` min-height, bottom-aligned content (`align-items: flex-end`).

**Revision, directed by the product owner after seeing the live page:**

1. **Height**: `min-height: 78vh` → `min-height: 40vh`. Two candidates were tried and rejected first — the prototype's own `78vh`, then the marketing home hero's `h-screen` (`100vh`) — before settling on `HeaderHero.tsx`'s `min-h-[40vh]`, since this page lives in the same dashboard/`HeaderHero` family conceptually, not the marketing home page.
2. **Vertical alignment**: `align-items: flex-end` → `align-items: center`, matching `HeaderHero`'s own centered content, not the prototype's bottom-pinned text.
3. **Background**: the illustrated star field / mountain silhouettes / floating balloon (and their `drift` keyframes) are **dropped entirely**, not layered under a photo — they existed only to stand in for a missing photo. Background is now the assigned experience's real `heroImage` (already on the wire — `TripDetailsData.experience.heroImage`, `string | null`), rendered full-bleed via `<Img>` (`@/components/common/Img`), under a flat dark scrim mirroring `VideoBackground`'s `bg-black/40`-style overlay pattern used on the marketing home hero. Falls back to the plain illustrated gradient (no stars/balloon/mountains — those are gone) when no experience/photo is assigned yet.

```css
.hero {
  min-height: 40vh;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, var(--ink-950) 0%, var(--cyan-900) 46%, var(--cyan-700) 72%, #c98a4e 92%, #e7ac5c 100%); /* fallback only */
}
.heroImage { position: absolute; inset: 0; } /* <Img className={`${styles.heroImage} h-full w-full object-cover`} /> */
.heroScrim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(11,15,25,0.5) 0%, rgba(11,15,25,0.4) 50%, rgba(11,15,25,0.6) 100%);
}
```

There is no `.heroMuted` CSS class — it was removed entirely. `REVEALED` vs. `COMPLETED` vs. `CANCELLED` is a content-only distinction inside `TripDetailsHero.tsx` (eyebrow copy, eyebrow dot, pill visibility); the hero's visual chrome (photo/gradient, height, layout) is identical across all three.

### Post-apply corrections (2026-08-12): two real bugs found via product-owner screenshot review

Both are genuine defects caught after the initial apply batch, not stylistic preference — recorded here because they change what shipped, the same way ADR-5/ADR-8 record verified corrections.

1. **Font-family drift between sibling sections.** `TripItineraryTimeline` and `TripDocumentsSection` each independently composed `${styles.heading} ${styles.headingSection}` for their eyebrow/heading/lede block — one call site included `${styles.cond}` (Barlow Condensed), the other didn't, so "Your itinerary" and "Your documents" silently rendered in two different font families. Fixed by extracting a shared `SectionHead.tsx` component (`{ eyebrow, heading, lede? }`) — now there is exactly one place that composes the heading's classes, closing the defect class rather than just the one instance.
2. **`.root a:not(.btn)` — a CSS-specificity bug, not a wrong button variant.** `.root a { color: inherit }` (ADR-1's base link-color reset) is a class+type selector, specificity `(0,1,1)`. `.btnFill { color: #fff }` is a single class, specificity `(0,1,0)`. Since every document-card action anchor carries both `styles.btn`/`styles.btnFill` classes AND is a descendant of `.root`, the higher-specificity base rule silently won, forcing `color: inherit` (ink) onto the filled "View" button's icon and text — ink-on-ink, invisible, indistinguishable from a solid black rectangle. The outline "Download" button looked correct only by coincidence (its intended color is also ink). Fixed by scoping the base rule to `.root a:not(.btn)`, which structurally excludes every `.btn`-styled anchor rather than relying on source-order/specificity tie-breaking.

## Data Flow

```
page.tsx (client orchestrator, SecureRoute-wrapped)
  ├─ getDictionary(locale) ─────────────► copy: TripItineraryDict
  ├─ useSession() ──────────────────────► { name, email }  → TripSupportModal only
  └─ GET /api/trips/[id] ───────────────► TripDetailsData        (NO API change)
       │  documents === undefined ──► pre-reveal card, .root never mounted
       └─ <div .root>
            TripDetailsHero          ← experience.heroImage, destination, dates, pax, getDepartureCountdown
            TripDetailsBackRow       ← next/link back + #itinerary / #documents anchors
            TripEssentialsStrip      ← nights, pax, originCity/originCountry, type (ADR-9, 4 columns)
            TripItineraryTimeline    ← experience.itinerary + startDate → weekday/date
            (inclusions / exclusions — restyled to match module design language, ADR-10)
            TripDocumentsSection     ← documents[]  →  doc.href / doc.downloadHref
            TripDetailsHelpStrip ──button──► TripSupportModal (Radix portal, outside .root)
                                                └─ POST /api/contact { name, email,
                                                     interest:"Trip support",
                                                     message: buildTripSupportMessage(…) }
```

## Icon Mapping — sprite symbol → `lucide-react`

| Prototype symbol | lucide | Used for |
|---|---|---|
| `#i-arrow-left` | `ArrowLeft` | back row |
| `#i-calendar` | `Calendar` | hero meta date range |
| `#i-users` | `Users` | hero meta pax · essentials Party |
| `#i-moon` | `Moon` | essentials Length |
| `#i-plane` | `Plane` | "Departs in N days" pill |
| `#i-file` | `FileText` | doc card, PDF |
| `#i-shield` | `Shield` | documents info banner |
| `#i-eye` | `Eye` | View action |
| `#i-download` | `Download` | Download action |
| `#i-message` | `MessageCircle` | help strip CTA |
| `#i-map-pin` | `MapPin` | essentials Origin (ADR-9 — Resolved Decision #2's original "unused, Base/District dropped" call is superseded: same icon, real data) |
| `#i-bed` `#i-glass` `#i-fork` `#i-grape` `#i-mountain` `#i-car` | `Bed` `Wine` `Utensils` `Grape` `Mountain` `Car` | **unused** — Resolved Decision #1 dropped per-stop rows |
| — (no prototype equivalent) | `Heart` | essentials Travel type (ADR-9, new column) |
| — (no prototype equivalent) | `Check` / `X` | inclusions/exclusions items (ADR-10, replaces raw unicode `✓`/`✗`) |

Doc-card icon is chosen from the real `mimeType` (Resolved Decision #3): `image/*` → `Image as ImageIcon` (aliased — `Image` collides with `next/image`), everything else → `FileText`. The hero's illustrated-graphic icons (balloon/mountains/stars, none of which were `lucide-react` to begin with) are removed per ADR-11 — no icon mapping needed for the hero background.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/types/tripDetails.ts` | Create | `TripDetailsData`; reuses `ItineraryDayEntry` from `@/types/tripper` (ADR-6) |
| `src/lib/helpers/getRevealCountdown.ts` (+`__tests__`) | Modify | Extract `countdownTo`, add `getDepartureCountdown`; `getRevealCountdown` shape unchanged (ADR-5) |
| `…/traveler/traveler-trip-details.module.css` | Create | Prototype CSS, `.root`-scoped, class-selectors-only (ADR-1, ADR-8); day-level dot/rail added then removed (ADR-3); hero background/height/scrim reworked (ADR-11); `.essentials` grid widened to 4 columns (ADR-9); `.inclCard`/`.inclList`/`.inclItem` added (ADR-10); `.root a:not(.btn)` specificity fix (post-apply) |
| `…/traveler/tripDetailsHelpers.ts` (+`__tests__`) | Create | `resolveTripDestination`, `buildDayDateLabels(startDate, index, locale)`, `resolveTripOrigin` (ADR-9, added post-apply) |
| `…/traveler/tripSupportHelpers.ts` (+`__tests__`) | Create | `buildTripSupportMessage`, `canSendTripSupport` (ADR-4) |
| `…/traveler/SectionHead.tsx` | Create (post-apply) | `{ eyebrow, heading, lede? }` — extracted after a font-family drift bug (see "Post-apply corrections"); used by `TripItineraryTimeline` and `TripDocumentsSection` |
| `…/traveler/TripDetailsHero.tsx` | Create | `{ copy, locale, trip }` — eyebrow variant, title, subtitle, meta row, pill; background is `experience.heroImage` full-bleed + flat scrim, identical across `REVEALED`/`COMPLETED`/`CANCELLED` (content-only status branching, no CSS modifier class — ADR-11) |
| `…/traveler/TripDetailsBackRow.tsx` | Create | `{ copy, locale, tripId }` — `next/link` back + 2 hash anchors |
| `…/traveler/TripEssentialsStrip.tsx` | Create | `{ copy, nights, origin, pax, travelType }` — 4-column grid (ADR-9), local `EssentialItem` subcomponent, `capitalize` prop for the Travel type value |
| `…/traveler/TripItineraryTimeline.tsx` | Create | `{ copy, days, locale, startDate }` — day cards, no dot/rail at any level (ADR-3, superseded), uses `SectionHead` |
| `…/traveler/TripDetailsHelpStrip.tsx` | Create | `{ copy, onOpen }` — dark `.help` strip + CTA button |
| `…/traveler/TripSupportModal.tsx` | Create | `{ copy, destination, onClose, open, startDate, tripId, user }` (ADR-4) |
| `…/traveler/TripDocumentsSection.tsx` | Modify | Rows → `.docGrid` / `.docCard`; `<Button>` → `<a className={styles.btn}>` (ADR-2); uses `SectionHead`. Props + `TripDocumentDTO` contract unchanged |
| `…/dashboard/trips/[id]/details/page.tsx` | Modify | Thin orchestrator; `HeaderHero`/`Section` dropped for this route; local interfaces deleted; status branching (ADR-7); inclusions/exclusions block restyled in place (ADR-10); passes `origin`/`travelType` to `TripEssentialsStrip` (ADR-9) |
| `src/types/tripDetails.ts` | Modify (post-apply) | Widened with `type`, `originCity`, `originCountry` (ADR-9) |
| `src/lib/types/dictionary.ts` | Modify | `TripItineraryDict` gains `hero`, `nav`, `essentials`, `itinerary`, `documents`, `support`, `footer` sub-objects; `essentials` gains `originLabel`, `travelTypeLabel`, `travelTypeValues` (ADR-9, post-apply) |
| `src/dictionaries/es.json`, `en.json` | Modify | Every key below, both locales |
| `src/app/api/trips/[id]/route.ts`, `prisma/schema.prisma`, `src/app/api/contact/route.ts` | **Unchanged** | Verified: every field the redesign needs — including the post-apply Origin/Travel-type additions — is already on the wire |

## i18n Plan

`TripItineraryDict` keeps all 17 existing keys (`backToTrip`, `day`, `view`, `download`, `documentsNote`, `documentsCancelledNote`, `preReveal*`, `empty*`, `noExperience`, `inclusions`, `exclusions` are all reused as-is) and gains ~21 grouped keys. Every value is **destination-agnostic** — the prototype's Mendoza/Malbec/Andes copy is generalized before translation, per the proposal's risk row:

- `hero`: `eyebrowRevealed` ("Your destination, revealed"), `eyebrowCompleted`, `eyebrowCancelled`, `destinationFallback`, `subtitle` (interpolated `{{nights}}` — nights-based, no region wording), `travelers` (`{{n}}`), `departsInDays` (`{{n}}`), `departsToday`
- `nav`: `itinerary`, `documents`
- `essentials`: `lengthLabel`, `nightsValue` (`{{n}}`), `daysSub` (`{{n}}`), `partyLabel`, `paxValue` (`{{n}}`), `originLabel`, `travelTypeLabel`, `travelTypeValues` (object: `solo`/`couple`/`family`/`group`/`honeymoon`/`paws` — post-apply, ADR-9)
- `itinerary`: `eyebrow`, `heading`, `lede`
- `documents`: `eyebrow`, `heading`, `lede`, `privacyNote`
- `support`: `heading`, `body`, `cta`, `messageLabel`, `messagePlaceholder`, `send`, `sending`, `cancel`, `close`, `successTitle`, `successBody`, `errorGeneric`
- `footer`: `line` (interpolated `{{tripId}}` + `{{date}}`; rendered only when `destinationRevealedAt` exists)

Interpolation is `interpolateTemplate` throughout. Day titles/descriptions stay tripper-authored content and never enter the dictionary (Resolved Decision #5). Dates/weekdays are formatted with `Intl.DateTimeFormat` via a locale tag map (`en → en-US`, `es → es-AR`), never hardcoded month names.

## Testing Strategy

Strict TDD: every pure row is RED before GREEN.

| Layer | What | Where |
|---|---|---|
| Unit (pure) | `getDepartureCountdown` — future/past/exact-boundary; **plus a regression assertion that `getRevealCountdown` still returns the 48h-shifted result** (the extraction must not move its axis) | `src/lib/helpers/__tests__/` |
| Unit (pure) | `resolveTripDestination` — 4-step fallback chain, incl. city-without-country and both-null | `…/traveler/__tests__/` |
| Unit (pure) | `buildDayDateLabels` — index offset, `es`/`en` tags, null `startDate` → no weekday/date | `…/traveler/__tests__/` |
| Unit (pure) | `buildTripSupportMessage` — human message first, null destination/date lines omitted, tripId always present; `canSendTripSupport` — empty/whitespace/sending | `…/traveler/__tests__/` |
| Unit (pure) | `resolveTripOrigin` — joins `originCity`/`originCountry` (post-apply, ADR-9) | `…/traveler/__tests__/` |
| Component | `TripItineraryTimeline` — one card per day, day number padded, description-less day renders no `<p>`, **no per-stop row is rendered** (guards Resolved Decision #1), **no day-level dot/rail rendered either** (guards ADR-3's supersession) | RTL, `…/traveler/__tests__/` |
| Component | `TripEssentialsStrip` — exactly 4 items (Length/Party/Origin/Travel type); real nights/pax/origin values render; known travel type renders its localized label, unknown type falls back to the raw value; no "district"/"airport"/"room" text anywhere (guards the surviving part of Resolved Decision #2 — district/airport/room-type stay dropped) | RTL |
| Component | `TripDocumentsSection` — renders `doc.href`/`doc.downloadHref`, no `/api/upload` substring; `CANCELLED` shows `documentsCancelledNote`; empty state | RTL, extends the existing file |
| Component | `TripSupportModal` — success view after `ok`, error line after `!ok` and after a network throw with the message preserved, send disabled on empty and while sending, POST body carries session name/email + `interest: "Trip support"` | RTL + `fetch` mock |
| Component | `page.tsx` — `documents === undefined` renders the pre-reveal card and **does not** render the hero eyebrow (guards ADR-7) | RTL |
| i18n guard | Every new `tripItinerary` key exists in both `es.json` and `en.json` with a non-empty value | `src/lib/types/__tests__/` (follows the `common.countries` drift-guard precedent) |
| Manual QA | Conducted screenshot-driven, iterative with the product owner rather than a single ≥1280/≥360/`prefers-reduced-motion`/keyboard-focus pass — surfaced 6 real defects/scope corrections, all fixed and recorded as ADR-3 (superseded), ADR-9, ADR-10, ADR-11, and the two "Post-apply corrections" bug fixes; see `tasks.md` Phase 7 for the itemized list |

## Migration / Rollout

**No migration required.** No schema change, no API change, no data migration, no feature flag. Purely additive and presentational, exactly as the proposal's rollback plan states.

## Open Questions

**None.** The proposal's six Resolved Decisions are final input where they still apply; ADR-3 and (partially) Resolved Decision #2 were **superseded** post-apply per the product owner's direction (see ADR-9/ADR-11 and the Executive summary above) — both are settled outcomes, not reopened questions. The three original forks are closed in ADR-2, ADR-3 (superseded) and ADR-4. Two follow-ups are recorded as accepted debt, neither blocking:

- `fulfillment.module.css`'s literal `"Barlow"` family names are a latent no-op (ADR-8) — one-line fix, deliberately not bundled into this PR.
- ~500 lines of CSS are duplicated across the admin and traveler modules with no shared base — accepted by the proposal; extraction would force a refactor of already-shipped admin CSS.
