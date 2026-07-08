# Tasks: Admin Dashboard Layout Parity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1470 (per design.md File Changes table; slice subtotals: 1≈370, 2≈300, 3≈350, 4≈300, 5≈260) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (infra) → PR 2 (simple sections) → PR 3 (users+trip-requests) → PR 4 (experiences) → PR 5 (overview) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (confirmed with user) |

Decision needed before apply: Resolved — stacked-to-main confirmed
Chained PRs recommended: Yes
Chain strategy: stacked-to-main — each slice ships as its own develop→main PR, merged before the next slice starts
400-line budget risk: High

Task-level detail does not change design.md's per-slice estimates meaningfully — slice 1's file list (union widening, 2 new configs, layout rewrite, 4 deletions, page moves, dict changes) matches its ~370-line subtotal; slice 5's new query-param-initial-filter subtask (5.5/5.6, touching 3 already-migrated list pages) is genuinely new behavior but small (~20-40 lines across 3 files), already inside design's ~260 estimate for slice 5.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shell/nav infra + route swap + dict scaffolding (blocking) | PR 1 | Base: main (or tracker branch, pending chain_strategy). All other units depend on this. |
| 2 | Migrate waitlist, payments, reviews, xsed-notifications | PR 2 | Independent of units 3–4; depends only on PR 1 |
| 3 | Migrate users + trip-requests + their 3 modals; delete `AdminKPICard` | PR 3 | Depends only on PR 1; independent of PR 2 |
| 4 | Migrate experiences list + review detail | PR 4 | Depends only on PR 1; independent of PR 2/3 |
| 5 | New overview home page + query-param initial filters on units 2–4's pages | PR 5 | Depends on PR 1 (dict/layout) and on units 2–4 already landed (links target their migrated pages) |

---

## Phase 1: Shell & Nav Infra (Slice 1 — blocking)

