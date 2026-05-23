# XSED (Sunday Drops) — Feature Specification

**Status:** Draft  
**Last updated:** 2026-05-22  
**Area:** `/xsed/*`, `/dashboard/admin/xsed/*`, `/api/xsed/*`

---

## 1. Overview

XSED (Spanish) / TGIS — "Thank God It's Sunday" (English) is a flat-rate mystery trip product. A new drop is published each Sunday. Clients book a slot without knowing the destination; the destination is revealed 48 hours before departure.

**Price:** $250 USD per person, flat rate. No filters. No add-ons.  
**Trip duration:** 1 night (Saturday departure, Sunday return).  
**Reveal timing:** 48 hours before the drop's `tripDate`.

---

## 1a. Booking Window & Countdown Logic

This is the core timing mechanic that drives the landing page countdown and controls access to the booking page.

### States

The system cycles through three states continuously based on the client's **local time**:

```
WAITING ──── Sunday 4:00 PM ────► OPEN (4 hrs) ──── Sunday 8:00 PM ────► WAITING (next Sunday)
```

| State | Condition | Duration |
|-------|-----------|----------|
| `WAITING` | `now < nextSunday4pm` | Variable (~7 days) |
| `OPEN` | `nextSunday4pm <= now < nextSunday4pm + 4h` | 4 hours |
| `WAITING` (reset) | `now >= nextSunday4pm + 4h` | Targets the *following* Sunday 4pm |

### State: WAITING

- Countdown displays time remaining until next Sunday at 16:00 local time
- CTA button is **disabled** or replaced with the email notification form
- `/xsed/book` page is **inaccessible** — redirects to `/xsed` with a "booking not open yet" message

### State: OPEN (booking window)

- Countdown displays time remaining until the window closes (Sunday 8:00 PM local time)
- CTA button is **enabled** — links to `/xsed/book`
- `/xsed/book` page is **accessible**
- Label on the button communicates urgency (e.g. "Book now — window closes in 2h 30m")

### State: RESET (window just closed)

- Booking window closes at Sunday 8:00 PM local time
- System immediately recalculates target to the **following** Sunday 4:00 PM
- Countdown restarts from scratch in WAITING state
- `/xsed/book` redirects again

### Supported timezones & window coverage

The app serves LATAM only. Each user gets exactly a **4-hour window** on Sunday, based on their own timezone. The system supports two regions:

| Region | IANA Timezone | UTC offset | Local window |
|--------|--------------|-----------|--------------|
| Argentina | `America/Argentina/Buenos_Aires` | UTC-3 (no DST) | Sunday 16:00–20:00 ART |
| Mexico | `America/Mexico_City` | UTC-6 (no DST since 2023) | Sunday 16:00–20:00 CST |

These overlap in UTC, forming a 7-hour outer boundary:

```
Sunday 19:00 UTC ──────────────────────────────► Monday 02:00 UTC
└─ ART opens       └─ CST opens  └─ ART closes              └─ CST closes
```

The 7-hour UTC range is used only as a **fast-rejection guard** — if `now` is outside this range, no LATAM user can be in their window. If inside, the user's specific timezone is validated.

#### Phase validation

**Client:** one step only — check the user's local time via `Intl`. No outer boundary guard needed on the client; the `Intl` check is fast and handles DST automatically.

**Server:** uses a UTC outer boundary as a cheap guard before running the heavier auto-decrement computation. The boundary is set wide enough to cover the westernmost supported LATAM timezone (Hermosillo, UTC-7): **Sunday 19:00 UTC → Monday 03:00 UTC**.

```
Client:  isLocalWindowOpen(userTz)  →  'open' | 'waiting'
Server:  isWithinOuterBoundary()    →  early-exit before computing displayedSold
```

#### Constants (define once, import everywhere)

