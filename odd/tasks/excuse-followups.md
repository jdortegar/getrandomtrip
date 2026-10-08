# Excuse follow-ups

## Objective

Close the follow-ups left out of PR #254 (`feat/excuse-all-levels`). Branch `feat/excuse-followups` is stacked on it.

## Scope

- Fix mismatched/broken excuse images (partial: verified replacements only).
- Localize the avoid-destinations search placeholder.
- Show the trip's excuse + refine details on the client trip detail ("Trip info" list) and as one line per tripper recent booking, through a shared `ExcuseSummary` component (user choice).
- Out: itinerary/reveal essentials strip, client trip list rows.

## Constraints

- Ask before every commit (user rule).
- New copy in es + en; types in `src/lib/types/dictionary.ts` / `src/types/`.
- Labels resolve with `resolveExcuseSelectionLabels` + `travelerTypeOf` (XSED stores the traveler type in `level`).

## Tasks

- [x] F1 Images: "Relax & Arena", "Playas y calas", "Pueblos & Caminatas" replaced with visually verified photos. Route: inline.
- [x] F2 Avoid modal `searchPlaceholder` (en "Search city...", es "Buscar ciudad..."). Route: inline.
- [x] F3 `ExcuseSummary` + client trip detail + tripper recent bookings. Route: delegated writer (2+ non-trivial files).
- [x] F4 Image audit: 161 refs audited (each viewed); 58 replaced per `~/.claude/jobs/d60af7e7/tmp/audit/report.md` (42 mismatched, 12 dead, 4 black). All 98 distinct ids return 200. Route: read-only audit agent + inline guarded apply.
- [x] F5 Excuse copy unified on neutral "tú" (10 strings in `excuses.ts`/`es.json` + XSED `excuseRequired` toast). Site-wide voseo outside excuse copy left unchanged. Route: inline.

## Progress

- F1/F2 verified: typecheck clean, lint clean, journey + data tests pass. Review declined by user for that candidate.

- F3 implemented (uncommitted, awaiting user review before ticking): `ExcuseSummary` (full/inline) + tests, client trip detail "Trip info" item + chips, tripper `getTripperRecentBookings` (+excuseKey/refineDetails/travelerType) and `RecentBookingsList` inline line in both layouts. RED observed then GREEN; vitest (130 files/1276 tests), typecheck, lint clean. No automated test for the trip detail page itself (heavy client page).

- Closing checks: typecheck + lint clean; full vitest 52 failures under load, re-run in isolation leaves only the 4 known PDF layout failures (same on `origin/develop`).

## Next step

Ask the user before committing; then PR into `feat/excuse-all-levels`.
