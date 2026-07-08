# Proposal: Admin Dashboard Layout Parity

## Intent

The admin dashboard is architecturally isolated from tripper/client. It renders a left `AdminSidebar` (via `AdminLayoutClient` + `(shell)` route group) instead of the shared `StrictDashboardLayout` + `DashboardRoleShell` + `DashboardNavTabs` stack, and its pages use zero `design-system.md` patterns (no `Section`/`rt-container`, no eyebrow+heading, custom `AdminKPICard`/table/row-buttons, page containers built for the flex sidebar via `flex-1 overflow-hidden`). Goal: bring admin to full visual and navigational parity so all three roles share one dashboard system.

## Scope

### In Scope
- Swap admin nav shell: remove `AdminSidebar`, `AdminSidebarLink`, `AdminLayoutClient`, and the `(shell)` route group; route admin through `StrictDashboardLayout` + `DashboardRoleShell`.
- Extend `DashboardRoleShell` and `DashboardPageHeading` role union to include `"admin"`; add `buildAdminNavTabs()` (mirroring `buildTripperNavTabs`) mapping the 8 destinations; add admin heading copy + config resolver.
- Migrate 8 section pages (trip-requests, users, experiences, experiences/[id] review detail, payments, reviews, waitlist, xsed-notifications) to the `Section` → eyebrow/heading → KPI grid → panel-card table pattern using documented KPI card, table anatomy, `TableIconButton`/`TableIconLink`, and `ExperienceStatusBadge`.
- Restyle (not replace) the 3 modals — `TripRequestModal`, `UserRoleModal`, `DeleteUserModal` — and their internal tables/row-actions to documented primitives.
- **New admin home/overview page**, replacing the current root redirect to trip-requests — matches the tripper (`TripperContent`)/client (`ClientHomePageClient`) pattern of a KPI-stats + activity-list landing page:
  - **Stats** (KPI grid, all-time, gross figures, no time-range filter): trips sold (count of `TripRequest.status = COMPLETED`), earnings (`SUM(Payment.amount)` for `status IN [APPROVED, COMPLETED]` — gross, no commission/platform-cut split), waitlist size, XSED signup count.
  - **Pending Actions** (panel-card list/table, each row links to the relevant filtered admin view): experiences awaiting review (`PENDING_REVIEW`), trip requests needing destination assignment (`CONFIRMED` with no destination revealed), customer reviews awaiting approval (`isApproved = false`).
  - Server-side Prisma aggregation directly in the page's server component, matching how other admin pages fetch data — no new API route.
- Admin i18n keys (es + en) for new nav tabs, page headings, and the new home page's stats/pending-actions copy.