- [x] 1.1 Widen role union to include `"admin"` in `DashboardRoleShell.tsx`, `DashboardPageHeading.tsx`, `StrictDashboardLayout.tsx` (`shellRole`) — additive only, don't touch `"client"`/`"tripper"` branches
- [x] 1.2 Create `config/adminNav.ts` with `buildAdminNavTabs(copy, locale)` — 10 tabs (dashboard, tripRequests, users, experiences, payments, reviews, waitlist, xsed→`/xsed` (redirects to `/xsed/new`, fixed post-review so the tab correctly stays active on the edit route too), xsedNotifications, notifications)
- [x] 1.3 Create `config/adminHeadings.ts` with `resolveAdminPageHeading(pathname, copy)` covering all 11 heading keys (home, tripRequests, users, experiences, experiencesDetail, payments, reviews, waitlist, xsedNotifications, xsedNew, notifications)
- [x] 1.4 Rewrite `admin/layout.tsx` to render `StrictDashboardLayout(requiredRole="admin", shellRole="admin")`; keep `export const dynamic = "force-dynamic"`
- [x] 1.5 Delete `(shell)/layout.tsx`, `AdminLayoutClient.tsx`, `components/app/admin/AdminSidebar.tsx`, `AdminSidebarLink.tsx`
- [x] 1.6 Move `(shell)/*` pages up one level into `admin/`; fix relative imports broken by the move (`../../` → `../`)
- [x] 1.7 Add missing `admin/trip-requests/page.tsx` (interim: root `admin/page.tsx` now redirects to `/dashboard/admin/trip-requests` since slice 5's real overview page hasn't landed yet — see Deviations)
- [x] 1.8 Add `adminDashboard` dict section (`nav.*`, `pageHeadings.*`) to `src/dictionaries/es.json` + `en.json`; add `AdminDashboardDict` to `src/lib/types/dictionary.ts`
- [x] 1.9 Remove now-dead `adminSidebar` keys from `es.json`, `en.json`, and their type
- [x] 1.10 `npm run typecheck` — confirm client/tripper shell branches are unaffected by the union widening
- [x] 1.11 **Added post-design** (user request + discovery that `ADMIN` is already a live `NotificationAudience` with real unactioned notifications in the DB): widen `NotificationAudience`/`NotificationMetadata` types; fix `unread-count/route.ts` silently defaulting unrecognized audiences to `"TRIPPER"` (would have shown the wrong count for admin)
- [x] 1.12 Add `resolveAdminNotificationHref()`; new `admin/notifications/page.tsx` (server component, mirrors tripper's exactly) + `AdminNotificationsPageClient.tsx` wrapping the shared `RoleNotificationsPageClient`
- [x] 1.13 Wire the Notifications tab into `buildAdminNavTabs()` (`audience: "ADMIN"`, `showUnreadDot: true`); reassigned XSED-signups tab icon `Bell`→`Megaphone` to free `Bell` for the personal notifications tab, matching tripper/client's icon convention
- [x] 1.14 Tests: `resolveAdminNotificationHref` (new `notificationHrefs.test.ts` — first test coverage for this file, previously untested for all three role resolvers), updated `adminNav.test.ts`/`adminHeadings.test.ts` for the 10th tab

## Phase 2: Simple Section Migrations (Slice 2)

- [x] 2.1 Migrate `AdminWaitlistPageClient` + `page.tsx` per design.md's BEFORE/AFTER recipe (strip all `flex-1`/`overflow-hidden`/`overflow-y-auto`/`shrink-0`; `Section`/`rt-container text-left`; documented table anatomy; `TableIconButton` for delete)
- [x] 2.2 Migrate `AdminPaymentsPageClient` + `page.tsx` — same recipe; keep `StatusBadge variant="payment"`
- [x] 2.3 Migrate `AdminReviewsPageClient` + `page.tsx` — same recipe
- [x] 2.4 Migrate `AdminXsedNotificationsPageClient` + `page.tsx` — same recipe
- [ ] 2.5 Manual QA (≥360px, ≥1280px): all 4 pages render without sidebar-era scroll wrappers; tables match documented anatomy; delete actions still work — deferred to a live QA pass (no browser tool available in this session; see apply-progress note)

## Phase 3: Users + Trip-Requests + Modals (Slice 3)

- [x] 3.1 Migrate `AdminUsersPageClient` + `UsersTableRow` (row actions → `TableIconButton`) to documented table anatomy
- [x] 3.2 Restyle `UserRoleModal` — light token alignment only, no internal table to migrate
- [x] 3.3 Restyle `DeleteUserModal` — light token alignment only
- [x] 3.4 Migrate `AdminTripRequestsPageClient` to documented pattern; convert `TripRequestsKPIStrip` to the documented supporting-strip pattern; keep `StatusBadge variant="trip"`
- [x] 3.5 Restyle `TripRequestModal` — light token alignment only
- [x] 3.6 Delete `AdminKPICard` once `grep` confirms no remaining references
- [ ] 3.7 Manual QA (≥360px, ≥1280px): users table row actions work; both modals' edit/delete flows unchanged; trip-requests supporting strip shows correct counts — deferred to a live QA pass (no browser tool available in this session, same limitation as Phase 1/2)

## Phase 4: Experiences (Slice 4)

- [x] 4.1 Migrate `AdminExperiencesPageClient` + `page.tsx` to documented pattern; wire `ExperienceStatusBadge` + `ExperienceTypePills`
- [x] 4.2 Migrate `AdminExperienceReviewClient` + `page.tsx` (review detail) to documented pattern — verified no sidebar-era styling exists to migrate; see apply-progress note for details
- [ ] 4.3 Manual QA (≥360px, ≥1280px): list + review-detail layout correct; badges/pills correct; approve/reject flow unchanged — deferred to a live QA pass (no browser tool available in this session, same limitation as Phases 1-3)

## Phase 5: Overview Home Page (Slice 5)

- [x] 5.1 RED — write a failing test for the 7-query aggregation, extracted as a pure/testable function (e.g. `computeAdminOverviewStats`) asserting output shape and zero-value defaults (`_sum.amount ?? 0`)
- [x] 5.2 GREEN — implement `admin/page.tsx` server component running `Promise.all` of the 7 Prisma queries exactly as specified in design.md's "Overview Queries" section
- [x] 5.3 Create `AdminHomeContent.tsx` (presentational, no hooks) rendering 4 KPI stat cards + pending-actions panel per design.md's reference JSX; all rows/cards render even at zero, panel never collapses
- [x] 5.4 Add `home.*` dict copy (`eyebrow`, `heading`, `stats.*`, `pending.*`) to `es.json` + `en.json`; extend `AdminPagesDict` type (that's where every other admin page's copy — payments, experiences, reviews, waitlist, tripRequests — already lives; `AdminDashboardDict` is reserved for the nav-tab labels + top-nav-header title/description, a separate concern from this page's body copy)
- [x] 5.5 **Corrected scope** (verified against actual current code, not the original blanket assumption — see Deviations in apply-progress): only `AdminTripRequestsPageClient` needed new query-param-read behavior. `AdminExperiencesPageClient` already defaults to its "pending" tab with zero wiring needed (pending-action row links to `/dashboard/admin/experiences`, no query param). `AdminReviewsPageClient` has no filter/tab mechanism at all today; building one is out of scope for this slice (pending-action row links to `/dashboard/admin/reviews`, no query param, no new filter UI — accepted, documented scope limit). `AdminTripRequestsPageClient` now reads `?status=` via `useSearchParams()` on mount (approximated to `CONFIRMED`, the closest existing filter dimension to "needs destination assignment" — not exact, documented tradeoff), defaulting to the existing `"ALL"` behavior when absent; pending-action row links to `/dashboard/admin/trip-requests?status=CONFIRMED`
- [x] 5.6 RED/GREEN for 5.5 — extracted `resolveInitialStatusFilter(param)` as a pure function in `src/lib/admin/trip-status.ts`; tests cover valid status, null, unrecognized string, and empty string, all falling back to `"ALL"`
- [ ] 5.7 Manual QA (≥360px, ≥1280px): overview counts match DB exactly; zero-state renders all 4 cards + all 3 pending rows without collapsing; each pending row navigates and correctly pre-filters its target list — deferred to a live QA pass (no browser tool available in this session, same limitation as Phases 1-4)

## Phase 6: Final Quality Gate

- [x] 6.1 `npm run typecheck` (repo-wide, after all slices)
- [x] 6.2 `npm run test` (full suite — confirm new and existing tests pass)
- [x] 6.3 `npm run lint` — confirmed pre-existing repo-wide `next lint` breakage, unrelated to this change (see apply-progress note)
- [ ] 6.4 Full manual QA pass at ≥360px and ≥1280px across all 5 slices per design.md's Testing Strategy table: top nav/no sidebar, per-page layout, modal flows unchanged, overview vs. DB, pending-row deep-links, zero/empty states — deferred, no browser tool available in this session

## Known Deferred Items (from PR 1 code review)

Found during a fresh-context review of slice 1's diff before commit. The cheap, locally-scoped findings were fixed directly in PR 1 (XSED tab active-highlight regression, `resolvedShellRole` fallback not widened for admin, orphaned dead branch in `tripperHeadings.ts`, dead `TripperPageHeading`/`TripperNavTabs` components). These two are deliberately NOT fixed inline — logged here instead:

- [ ] **Duplicate admin auth check per request**: `StrictDashboardLayout` now runs its own `getServerSession`+`prisma.user.findUnique` role check on every admin page load, on top of the identical check every admin `page.tsx` already runs itself (pre-existing pattern — no shared middleware/layout guard existed before this refactor, confirmed by the spec phase). Before this diff, the old sidebar layout was client-only and never hit the DB, so this is a genuinely new duplicate round-trip per admin request. Fixing it means auditing all 9 admin `page.tsx` files individually to confirm none use the session/user data for anything beyond the role check before removing their now-redundant checks — bigger than a single-slice review fix. Follow-up task, not blocking any slice.
- [ ] **`adminNav.ts`/`adminHeadings.ts` duplicate the tripper/client config pattern a 3rd time** instead of a shared config-table-driven helper — deliberate per design.md ("mirror existing pattern" over introducing a new generic), not an oversight. Worth revisiting if a 4th dashboard role is ever added, since that's the point the duplication cost stops being negligible.