```ts
// src/lib/xsed/window.ts

// Server-side outer boundary only (not used for client validation)
// Wide enough to cover UTC-7 (Hermosillo, MX) on the close side
// and UTC-2 (Noronha, BR) is accepted as an edge case (tiny population)
export const SERVER_OUTER_OPEN_UTC_HOUR  = 19; // Sunday 19:00 UTC = 4pm ART (UTC-3)
export const SERVER_OUTER_CLOSE_UTC_HOUR = 3;  // Monday 03:00 UTC = 8pm Hermosillo (UTC-7)

// User-facing window — same in every supported timezone
export const LOCAL_WINDOW_START_HOUR = 16; // 4pm local
export const LOCAL_WINDOW_END_HOUR   = 20; // 8pm local

// All supported LATAM IANA timezones
export const SUPPORTED_TIMEZONES = [
  // Argentina (all UTC-3, no DST)
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba',
  'America/Argentina/Salta',
  'America/Argentina/Jujuy',
  'America/Argentina/Tucuman',
  'America/Argentina/Catamarca',
  'America/Argentina/La_Rioja',
  'America/Argentina/San_Juan',
  'America/Argentina/Mendoza',
  'America/Argentina/San_Luis',
  'America/Argentina/Rio_Gallegos',
  'America/Argentina/Ushuaia',
  // Bolivia (UTC-4)
  'America/La_Paz',
  // Brazil (UTC-2 to UTC-5; Intl handles DST)
  'America/Sao_Paulo',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Araguaina',
  'America/Maceio',
  'America/Bahia',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Manaus',
  'America/Eirunepe',
  'America/Rio_Branco',
  'America/Noronha',       // UTC-2 — 4pm = 18:00 UTC, before server outer boundary; accepted edge case
  // Chile (UTC-3/-4 with DST; Intl handles it)
  'America/Santiago',
  'America/Punta_Arenas',
  // Colombia (UTC-5)
  'America/Bogota',
  // Costa Rica (UTC-6)
  'America/Costa_Rica',
  // Cuba (UTC-5/-4 with DST)
  'America/Havana',
  // Dominican Republic (UTC-4)
  'America/Santo_Domingo',
  // Ecuador (UTC-5)
  'America/Guayaquil',
  // El Salvador (UTC-6)
  'America/El_Salvador',
  // Guatemala (UTC-6)
  'America/Guatemala',
  // Haiti (UTC-5/-4 with DST)
  'America/Port-au-Prince',
  // Honduras (UTC-6)
  'America/Tegucigalpa',
  // Jamaica (UTC-5)
  'America/Jamaica',
  // Mexico (UTC-5 to UTC-7; Intl handles border DST)
  'America/Mexico_City',
  'America/Cancun',
  'America/Monterrey',
  'America/Merida',
  'America/Bahia_Banderas',
  'America/Mazatlan',
  'America/Hermosillo',    // UTC-7 — 8pm = 03:00 UTC; covered by server outer boundary
  'America/Chihuahua',
  'America/Ojinaga',
  'America/Tijuana',       // UTC-8 in winter — 8pm = 04:00 UTC, outside server boundary; accepted edge case
  // Nicaragua (UTC-6)
  'America/Managua',
  // Panama (UTC-5)
  'America/Panama',
  // Paraguay (UTC-3/-4 with DST)
  'America/Asuncion',
  // Peru (UTC-5)
  'America/Lima',
  // Puerto Rico (UTC-4)
  'America/Puerto_Rico',
  // Uruguay (UTC-3)
  'America/Montevideo',
  // Venezuela (UTC-4)
  'America/Caracas',
] as const;
```

**Accepted edge cases (no code change needed):**
- `America/Noronha` (UTC-2): 4pm = 18:00 UTC — 1 hour before server outer boundary. The server auto-decrement computation uses Sunday 19:00 UTC as `windowOpenAt`; users here get a slightly shorter reference but their client-side validation is correct.
- `America/Tijuana` (UTC-8 in winter): 8pm = 04:00 UTC — outside server outer boundary. These users see the correct 4-hour local window on the client; the server just won't run auto-decrement logic past 03:00 UTC.

### Key rules

- **The user-facing window is always 4 hours** — 4pm to 8pm in the user's timezone, every Sunday
- Client phase detection uses `Intl.DateTimeFormat().resolvedOptions().timeZone` — no geolocation, no permission prompt, DST handled automatically
- If the browser timezone is not in `SUPPORTED_TIMEZONES`, phase defaults to `'waiting'`
- The server outer boundary is only used as a guard for the auto-decrement computation — never exposed to the client
- Countdown in `WAITING` state targets the next Sunday 16:00 in the user's detected timezone
- The `CountDown` component detects state transitions on tick and re-evaluates phase without a page reload

### Helper logic (pseudo-code)

```ts
// src/lib/xsed/window.ts

/** Client: returns the user's IANA timezone if supported, null otherwise. */
export function detectSupportedTimezone(): string | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (SUPPORTED_TIMEZONES as readonly string[]).includes(tz) ? tz : null;
}

/** Client + server: returns true if it is Sunday 16:00–20:00 in the given IANA timezone. */
export function isLocalWindowOpen(tz: string): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value; // 'Sun'
  const hour    = Number(parts.find(p => p.type === 'hour')?.value ?? -1);
  return weekday === 'Sun' && hour >= LOCAL_WINDOW_START_HOUR && hour < LOCAL_WINDOW_END_HOUR;
}

/** Client: main phase resolver. */
export function getPhase(): 'waiting' | 'open' {
  const tz = detectSupportedTimezone();
  if (!tz) return 'waiting';
  return isLocalWindowOpen(tz) ? 'open' : 'waiting';
}

/** Server only: cheap guard before running auto-decrement computation. */
export function isWithinServerOuterBoundary(): boolean {
  const now = new Date();
  const day  = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 0 && hour >= SERVER_OUTER_OPEN_UTC_HOUR) return true;  // Sunday ≥ 19:00 UTC
  if (day === 1 && hour < SERVER_OUTER_CLOSE_UTC_HOUR) return true;  // Monday < 03:00 UTC
  return false;
}

/** Returns the Date the countdown targets — end of window if open, start of next if waiting. */
export function getCountdownTarget(tz: string): Date {
  // Uses Intl to find next Sunday 16:00 or 20:00 in the user's timezone
  // Implementation: iterate days from now until the target local time is found
}
```

