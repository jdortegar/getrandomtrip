# Verification Report: admin-dashboard-layout-parity

**Verdict: PASS WITH WARNINGS**

Verified all 5 commits on `develop` (`0063bc06`, `89e2ebfa`, `83ff8e8c`, `d9d72355`, `b99e7f51`) against `proposal.md`, `specs/dashboard-shell/spec.md`, `specs/admin-dashboard-overview/spec.md`, `design.md`, and `tasks.md` by reading the actual current source, not the docs' self-description.

## Independently Reproduced Evidence

- `npm run typecheck`: clean, 0 errors.
- `npm run test`: **227 passed / 6 failed / 233 total** — exact match to the last commit's claim. Confirmed via `git log` that the 6 failing tests (`src/lib/xsed/__tests__/notifications.test.ts` x2, `src/app/api/admin/xsed/__tests__/route.test.ts` x4) belong to files last touched in pre-existing commits (`37c3a129`, `9c5408c6`) predating this change; none of the 5 admin-dashboard-layout-parity commits touch `src/lib/xsed/notifications.ts` or `src/app/api/admin/xsed/route.ts`. Confirmed unrelated to this change.

## Spec Compliance — `dashboard-shell`

- `AdminSidebar` grep in `src/` returns empty. `AdminKPICard.tsx` confirmed absent from `HEAD` (`git show HEAD:...` fails) and no remaining references in `src/`.
- `buildAdminNavTabs()` (`src/components/app/dashboard/config/adminNav.ts`) returns exactly 10 tabs: dashboard, tripRequests, users, experiences, payments, reviews, waitlist, xsed, xsedNotifications, notifications (`audience: "ADMIN"`, `showUnreadDot: true`). `adminNav.test.ts` asserts `toHaveLength(10)`. Matches the spec's corrected "10 admin destinations" scenario.
- Notifications tab end-to-end confirmed: `admin/notifications/page.tsx` queries `audience: "ADMIN"`; `resolveAdminNotificationHref()` exists in `src/lib/helpers/notificationHrefs.ts` mapping `reviewId`→reviews, `tripRequestId`→trip-requests, `experienceId`→experiences; `unread-count/route.ts` explicitly whitelists `"ADMIN"` as a valid audience value (confirmed fix from the old silent default-to-`"TRIPPER"` bug).

## Spec Compliance — `admin-dashboard-overview`

- `src/lib/admin/overview.ts`: all 7 queries match `design.md` exactly, INCLUDING `currency: "USD"` filter on the payment aggregate (confirmed present in the actual `where` clause, not just claimed in a comment).
- `AdminHomeContent.tsx`: read full JSX — `statCards` and `pendingRows` arrays are unconditionally mapped with no `.length > 0` guards; all 4 KPI cards and all 3 pending rows always render, including at zero. Confirmed "never hidden" behavior against real code.
- Admin-only access: `admin/layout.tsx` → `StrictDashboardLayout(requiredRole="admin", shellRole="admin")`. `StrictDashboardLayout.tsx` redirects unauthenticated users to `/${locale}/login`, and non-admin authenticated users to `getDefaultDashboardPath(roles, locale)` (role-based, not a fixed `/dashboard`) — matches the spec's mid-change correction.

## Spot-Checked 3 of 7 Migrated Pages (waitlist, payments, experiences)

- All three use documented table anatomy (`rounded-xl border border-gray-200 ... overflow-hidden` + `overflow-x-auto`, `thead bg-gray-50` + `text-[11px] uppercase tracking-wider`, `tbody divide-y divide-gray-50`, `hover:bg-gray-50` rows), `Section`/`rt-container text-left` at the `page.tsx` level, eyebrow+heading pattern.
- Payments correctly keeps `StatusBadge variant="payment"` (not `ExperienceStatusBadge`) per design's documented decision.
- Experiences uses `ExperienceStatusBadge` + `ExperienceTypePills` + `TableIconButton`/`TableIconLink` as documented.

## Regression Fixes Confirmed in Final Code

- Waitlist and xsed-notifications delete buttons: both show `<Loader2 className="h-4 w-4 animate-spin" />` while `deletingId === entry.id`, not just a disabled state — confirmed in `AdminWaitlistPageClient.tsx` and `AdminXsedNotificationsPageClient.tsx`.
- `AdminExperiencesPageClient.tsx` pending-detection (`pendingCount`, `visible` filter, and per-row `isPending`) all check `status === "PENDING_REVIEW" || status === "PENDING_TRIPPER_REVIEW"` — confirmed in 3 separate places in the file, not just one.

## i18n

- `adminPages.home.{eyebrow,heading,stats.*,pending.*}` present with identical key sets in both `es.json` and `en.json`.

## WARNING Findings

1. **Pending-actions "experiences" row count/link mismatch**: `overview.ts` counts only `Experience.status = PENDING_REVIEW` for the KPI count shown on the home page, but the link target (`/dashboard/admin/experiences`, relying on the page's default "pending" tab) shows a broader set — `PENDING_REVIEW` OR `PENDING_TRIPPER_REVIEW`. A user clicking through will likely see more rows than the count implied. Not a spec-breaking regression (the count itself is correct per spec), but the "filtered to show only items matching that category's criteria" language is only approximately satisfied. Documented in `tasks.md` 5.5 as a conscious tradeoff, not a silent bug.
2. **Pending-actions "reviews" row has zero filtering**: `AdminReviewsPageClient` has no tab/filter mechanism at all today (confirmed by reading the file — no `tab`/`filter`/`status` state). The pending-actions link to `/dashboard/admin/reviews` therefore does not pre-filter to `isApproved = false` as literally required by the `admin-dashboard-overview` spec's "Pending Actions Panel" requirement. This is a disclosed, deliberate out-of-scope decision (`tasks.md` 5.5), not a hidden gap, but it is a literal partial non-compliance with the spec text for that one category.
3. Two items already logged in `tasks.md`'s "Known Deferred Items" (duplicate admin auth check per request; 3x `adminNav`/`adminHeadings` config duplication) were independently reproduced as still present and correctly classified as accepted tradeoffs, not regressions — no new action needed.

## No CRITICAL Findings

All 5 slices' core spec requirements (shell swap, notifications tab, overview stats accuracy including the USD currency guard, zero-state rendering, admin-only access with role-based redirect, `AdminKPICard` deletion, regression fixes for delete-spinner and pending-status detection) are implemented and verified against real code and passing tests.

## Test/Typecheck Summary

- `npm run typecheck`: PASS (0 errors)
- `npm run test`: 227/233 passing, 6 pre-existing unrelated xsed failures (confirmed via `git log` unrelated to this change)

**Next recommended**: `sdd-archive` (no CRITICAL blockers; the 2 WARNINGs are disclosed, low-severity, documentation-worthy scope notes suitable for the archive report rather than a blocking re-apply).
