# Feature Spec: Trip Fulfillment & Documents (Gap Analysis)

**Priority:** High — affects every confirmed trip, all experience types (XSED and main curated journeys)
**Scope:** End-to-end review of the trip lifecycle from landing page through completion, triggered by a real purchase (`TripRequest` `cmsm9gqng000009juktmb7izc`, XSED, "Córdoba sin mapa — Drop #9", Aug 15→16 2026)
**Status of `06-xsed.md`:** stale as of this review — see §0.
**Last audited:** 2026-08-10

---

## 0. Correction to `openspec/specs/06-xsed.md`

That document (last audited 2026-06-22) is out of date on two of its three CRITICAL/HIGH claims:

- ~~CRITICAL: XSED admin sidebar list page is a live 404~~ — **fixed.** `/dashboard/admin/xsed` now redirects to `/xsed/new`; drops are managed via the general Experiences admin table.
- ~~CRITICAL: wrong role guard, tripper can reach `/dashboard/admin/xsed/new`~~ — **fixed.** Server-side `requiredRole="admin"` guard confirmed in `StrictDashboardLayout`.
- ~~HIGH: Reveal flow for XSED trips shares the same broken `/reveal-destination` page — not functional~~ — **fixed, and well-built.** The dead page was deleted; a proper cron-driven reveal system now exists (`netlify/functions/destination-reveal.ts` → `POST /api/internal/destination-reveal`), with a shared countdown constant between the traveler-facing page and the cron so they can't drift out of sync. See §4 for detail — this is one of the stronger parts of the current system.

The remaining items in that doc's Gaps table were re-verified and are still accurate (see §5). That doc should be re-audited and its "Last audited" date updated to reflect this review; the two fixed items should be removed from its Gaps table.

---

## 1. The core gap: trip fulfillment content doesn't exist

**This is real and confirmed against the actual purchased trip.** There is currently no way for an admin to attach — and no way for a traveler to see — a hotel voucher, dinner reservation, activity confirmation, or a day-by-day itinerary for a trip they've booked and paid for. This is not a bug in an existing feature; the concept does not exist anywhere in the schema, the admin authoring tools, the file-upload system, or the traveler-facing UI.