### Slot auto-decrement mechanic

During the `OPEN` window, the displayed sold count increases automatically to create urgency — even if real purchases are slow. The goal is that `displayedSold === totalSlots` (all slots gone) before the 4-hour window closes.

**`displayedSold` is computed server-side on every request.** The client only polls and renders. No client-side timer or counter — this cannot be tampered with.

#### Two sources drive `displayedSold`

| Source | Trigger | Effect on `displayedSold` |
|--------|---------|--------------------------|
| Real purchase | User completes checkout for this drop | Raises the real purchase count; resets the auto-decrement reference point |
| Auto-decrement | 20 minutes elapsed since last purchase (or since window open) with no new purchase | Server adds 1 per elapsed 20-min period |

#### Server computation (on every poll)

The endpoint `GET /api/xsed/drops/[slug]/sold-count` computes `displayedSold` on the fly from two inputs stored in the database:

- `realCount` — number of TripRequests for this drop with `status IN (PENDING_PAYMENT, CONFIRMED, REVEALED, COMPLETED)`
- `lastPurchaseAt` — `createdAt` of the most recent such TripRequest (or `null` if none)

```ts
function computeDisplayedSold(
  realCount: number,
  totalSlots: number,
  windowOpenAt: Date,      // Sunday 4pm (computed from current date, server-side)
  lastPurchaseAt: Date | null,
): number {
  const now = new Date();
  // Auto-decrements count from the later of: window open OR last purchase
  const referenceTime = lastPurchaseAt && lastPurchaseAt > windowOpenAt
    ? lastPurchaseAt
    : windowOpenAt;
  const elapsedMs = Math.max(0, now.getTime() - referenceTime.getTime());
  const autoDecrements = Math.floor(elapsedMs / (20 * 60 * 1000));
  return Math.min(totalSlots, realCount + autoDecrements);
}
```

- When a real purchase happens, `lastPurchaseAt` updates to now → `elapsedMs` resets to ~0 → auto-decrements reset
- No purchase for 20 min → 1 auto-decrement added; 40 min → 2; etc.
- Result is always capped at `totalSlots`
- No cron job, no stored counter — purely derived from existing TripRequest timestamps

#### Math check

- Window = 240 minutes, 1 auto-decrement per 20 min → max 12 auto-decrements possible
- Default `totalSlots = 10` → 10 × 20 min = 200 min to reach sold out with zero real purchases
- Slots reach 0 within the window even with no purchases ✓

#### What the client does

- Polls `GET /api/xsed/drops/[slug]/sold-count` every **30 seconds** while `phase === 'open'`
- Response: `{ displayedSold: number, totalSlots: number, isSoldOut: boolean }`
- Renders the returned value directly — no local computation, no local timer for this
- Stops polling when `isSoldOut === true`

#### `windowOpenAt` computation (server-side)

The server imports `getNextWindowOpen()` and `getPhase()` from `src/lib/xsed/window.ts` — the same module used by the client. Both sides use UTC, so they always agree on whether the window is open.

`windowOpenAt` is the most recent Sunday at 19:00 UTC. For a request arriving on Monday at 01:00 UTC, `windowOpenAt` is the previous day (Sunday 19:00 UTC) because the window is still open until 02:00 UTC.

> **Note:** A future iteration can attach a specific `windowOpenAt` timestamp to the Experience record if per-drop control is needed. For v1, it is derived from the calendar.

### Component changes required

`CountDown` component (`src/components/app/xsed/CountDown.tsx`) currently receives a static `targetDate: string` prop from the server. This needs to change:

- Remove `targetDate` prop — the component derives the target client-side
- Add `phase: 'waiting' | 'open'` to internal state, initialized via `getPhase()` on mount
- On tick reaching 0: re-run `getPhase()` and `getCountdownTarget()` to transition state
- Add `decrementTimer` state (seconds) — only active during `OPEN` phase
- Add `displayedSold` state — initialized from `soldCount` prop plus elapsed decrements (see re-hydration above)
- Poll real purchase count every 60 seconds when `OPEN`; requires a `dropSlug` prop to know which drop to poll
- Expose `phase` to parent via callback prop `onPhaseChange?: (phase: 'waiting' | 'open') => void` so the parent can conditionally render the CTA or form
- The `useForm` prop (renders `XsedNotifyForm` vs CTA button) should now be derived from `phase === 'waiting'` by the parent, not hardcoded

### Two-layer access control

The booking window is enforced at two independent levels. The client layer is UX. The server layer is the real gate — it cannot be bypassed.

---

#### Layer 1 — Client (UX guard)

The CTA button on the landing page and drops page is **disabled** when `getPhase() === 'waiting'` and **enabled** when `'open'`. The button state is derived from the `Intl` timezone check on every render and on every second tick of the countdown.

If someone navigates directly to `/xsed/book` by typing the URL, they still hit Layer 2.