### Out of Scope
- `XsedDropShell` (`xsed/new`, `xsed/[id]/edit`) — already uses the shared wizard infra; different page shape, not inconsistent.
- Platform-revenue/commission-based earnings (vs. gross) — no stored platform-cut field; would require joining `Payment` → `TripRequest` → `Experience` → `User.commission` per row. Follow-up if needed.
- Time-range filtering/toggling on stats (e.g. "this month" vs all-time) — all-time only for now.
- Any change to admin data, permissions, API routes (beyond the new page's own server-side queries), or editing semantics.

## Capabilities

### New Capabilities
- `admin-dashboard-overview`: the new admin home page's stats and pending-actions behavior — genuine new user-facing functionality, not a presentational restyle. Needs a real delta spec in the spec phase (requirements + scenarios for each stat and each pending-action category, including what happens at zero/empty state).

### Modified Capabilities
- None else. The nav-shell swap and the 8 section migrations remain a pure presentational/navigational refactor — no behavior change there.

## Approach

Land shared infra first (shell union + `buildAdminNavTabs` + admin headings + layout/route swap) as one reviewable slice — every page migration depends on it. Then migrate each section independently: strip the sidebar-era `flex-1 overflow-hidden` scroll wrappers, wrap in `Section`/`rt-container text-left`, apply the documented patterns. Modals restyle alongside their owning section (users → role/delete modals; trip-requests → TripRequestModal).

### Suggested Sequencing (preview — sdd-tasks owns final breakdown)
1. Shell + nav infra + layout/route swap (blocking).
2. waitlist → payments → reviews → xsed-notifications (simple read/delete tables).
3. users (+ UserRoleModal, DeleteUserModal) → trip-requests (+ TripRequestModal).
4. experiences (list) → experiences/[id] review detail (most complex).
5. New admin home/overview page (stats + pending actions) — last, since it aggregates data that several of the migrated sections already touch (experiences, trip requests, reviews), and benefits from those pages' filtered views already existing to link into.

Chaining is expected given ~25 files; chain strategy to be decided with the user after the tasks forecast.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `dashboard/admin/layout.tsx`, `(shell)/layout.tsx`, `AdminLayoutClient.tsx` | Modified/Removed | Route admin through `StrictDashboardLayout`; drop `(shell)` group |
| `components/app/admin/AdminSidebar.tsx`, `AdminSidebarLink.tsx` | Removed | Replaced by shared nav tabs |
| `DashboardRoleShell.tsx`, `DashboardPageHeading.tsx`, `StrictDashboardLayout.tsx` | Modified | Add `"admin"` to role union + resolvers |
| `config/adminNav.ts`, `config/adminHeadings.ts` | New | `buildAdminNavTabs()` + heading resolver |
| 9 admin page clients (`Admin*PageClient.tsx`, `AdminExperienceReviewClient.tsx`) | Modified | Adopt Section/KPI/table patterns |
| `TripRequestModal`, `UserRoleModal`, `DeleteUserModal` | Modified | Restyle internals to documented primitives |
| `dashboard/admin/page.tsx` | Modified | Replace trip-requests redirect with the new home page (server component) |
| New: `AdminHomePageClient.tsx` (or similar) | New | Stats KPI grid + pending-actions panel |
| `src/dictionaries/es.json`, `en.json`, `lib/types/dictionary.ts` | Modified | Admin nav + heading + home page copy/types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Role-union widening breaks client/tripper shell | Med | Additive `"admin"` case; typecheck both existing roles |
| Sidebar-era `overflow-hidden`/`flex-1` containers clash with `Section` | High | Remove scroll wrappers per page during migration |
| Diff exceeds 400-line PR budget | High | Chain by section; infra slice first |
| Modal restyle regresses admin edit flows | Med | Keep logic; restyle presentation only; manual QA per modal |
| Nav tab overflow with 8 admin tabs | Low | `DashboardNavTabs` already handles 9 tripper tabs |
| Home page aggregate queries (4 stats + 3 pending-action counts = ~7 queries) add load to the admin landing page | Low | All are simple counts/single-column sums on indexed status/foreign-key fields; no joins required except the destination-assignment count (still a single-table filter) |

## Rollback Plan

Chained by section, so each slice reverts independently. The infra slice is the only shared dependency — reverting it restores `AdminLayoutClient`/`AdminSidebar` and the `(shell)` group. No data, schema, or API changes, so rollback is code-only.

## Dependencies

- Existing shared shell (`StrictDashboardLayout`, `DashboardRoleShell`, `DashboardNavTabs`) and documented primitives (`TableIconButton`, `ExperienceStatusBadge`) — already shipped.

## Success Criteria

- [ ] Admin renders top nav tabs (not the left sidebar); `AdminSidebar`/`AdminLayoutClient`/`(shell)` group removed.
- [ ] All 8 admin sections follow `design-system.md` (Section, eyebrow+heading, KPI card, table anatomy, `TableIconButton`).
- [ ] 3 modals restyled with documented primitives; edit flows unchanged.
- [ ] New admin home page renders at `/dashboard/admin` (replacing the redirect): 4 stat KPI cards (trips sold, gross earnings, waitlist size, XSED signups) + a pending-actions panel (experiences awaiting review, trip requests needing destination assignment, reviews awaiting approval), each pending-action row linking to its filtered admin view.
- [ ] Admin nav + heading + home page keys present in both locales; `npm run typecheck` and `npm run lint` pass.