**What was checked:**
- `TripRequest` and `Payment` models: no voucher/document/attachment/file field of any kind.
- `Experience` model has `hotels`, `activities`, `itinerary`, `inclusions`, `exclusions` JSON columns — but the XSED admin drop-authoring form never writes to `itinerary`/`inclusions`/`exclusions` (the tripper-experience form does have full authoring UI for these — `ItineraryStep.tsx`, `ActivitiesListStep.tsx`, `InclusionsStep.tsx` — XSED's form just never got the same fields added).
- The one traveler-facing page built to show this content (`/dashboard/trips/[id]/details`) already reads `experience.itinerary`/`.inclusions`/`.exclusions` correctly — it just always renders its "no itinerary yet" empty state, because the data is never populated for XSED drops.
- File uploads app-wide: the only upload endpoint (`/api/upload`) accepts images only (`jpeg/png/gif/webp/svg/avif`) — no PDF support exists anywhere in the app.

**For the specific purchased trip right now:** the traveler will get a correctly-timed reveal (destination name, countdown, email) around Aug 13 — but no hotel name, no dinner reservation, no packing list, no itinerary, at any point before, during, or after the trip. This is the gap the founder noticed firsthand.

### Decided content model (resolved via interview, see §6 for the design brief derived from this)

| Question | Decision |
|---|---|
| Structured data or uploaded files? | **Both.** Itinerary/schedule is structured (day-by-day, reusing the tripper-experience itinerary pattern). Vouchers/confirmations are uploaded files (real hotel/restaurant documents shouldn't be re-typed). |
| Itinerary scope | **Shared per drop/experience**, but "drop" now means a country-specific instance — this product will sell the same drop-week across multiple countries, each as its own `Experience` with its own destination/itinerary. Assignment of a trip to the correct country's drop is manual today; that's out of scope for this feature. |
| Voucher scope | **Individual per `TripRequest`.** Confirmed explicitly: parties do not share documents, there is no group/block reservation. No bulk-upload mechanism — every trip's documents are uploaded separately, even for trips going to the same hotel on the same dates. |
| Voucher categories | **Arbitrary labeled attachments**, not a fixed set (Hotel/Dinner/Activity). Admin types a free-text label per upload, repeatable. Must also carry a country tag. |
| Confirmation status | **File present = confirmed.** No separate status field to track independently of upload state. |
| File types | Must extend beyond the current images-only upload system to accept PDFs (and keep image support — some vouchers are screenshots). |
| Visibility timing | Admin can upload anytime. Traveler-facing display stays gated behind the same `REVEALED` status check already used for the destination reveal itself — everything (destination, itinerary, vouchers) surfaces to the traveler at the same T-48 moment. |
| Applies to | **All experience-based trips** — XSED and main curated journeys alike, not XSED-specific. |
| Where it lives (admin) | A new dedicated full page (not the current cramped modal) — see §2. |
| Where it lives (traveler) | Extends the existing `/dashboard/trips/[id]/details` page with a new Documents section — see §3. |

---

## 2. New admin surface: trip fulfillment page

**Replaces:** `src/components/app/admin/TripRequestModal.tsx`, currently reached as a popup from `/dashboard/admin/trip-requests`. That modal only supports status change, experience assignment, and delete — it has no room for a fulfillment workflow.

**New:** a dedicated full page at `/dashboard/admin/trip-requests/[id]`, combining:
- Everything the current modal does (status, experience assignment, core trip details, delete).
- A read-only reference view of the assigned drop's shared itinerary.
- The new per-trip document/voucher management UI (labeled uploads, country-tagged, list with view/download/remove).

**Prototype:** see §6 — design agent output pending at time of writing, link to be added once published.

---

## 3. Traveler surface: extended trip details page

**Extends:** `src/app/[locale]/(secure)/dashboard/trips/[id]/details/page.tsx` (currently shows only an empty state for almost every trip).

**New:** once the trip is `REVEALED`, this page shows the day-by-day itinerary (populated, once §2's admin flow feeds it) plus a new Documents section listing that traveler's own uploaded vouchers with view/download actions.

**Prototype:** see §6 — design agent output pending at time of writing, link to be added once published.

---

## 4. Reveal flow — confirmed working (not a gap, documented for completeness)

Since this contradicts the stale `06-xsed.md`, it's worth stating precisely what does work: a Netlify scheduled function fires hourly, runs two idempotent passes — a T-72h admin reminder (escalating to "URGENTE" if still unassigned by T-48h) and a T-48h auto-reveal (only for trips that already have an experience assigned) that flips status to `REVEALED`, stamps `destinationRevealedAt`/`actualDestination`, and sends the `DestinationRevealed` email. The traveler-facing reveal page's countdown uses the exact same 48h offset constant as the cron, so they can't drift apart. This is solid and needs no fix.

For the specific purchased trip (Aug 15→16, already has an experience assigned): expect the automated reveal to fire on schedule around Aug 13, with no admin action required, since the experience assignment already happened at booking time.

---

## 5. Other confirmed gaps (documented, no prototype needed — these are logic fixes, not new screens)

| Severity | Finding | Detail |
|---|---|---|
| HIGH | No booking-capacity enforcement | Neither `POST /api/trip-requests` nor `POST /api/stripe/payment-intent` checks `Experience.maxSpots`/existing bookings before creating a trip or charging payment. A drop can be oversold with nothing rejecting it server-side. The sold-count shown to travelers is display-only (and is partly synthetic/FOMO-inflated — see below) and enforces nothing. |
| HIGH | Admin cannot assign/reassign a destination experience to an XSED trip via the UI | Real bug, not in the original audit doc. The assign-experience dropdown in `TripRequestModal.tsx` filters by `trip.type` (`"xsed"`, lowercase, as stored on `TripRequest`), but `Experience.type` stores `"XSED"` (uppercase). Prisma's array `has` filter is exact-match, so the query always returns zero results for any XSED trip. In practice this hasn't caused visible harm yet because experience assignment happens automatically at booking time (the "current drop" is passed in), but there is currently no working admin path to fix or reassign it after the fact. Should be fixed as part of building the new admin page in §2, since that page's experience-assignment control would otherwise inherit the same bug. |
| MEDIUM | No way to see who booked a specific drop | The admin trip-requests table filters by status only — no filter by `type` or `experienceId`. Combined with the above, an admin cannot easily produce "everyone booked on Drop #9" today. |
| MEDIUM | No automation or reminder for marking a trip `COMPLETED` | The `REVEALED → COMPLETED` transition is 100% manual (an admin opens each trip and flips a dropdown by hand) with zero scheduled reminder, unlike the reveal flow which got full cron automation. This isn't XSED-specific — it affects every trip type — but matters most for a weekly-cadence product with dozens of trips per cycle. |
| LOW | Sold-count is partly synthetic | `GET /api/xsed/drops/[slug]/sold-count` adds a fabricated incrementing count on top of the real number (presumably deliberate FOMO marketing) — flagging so it isn't mistaken for real telemetry when reviewing booking numbers. |
| LOW | Slug uniqueness only enforced at the DB level | Confirmed still true per the original audit — no form-level validation, only a DB constraint caught after submission. |
| LOW | No `mailto:` / contact affordance for a traveler from the admin trip view | Email is rendered as plain text in the admin table row, not a clickable link. Small thing worth folding into the new admin page in §2 while it's being built anyway. |

---

## 6. Design brief (prototype agent briefing)

Two prototypes were commissioned from separate design-focused agent runs, each given a complete, self-contained brief derived from §1–§3 above (full content model, file references to the real design system and surrounding pages, explicit instruction to use realistic data). Rationale for splitting: the admin page is a utilitarian operations tool; the traveler page is a branded, warm "reveal moment" — different design registers, better served by focused, separate design passes than one agent context-switching between both.

- **Admin trip fulfillment page** — https://claude.ai/code/artifact/88e71b8d-eac8-4070-a803-f5cd8f8668a7
  - Trip status/experience-assignment controls, core trip facts, a danger zone (cancel/delete); a visually distinct read-only 4-day itinerary reference; and the document management section (3 sample uploads — 2 PDF, 1 image — plus an "Add a Document" panel with label, country, and drag-and-drop file input). Built directly from the real `.claude/rules/design-system.md` tokens and the actual admin status-color mapping (`src/lib/admin/trip-status.ts`). Notable choices: a page-level Save/Discard bar (replacing the old modal's footer buttons now that this is a full page), a "reveals in N days" KPI-style callout, and a neutral (non-blue) chip for the country tag so it doesn't visually collide with the existing type/level chips.
- **Traveler trip details page (Documents section)** — https://claude.ai/code/artifact/fd0b7b47-116e-45ed-8432-cde07eefe7ef
  - 3-day itinerary timeline + a new Documents section (5 sample vouchers: hotel, dinner, winery, transfer, insurance), each with view/download actions and a note that these are personal to the traveler. Uses the real brand fonts/tokens throughout. Notable choices: light-only theme (matches the app, which has no dark mode), invented (not real) hotel/restaurant names to avoid misrepresenting a real business, and English-only copy (a real build would need es/en dictionary entries per the i18n rule).

---

## 7. Recommended sequencing

1. Fix the case-mismatch bug (§5) as a prerequisite — the new admin page's experience-assignment control needs it working.
2. Build the admin fulfillment page (§2) — labeled document uploads (extend `/api/upload` for PDFs), country tagging, itinerary reference view.
3. Add itinerary/inclusions/exclusions authoring fields to the XSED admin drop form, reusing the existing tripper-experience step components (§1) — this is largely wiring existing components, not new build.
4. Extend the traveler details page (§3) — Documents section, gated behind `REVEALED` status.
5. Capacity enforcement (§5) and the admin drop-level booking filter (§5) are real but independent of the above — can be sequenced separately.
6. Completion automation/reminder (§5) is the lowest-urgency item here (manual process works, just doesn't scale gracefully) — reasonable to defer.