---

#### Layer 2 — Server (hard gate on `/xsed/book`)

`/xsed/book` is a **server component**. On every request it:

1. Reads the `x-country` header injected by Netlify's CDN — a 2-letter ISO country code (e.g. `AR`, `MX`, `CO`). No external API or library needed.
2. Maps the country code to its IANA timezone using a static lookup table.
3. Checks whether it is currently Sunday 16:00–20:00 in that timezone (same `isLocalWindowOpen(tz)` logic from `window.ts`, but running on the server with the server clock).
4. If the check **fails** → renders the `XsedUnavailablePage` component inline (no redirect — avoids a round trip and prevents URL manipulation tricks).
5. If the check **passes** → renders the normal booking form.

```ts
// src/app/[locale]/xsed/book/page.tsx (server component)

import { headers } from 'next/headers';
import { countryToTimezone } from '@/lib/xsed/country-tz';
import { isLocalWindowOpen } from '@/lib/xsed/window';
import { XsedUnavailablePage } from '@/components/app/xsed/XsedUnavailablePage';
import { XsedBookClient } from '@/components/app/xsed/XsedBookClient';

export default async function XsedBookPage() {
  const country = headers().get('x-country') ?? '';
  const tz = countryToTimezone(country);           // returns null if country not in LATAM list
  const windowOpen = tz ? isLocalWindowOpen(tz) : false;

  if (!windowOpen) return <XsedUnavailablePage />;
  return <XsedBookClient />;
}
```

#### `countryToTimezone` lookup

```ts
// src/lib/xsed/country-tz.ts
// Maps ISO 3166-1 alpha-2 country codes to a representative IANA timezone.
// Multi-timezone countries (BR, MX) use their most-populated zone;
// the Intl check on the server uses server clock in that zone.

export const COUNTRY_TZ: Record<string, string> = {
  AR: 'America/Argentina/Buenos_Aires',
  BO: 'America/La_Paz',
  BR: 'America/Sao_Paulo',
  CL: 'America/Santiago',
  CO: 'America/Bogota',
  CR: 'America/Costa_Rica',
  CU: 'America/Havana',
  DO: 'America/Santo_Domingo',
  EC: 'America/Guayaquil',
  SV: 'America/El_Salvador',
  GT: 'America/Guatemala',
  HT: 'America/Port-au-Prince',
  HN: 'America/Tegucigalpa',
  JM: 'America/Jamaica',
  MX: 'America/Mexico_City',
  NI: 'America/Managua',
  PA: 'America/Panama',
  PY: 'America/Asuncion',
  PE: 'America/Lima',
  PR: 'America/Puerto_Rico',
  UY: 'America/Montevideo',
  VE: 'America/Caracas',
};

export function countryToTimezone(country: string): string | null {
  return COUNTRY_TZ[country.toUpperCase()] ?? null;
}
```

> Multi-timezone countries (Brazil has UTC-2 to UTC-5, Mexico has UTC-5 to UTC-8) use a single representative timezone. A user in Hermosillo (UTC-7) whose IP resolves to `MX` will be validated against `America/Mexico_City` (UTC-6) — a 1-hour discrepancy. Acceptable for v1; can be refined with a more precise IP→timezone lookup later if needed.

#### `XsedUnavailablePage` component

Shown when the server gate blocks access. Renders in place of the booking form — same URL, no redirect.

Content:
- Hero image (same as `/xsed/book`)
- Heading: "Este DROP está agotado" / "This DROP is sold out"
- Subtext: "Los drops de XSED se abren los domingos de 16 a 20hs." / "XSED drops open every Sunday from 4pm to 8pm."
- CTA: "Avisame del próximo" / "Notify me" → opens `XsedNotifyForm`
- Secondary link: back to `/xsed/drops`

This page does **not** reveal whether the real reason is "window closed" or "actually sold out" — both surface the same message intentionally.

---

## 2. Current State

### Already built
- Public landing page (`/xsed`) with countdown and email signup
- Drop catalog page (`/xsed/drops`) with pagination
- Drop detail pages (`/xsed/drops/[slug]`)
- Booking form (`/xsed/book`) — origin city + pax only
- Checkout integration — creates a `TripRequest` and routes to Stripe
- Email notification signup and admin list view
- DB schema for `Experience` (XSED type) and `XsedNotificationSignup`
- Seed data for local dev
- Full i18n (ES/EN)

### Not yet built (this spec)
- Admin drop management (create / edit / publish drops)
- Drop selection UI — user picks which drop to book
- Drop assignment to trip request
- Capacity enforcement (maxSpots / soldOut)
- Reveal workflow (email + WhatsApp 48h before)
- Cancellation and rebooking
- Admin drop operations dashboard

---

## 3. Data Model

All drops are stored as `Experience` records with `type = 'XSED'`. No new model is needed.

### Relevant fields

