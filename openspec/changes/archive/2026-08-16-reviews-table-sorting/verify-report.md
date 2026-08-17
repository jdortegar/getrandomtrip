# Verification Report: reviews-table-sorting

**Mode**: Strict TDD
**Verdict**: PASS WITH WARNINGS — 0 CRITICAL, 2 WARNING, 2 SUGGESTION

## Completeness

All 8 tasks (A1-A4, B1-B3, B5) marked `[x]` in `tasks.md`, verified directly against source — no discrepancy between checkmarks and implementation.

## Build & Tests (executed, not trusted from self-report)

- `npm run typecheck` → **PASS**, 0 errors.
- `npx vitest run` → **138 files / 1022 tests passed, 0 failed** — matches apply-progress's claimed count exactly.
- `src/lib/reviews/__tests__/sort.test.ts` → 20/20 passed. Real, non-trivial assertions; the null-placement regression guard (no `nulls` key, no `tripperId` filter, both directions) is present and passing.
- New client test suites confirmed to actually execute (not just counted in the aggregate): `ReviewsPageClient.test.tsx` (4 tests) and `AdminReviewsPageClient.test.tsx` (5 tests), both behavior-based (fetch URL params, `aria-pressed`/`aria-sort`, button inventory), not smoke-only.
- `npm run lint` → could not run (pre-existing broken `next lint` invocation in this repo, unrelated to this change).

## Spec Compliance Matrix

| Requirement | Test | Result |
|---|---|---|
| Tripper sortable fields (rating, created only) | `ReviewsPageClient.test.tsx` non-goal test (exactly 2 buttons) | ✅ COMPLIANT |
| Admin sortable fields (rating, created, traveler, tripper) | `AdminReviewsPageClient.test.tsx` (4 buttons in `thead`) | ✅ COMPLIANT |
| Non-goals (status/isApproved, review, tripId not sortable) | admin thead test: no button/no `aria-sort` on the 4 non-sortable `th` | ✅ COMPLIANT |
| Null placement (native Postgres, no workaround module) | `sort.test.ts` regression guard + admin route test | ✅ COMPLIANT (mocked-level); real-DB ordering explicitly deferred to manual QA per design.md — consistent, not a gap |
| Default sort state (Created desc active on load) | both client tests assert active state + zero extra requests on first render | ✅ COMPLIANT |
| Whitelist validation + safe fallback | `sort.test.ts` + both route tests | ✅ COMPLIANT |
| Sort composes with filter/search/pagination, resets to page 1 | admin route combined test + both client combined tests | ✅ COMPLIANT |
| Sort is globally ordered, not page-scoped | No dedicated test with `total > limit` proving true global order; only that `orderBy` is passed into the same single `findMany` call carrying `skip`/`take` | ⚠️ PARTIAL — architecturally guaranteed (one query, no client-side re-sort path exists), but the literal spec scenario isn't asserted end-to-end |

## Design Coherence

- `spec.md` and `design.md` consistently reflect the "accept Postgres native null placement" correction. No leftover reference to the abandoned `review-sort-query.ts` workaround in either file's body (only present in `state.yaml`'s historical revision log, which is correct as an audit trail).
- `src/lib/reviews/sort.ts`'s `tripper` case has no `nulls` key and no `tripperId` filter — byte-for-byte match with design.md's code contract.
- Dictionary additions (`tripperReviews.sort`, `adminPages.reviews.sort`) present in both `es.json`/`en.json`, typed in `dictionary.ts`, matching design's field list exactly.

## Out-of-Band UX Fix (`hasLoadedOnce`) — Sanity Check

Confirmed via diff inspection on both `ReviewsPageClient.tsx` and `AdminReviewsPageClient.tsx`: `hasLoadedOnce` gates the full-page `<LoadingSpinner>` to first load only; refetches instead dim the body via `cn(loading && "pointer-events-none opacity-50")`. No functional regression:
- Effect dependency arrays correctly include `sortBy`/`sortOrder` (pre-existing pattern, untouched by this fix).
- No stale closures — fetch functions are freshly defined per render; tripper page retains its pre-existing `cancelled` race guard.
- Both new client test suites pass against the fixed behavior with real (not vacuous) assertions.

## Issues Found

**CRITICAL**: None.

**WARNING**:
1. Loading-dim inconsistency between surfaces: on the tripper page, the sort strip sits OUTSIDE the dimmed/`pointer-events-none` wrapper (stays clickable during refetch); on the admin page, the sortable `<th>` row sits INSIDE that wrapper (becomes non-interactive during refetch). Not spec-mandated either way, introduced by the out-of-band fix, untested. Low risk.
2. Stale test comment in `ReviewsPageClient.test.tsx` (~line 160) describes pre-fix behavior ("component swaps to `<LoadingSpinner>` during the fetch... stale DOM node") that no longer matches the current dimming-only behavior. Test still passes and the re-query pattern is harmless, but the comment's rationale is now inaccurate — cosmetic only.

**SUGGESTION**:
1. Pre-existing hardcoded Spanish strings `"Publicado"`/`"Publicar"` in `ReviewsPageClient.tsx` — confirmed NOT introduced/touched by this change (only repositioned by the new sort strip's insertion). Out of scope here; flag for a future i18n cleanup pass.
2. Working tree has unrelated uncommitted changes mixed into the same diff: `src/app/[locale]/trippers/page.tsx`, `src/app/[locale]/trippers/[tripper]/page.tsx`, `src/app/sitemap.ts` (metadata/sitemap work, unrelated to reviews sorting). Not a defect in this change, but should likely be split into a separate commit before landing.

## Final Verdict

**PASS WITH WARNINGS** — 0 CRITICAL, 2 WARNING, 2 SUGGESTION. All 8 tasks genuinely complete and test-covered; typecheck and full suite (138/1022) pass; the null-placement correction is consistently reflected across spec/design/code with no resurrected workaround module. Safe to proceed toward archive/commit once the WARNING items are acknowledged and the unrelated trippers/sitemap changes are deliberately included or excluded from the commit.