| Field | Type | Notes |
|-------|------|-------|
| `slug` | `String?` @unique | URL-safe ID, e.g. `xsed-baires-001`. Required for XSED. |
| `titleInternal` | `String?` | Internal label for admin UI only |
| `teaser` | `String` | Public short description shown on cards |
| `heroImage` | `String` | Cloudinary or Netlify Blobs URL |
| `destinationCity` | `String` | Hidden until reveal |
| `destinationCountry` | `String` | Hidden until reveal |
| `tripDate` | `DateTime?` | Saturday departure date |
| `revealAt` | `DateTime?` | Must be 48h before `tripDate` |
| `basePrice` | `Float` | Always `250` USD |
| `currency` | `String` | Always `"USD"` |
| `maxSpots` | `Int?` | Max bookings allowed |
| `minSpots` | `Int?` | Min bookings for drop to run |
| `status` | `ExperienceStatus` | `DRAFT \| ACTIVE \| INACTIVE \| ARCHIVED` |
| `hotels` | `Json?` | Array of `{ type: 'ACCOMMODATION', title, description, images[] }` |
| `activities` | `Json?` | Array of `{ type: 'ACTIVITY'\|'DINNER', title, description, images[] }` |
| `revealCopy` | `String?` | Text shown at reveal (destination + instructions) |
| `preRevealCopy` | `String?` | Text shown before reveal ("trust the process" etc.) |
| `packingHints` | `String?` | Packing list shown at reveal |
| `accessibilityNotes` | `String?` | Public pre-reveal info |
| `safetyNotes` | `String?` | Public pre-reveal info |
| `cancellationPolicy` | `String?` | Shown on detail page |
| `weatherPolicy` | `String?` | Shown on detail page |
| `whatsappMessageTemplate` | `String?` | Template with `{{name}}`, `{{destination}}`, `{{date}}` placeholders |
| `adminNotes` | `String?` | Internal only |
| `supplierNotes` | `String?` | Internal only |
| `isFeatured` | `Boolean` | Surface on landing page grid |

### TripRequest linkage

A `TripRequest` for a drop must store:
- `type = 'xsed'`, `level = 'xsed'`
- `experienceId` = the `Experience.id` of the booked drop
- `startDate` = drop's `tripDate`
- `pax` = number of travelers
- `originCity`, `originCountry`

The existing `experienceId` FK on `TripRequest` handles this — no schema changes needed.

---

## 4. User Stories & Acceptance Criteria

---

### US-01 · Browse and select a drop to book

**As a client**, I want to choose which drop I'm booking so I know the date and price before paying.

**User journey:**
1. Client visits `/xsed/book`
2. Page shows upcoming ACTIVE drops (those with `tripDate` in the future and `status = ACTIVE` and available spots)
3. Client selects a drop (date, teaser visible; destination hidden)
4. Client enters origin city/country and pax
5. Client clicks "Book" → trip request created with `experienceId` → redirected to checkout

**Acceptance criteria:**
- [ ] Drop selector shows: trip date (formatted), teaser, spots remaining, price
- [ ] Drops sorted ascending by `tripDate`
- [ ] Sold-out drops (booked count ≥ `maxSpots`) shown but disabled with "Sold out" badge
- [ ] Drops whose `tripDate` is in the past are not shown
- [ ] Origin city/country and pax fields are only enabled after a drop is selected
- [ ] CTA label changes to "Secure my spot — $250 per person" with total shown (pax × $250)
- [ ] `POST /api/trip-requests` payload includes `experienceId`
- [ ] If no upcoming drops exist, show empty state: "No drops scheduled — sign up to be notified"

**Edge cases:**
- Drop sells out between page load and form submission → API returns 409; UI shows "This drop just sold out" and refreshes the list
- User submits without selecting a drop → inline validation "Please select a drop"
- Pax = 0 → not allowed; minimum 1

---

### US-02 · Spot capacity enforcement

**As the platform**, I want each drop to enforce its max spot limit so we don't overbook.

**Acceptance criteria:**
- [ ] `POST /api/trip-requests` (when `type = 'xsed'`) checks current confirmed booking count for `experienceId`
- [ ] Confirmed = TripRequests with `status IN (PENDING_PAYMENT, CONFIRMED, REVEALED, COMPLETED)` for that experienceId
- [ ] If `confirmedCount >= maxSpots` → return `{ error: 'DROP_SOLD_OUT' }` with HTTP 409
- [ ] Booking creation is atomic: count check and record creation in one Prisma transaction
- [ ] Admin can override capacity via the admin panel (see US-08)

---

### US-03 · Destination reveal

**As a client who has booked a drop**, I want to see the destination and itinerary exactly 48 hours before my trip so I can prepare.

**User journey:**
1. Client visits their booking at `/dashboard` or via reveal link in email
2. Before `revealAt`: countdown is shown + `preRevealCopy` + packing hints teaser
3. At `revealAt`: destination city/country + `revealCopy` + full `packingHints` are shown
4. `TripRequest.status` is updated to `REVEALED` by a scheduled job

**Acceptance criteria:**
- [ ] Reveal is controlled by comparing `now()` with `Experience.revealAt`
- [ ] If `now() < revealAt`: show countdown, `preRevealCopy`, access/safety notes, and "Packing list coming soon"
- [ ] If `now() >= revealAt`: show destination city+country, `revealCopy`, `packingHints`, and WhatsApp contact link
- [ ] Reveal state is rechecked on page load (no stale cache)
- [ ] `TripRequest.status` is set to `REVEALED` when the reveal email is sent (see US-04)
- [ ] If drop is CANCELLED: show cancellation message and refund timeline

---

### US-04 · Reveal email (automated)

**As a client**, I want to receive an email 48 hours before my trip with the destination and key information.

**Trigger:** Scheduled job or webhook fires when `now() >= Experience.revealAt` for each confirmed booking of that drop.

**Acceptance criteria:**
- [ ] Email sent to each client with `TripRequest.status = CONFIRMED` for the drop
- [ ] Email contains: destination city/country, `revealCopy`, `packingHints`, trip date, tripper contact
- [ ] `TripRequest.status` updated to `REVEALED` after email is sent
- [ ] `TripRequest.destinationRevealedAt` stamped with send timestamp
- [ ] Email is sent once per booking (idempotent — if job retries, don't resend)
- [ ] Sent via Resend; uses locale-appropriate template (ES or EN based on user locale preference)

**Edge cases:**
- Reveal fails to send → log error, do NOT mark as REVEALED; retry next job run
- Client has no email → skip reveal email; still mark status via WhatsApp path

---

### US-05 · WhatsApp notification

**As an admin/tripper**, I want to send the WhatsApp reveal message to clients in bulk using a template.

**Acceptance criteria:**
- [ ] Admin panel shows all bookings for a drop with a "Send WhatsApp" action per booking
- [ ] "Send All WhatsApp" bulk action triggers the template for all CONFIRMED bookings of that drop
- [ ] Template substitutes `{{name}}`, `{{destination}}`, `{{date}}`, `{{packingHints}}`
- [ ] WhatsApp link opens `https://wa.me/{phone}?text={encodedMessage}` in a new tab (manual send; no API integration required in v1)
- [ ] Admin can copy the pre-filled message to clipboard as fallback

**Out of scope for v1:** Automated WhatsApp API sending.

---

### US-06 · Post-trip feedback

**As a client who completed a XSED trip**, I want to leave feedback so other travelers can benefit.

**Trigger:** `TripRequest.status = COMPLETED` (manually set by admin after trip date passes).

**Acceptance criteria:**
- [ ] Feedback form available from client dashboard for COMPLETED XSED trips
- [ ] Fields: overall rating (1–5 stars), title (optional), written feedback (optional), trip photos upload (optional)
- [ ] Submission writes to `TripRequest.customerRating`, `TripRequest.customerFeedback`, `TripRequest.tripPhotos`
- [ ] Submitted feedback appears in admin review queue (same flow as regular reviews)
- [ ] Approved feedback displayed in the drop's detail page testimonials section (via `getXsedDropTestimonials`)

---

### US-07 · Cancellation and refund

**As a client**, I want to cancel my drop booking up to N days before the trip and receive a refund per the cancellation policy.

**Acceptance criteria:**
- [ ] Cancel action available in client dashboard for XSED trips with `status = CONFIRMED`
- [ ] Cancel button disabled and policy text shown if within non-refundable window
- [ ] Cancellation policy defined per drop (`Experience.cancellationPolicy`) and shown before confirming
- [ ] On confirm: `TripRequest.status → CANCELLED`
- [ ] Refund initiated via `POST /api/stripe/refund` (full or partial based on policy)
- [ ] Client receives cancellation confirmation email
- [ ] Cancelled spot is freed: confirmed count for that drop decreases, making it bookable again

**Cancellation windows (default policy):**
- > 7 days before trip: full refund
- 3–7 days: 50% refund
- < 3 days: no refund

---

## 5. Admin Features

---

### US-08 · Create and edit a drop

**As an admin**, I want to create and publish XSED drops without touching the database directly.

**Route:** `/dashboard/admin/xsed/new` and `/dashboard/admin/xsed/[id]/edit`

**Form fields:**

| Field | Input type | Notes |
|-------|-----------|-------|
| Internal title | Text | Not shown publicly |
| Public teaser | Textarea | 1–2 sentences |
| Hero image | File upload | Via Netlify Blobs |
| Destination city | Text | Hidden until reveal |
| Destination country | Text | Hidden until reveal |
| Trip date | Date picker | Saturday only enforced |
| Reveal at | DateTime | Auto-calculated as tripDate − 48h; editable |
| Max spots | Number | Default: 10 |
| Min spots | Number | Default: 2 |
| Base price | Number | Default: 250, currency USD |
| Slug | Text | Auto-generated from date + city; editable |
| Status | Select | DRAFT / ACTIVE / INACTIVE / ARCHIVED |
| Pre-reveal copy | Rich text | Shown before reveal |
| Reveal copy | Rich text | Shown at reveal |
| Packing hints | Rich text | Shown at reveal |
| Accessibility notes | Textarea | Public, shown pre-reveal |
| Safety notes | Textarea | Public, shown pre-reveal |
| Cancellation policy | Textarea | Public |
| Weather policy | Textarea | Public |
| WhatsApp template | Textarea | `{{name}}`, `{{destination}}`, `{{date}}` placeholders |
| Benefits (hotels) | JSON editor or structured input | Array of benefit objects |
| Benefits (activities) | JSON editor or structured input | Array of benefit objects |
| Featured | Toggle | Surface on landing grid |
| Admin notes | Textarea | Internal only |
| Supplier notes | Textarea | Internal only |

**Acceptance criteria:**
- [ ] `POST /api/admin/xsed` creates a new Experience record with `type = 'XSED'`
- [ ] `PUT /api/admin/xsed/[id]` updates all editable fields
- [ ] Slug is validated as unique and URL-safe (lowercase, hyphens only)
- [ ] If slug conflicts, form shows inline error: "This slug is already taken"
- [ ] Reveal date is auto-populated as `tripDate − 48h` when trip date is selected; admin can override
- [ ] Preview link opens `/xsed/drops/[slug]` in a new tab (works even in DRAFT status if admin is authed)
- [ ] Status change to ACTIVE triggers notification email to XsedNotificationSignup list (see US-10)
- [ ] `DELETE /api/admin/xsed/[id]` only allowed when `status = DRAFT` or `status = ARCHIVED`

---

### US-09 · Admin drops list

**As an admin**, I want to see all drops in one table so I can manage the pipeline.

**Route:** `/dashboard/admin/xsed`

**Table columns:**
- Drop date (tripDate)
- Internal title
- Status badge
- Confirmed bookings / max spots
- Revenue (confirmed bookings × basePrice × avg pax)
- Actions: Edit, View Public, Archive

**Acceptance criteria:**
- [ ] `GET /api/admin/xsed` returns all drops with booking count and revenue
- [ ] Table sorted by `tripDate` descending by default
- [ ] Filter by status (All / DRAFT / ACTIVE / INACTIVE / ARCHIVED)
- [ ] Clicking a row opens the edit form
- [ ] "Archive" action sets `status = ARCHIVED` (confirmation dialog required)
- [ ] "New Drop" button routes to create form

---

### US-10 · Notification campaign

**As an admin**, I want to send an email blast to the notification list when a new drop goes live.

**Trigger:** Manual button in admin, OR automatic when drop status changes to `ACTIVE`.

**Acceptance criteria:**
- [ ] "Notify subscribers" button on the drop detail in admin
- [ ] Button is disabled after first send (idempotent — one campaign per drop)
- [ ] Email contains: teaser, trip date, price, CTA link to `/xsed/book?drop=[slug]`
- [ ] Email sent via Resend to all `XsedNotificationSignup` entries
- [ ] Admin sees count: "Email sent to N subscribers"
- [ ] If automatic trigger (status → ACTIVE), email fires only if admin confirms the prompt

---

### US-11 · Admin drop bookings panel

**As an admin**, I want to see all bookings for a specific drop to manage fulfillment.

**Route:** `/dashboard/admin/xsed/[id]/bookings`

**Panel content:**
- Drop summary (date, destination, spots used/total)
- Bookings table: client name, email, pax, origin, payment status, booking status
- Per-booking actions: View trip request, Send WhatsApp, Mark COMPLETED
- Bulk actions: Send all WhatsApp, Mark all COMPLETED, Export CSV

**Acceptance criteria:**
- [ ] `GET /api/admin/xsed/[id]/bookings` returns all TripRequests for that experienceId
- [ ] Table filterable by status (CONFIRMED / REVEALED / COMPLETED / CANCELLED)
- [ ] "Mark COMPLETED" sets `TripRequest.status = COMPLETED`
- [ ] "Mark COMPLETED" disabled if trip date has not yet passed
- [ ] Booking count displayed as `{confirmed}/{maxSpots}` with progress bar
- [ ] Export CSV includes: name, email, phone, origin city, pax, payment total, status

---

### US-12 · Drop capacity override

**As an admin**, I want to increase or decrease a drop's max spots after publishing.

**Acceptance criteria:**
- [ ] Max spots field editable on the edit form at any status
- [ ] If new max < current confirmed count → show warning: "You have {n} confirmed bookings. Setting max to {m} will not cancel existing bookings but will block new ones."
- [ ] Confirm required before saving
- [ ] Change reflected immediately in booking capacity check (US-02)

---

## 6. API Endpoints to Build

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/xsed/drops` | Already built. Add `?upcoming=true` filter |
| `POST` | `/api/trip-requests` | Already built. Needs `experienceId` + capacity check for XSED type |

### Admin

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/xsed` | List all drops with booking counts |
| `POST` | `/api/admin/xsed` | Create a new XSED drop |
| `GET` | `/api/admin/xsed/[id]` | Get single drop with full fields |
| `PUT` | `/api/admin/xsed/[id]` | Update drop |
| `DELETE` | `/api/admin/xsed/[id]` | Delete drop (DRAFT/ARCHIVED only) |
| `GET` | `/api/admin/xsed/[id]/bookings` | List bookings for a drop |
| `POST` | `/api/admin/xsed/[id]/notify` | Send notification campaign |
| `POST` | `/api/admin/xsed/[id]/reveal` | Trigger reveal for all CONFIRMED bookings |
| `POST` | `/api/admin/xsed/[id]/complete` | Mark all REVEALED bookings as COMPLETED |

### Internal (job/webhook, no UI)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/internal/xsed/reveal` | Scheduled job: reveal all drops whose `revealAt <= now()` |

---

## 7. Component Plan

### New components to build

| Component | Route | Purpose |
|-----------|-------|---------|
| `DropSelector` | `/xsed/book` | Card list of upcoming drops; selectable |
| `DropSelectorCard` | `/xsed/book` | Single drop card with date, teaser, spots, price |
| `AdminXsedList` | `/dashboard/admin/xsed` | Drops table with status badges and actions |
| `AdminXsedForm` | `/dashboard/admin/xsed/new` and `edit` | Create/edit form |
| `AdminXsedBookingsTable` | `/dashboard/admin/xsed/[id]/bookings` | Bookings panel |
| `AdminXsedWhatsAppPanel` | `/dashboard/admin/xsed/[id]/bookings` | WhatsApp send interface |
| `XsedRevealCard` | Client dashboard / reveal page | Pre/post reveal UI with countdown |
| `XsedFeedbackForm` | Client dashboard | Post-trip feedback form |
| `XsedCancelModal` | Client dashboard | Cancellation confirmation with policy display |

### Components to update

| Component | Change |
|-----------|--------|
| `XsedBookClient` | Add drop selector step before origin/pax |
| `CountDown` | Accept `revealAt` prop instead of hardcoded next weekend |
| `DropCard` | Add "Sold out" badge state |

---

## 8. i18n Keys to Add

Add to both `src/dictionaries/es.json` and `src/dictionaries/en.json`:

```json
"xsedBook": {
  "dropSelector": {
    "heading": "Choose your drop",
    "spotsRemaining": "{n} spots left",
    "soldOut": "Sold out",
    "noDrops": "No drops scheduled",
    "noDropsCta": "Sign up to be notified"
  },
  "cta": "Secure my spot — $250 per person",
  "total": "Total: ${n} USD",
  "soldOutError": "This drop just sold out. Please choose another.",
  "noDropSelected": "Please select a drop to continue"
},
"xsedReveal": {
  "preReveal": {
    "heading": "Your trip is almost here",
    "subheading": "The destination will be revealed in",
    "packingTeaser": "Packing list coming soon"
  },
  "postReveal": {
    "heading": "Your destination is",
    "packingLabel": "What to pack"
  },
  "cancelled": {
    "heading": "This drop was cancelled",
    "refundNote": "Your refund is being processed"
  }
},
"xsedFeedback": {
  "heading": "How was your trip?",
  "ratingLabel": "Overall rating",
  "titleLabel": "Give it a title (optional)",
  "contentLabel": "Tell us about it (optional)",
  "photosLabel": "Add photos (optional)",
  "submit": "Submit feedback",
  "success": "Thanks for sharing!"
},
"xsedCancel": {
  "heading": "Cancel your booking?",
  "policy": "Cancellation policy",
  "refundInfo": "You are eligible for a {pct}% refund",
  "noRefundInfo": "This booking is non-refundable",
  "confirm": "Yes, cancel my booking",
  "abort": "Keep my booking",
  "success": "Your booking has been cancelled"
}
```

---

## 9. Implementation Order

Recommended sequence to minimize blocking dependencies:

1. **API: `POST /api/admin/xsed` and `GET/PUT /api/admin/xsed/[id]`** — drop CRUD
2. **UI: Admin drop list and form** (`AdminXsedList`, `AdminXsedForm`) — enables content entry
3. **UI: Drop selector on `/xsed/book`** (`DropSelector`, `DropSelectorCard`) — enables client booking
4. **API: Capacity check in `POST /api/trip-requests`** — prevents overbooking
5. **UI: Reveal card on client dashboard** (`XsedRevealCard`) — client-facing reveal UX
6. **API: Reveal trigger (`POST /api/admin/xsed/[id]/reveal`)** — admin manual reveal + email
7. **API: Notification campaign (`POST /api/admin/xsed/[id]/notify`)** — subscriber emails
8. **UI: Admin bookings panel** (`AdminXsedBookingsTable`, `AdminXsedWhatsAppPanel`)
9. **UI: Post-trip feedback form** (`XsedFeedbackForm`)
10. **UI: Cancellation flow** (`XsedCancelModal`)

---

## 10. Out of Scope (v1)

- Automated WhatsApp API sending (manual link-based only)
- Rebooking / transferring a booking to a different drop
- Group discounts or dynamic per-drop pricing
- Tripper-managed drops (admin-only in v1)
- Analytics dashboard for XSED revenue
- Waitlist per drop (global notification list only)
