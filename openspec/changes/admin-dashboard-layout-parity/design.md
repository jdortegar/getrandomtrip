# Design: Admin Dashboard Layout Parity

## Technical Approach

Route the admin dashboard through the same `StrictDashboardLayout` → `DashboardRoleShell` → `DashboardNavTabs` stack that tripper/client already use, delete the bespoke `AdminSidebar`/`AdminLayoutClient`/`(shell)` stack, and migrate every admin section page to the `design-system.md` `Section` → eyebrow/heading → KPI/table pattern. Widening is **additive**: a new `"admin"` case is threaded through the three shell components plus two new config files (`adminNav.ts`, `adminHeadings.ts`), leaving the `"client"`/`"tripper"` branches untouched. A genuinely new capability — the admin overview home page — replaces the current root (which today renders trip-requests) with server-side Prisma aggregation. Cross-checked against `specs/admin-dashboard-overview/spec.md`: the four stats, three pending-action filters, force-dynamic (no-cache) reads, and the "zero-value still renders, never hidden" rules below all map to its scenarios.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Role widening | Add `"admin"` to the union in `DashboardRoleShell`, `DashboardPageHeading`, `StrictDashboardLayout.shellRole`; three-way branch | Separate `AdminShell` component | Reuses the shipped nav/heading system; `DashboardRole` and `hasStrictRole` already accept `"admin"`, so only presentational types widen. |
| Route group | Delete `(shell)`; move children up one level; put `StrictDashboardLayout` in `admin/layout.tsx` (like tripper) | Keep a group whose layout swaps in `StrictDashboardLayout` | Proposal mandates removing `(shell)`; group parens carry no URL segment, so moving pages up is URL-preserving. `admin/layout.tsx` replaces `SecureRouteWrapper` (StrictDashboardLayout does its own session+role guard). |
| xsed under the shell | Let `admin/xsed/*` inherit the nav header, same as tripper's `experiences/new` wizard | Special-case xsed out of the shell | Parity: tripper's wizard already renders the nav on top. "Out of scope" means we don't restyle the wizard's internal shape, not that it must be shell-free. Needs an `adminHeadings` entry for the xsed route. |
| `AdminKPICard` | Delete it. Home headline stats → documented **KPI stat card** (icon puck + yellow accent bar + Barlow value); trip-requests status counts → documented **supporting strip** (label + Barlow value, no puck) | Add a "simple" variant to the KPI card | AdminKPICard (plain label+number) maps to neither documented shape. Status counts have no meaningful icon → supporting strip; the 4 home metrics each have a natural icon → full KPI card. |
| Status badges | `ExperienceStatusBadge` ONLY on experiences list + review-detail. Trip-requests keep `StatusBadge variant="trip"`, payments keep `variant="payment"` | Route all admin tables through `ExperienceStatusBadge` | GAP confirmed: `ExperienceStatusBadge` only knows `ExperienceStatus`. Trip (`TripRequestStatus`) and payment (`PaymentStatus`) statuses are outside its map; design-system.md itself scopes booking-flow badges as separate. |
| Modal restyle | Light token alignment only; the 3 modals have **no internal tables and no row actions** | Rebuild modal internals with table anatomy / `TableIconButton` | Verified: `TripRequestModal`/`UserRoleModal`/`DeleteUserModal` are detail/confirm dialogs. The real row-action → `TableIconButton` migration lives in the parent list pages (`UsersTableRow`, waitlist rows) that open them, not the modals. |
| Overview data | Server-side `Promise.all` of 7 Prisma counts/aggregate in `admin/page.tsx`; presentational `AdminHomeContent` (no hooks, no client fetch) | Client-side fetch like tripper/client home | Proposal mandates server aggregation, no new API route. Data is ready at render → no loading skeleton needed. |
| Overview empty state | Always render all 4 stat cards (0 → "0"/"$0") and all 3 pending-action rows (0 allowed); panel never collapses | Hide zero rows; show an "all caught up" line instead of rows | Directly required by spec scenarios "Zero-value stats still render", "Category with zero pending items", "All categories empty" — rows MUST NOT be omitted. |

## Interfaces / Contracts

Role union (identical edit in three files):
```ts
// DashboardRoleShell, DashboardPageHeading props; StrictDashboardLayout.shellRole
role: "admin" | "client" | "tripper";   // was "client" | "tripper"
```
`DashboardRoleShell` tab branch becomes three-way:
```ts
const tabs =
  role === "client" ? buildClientNavTabs(clientNav, locale)
  : role === "tripper" ? buildTripperNavTabs(tripperNav, isAdmin, locale)
  : buildAdminNavTabs(adminNav, locale);
```
`DashboardPageHeading` gains `if (role === "admin") return resolveAdminPageHeading(pathname, adminHeadings);`.
`StrictDashboardLayout`: `resolvedShellRole` fallback unchanged; admin passes explicit `shellRole="admin"`. No `audience` change to `DashboardNavTabItem` (admin tabs need no unread dot).

`buildAdminNavTabs(copy, locale)` → `DashboardNavTabItem[]` (mirrors `buildTripperNavTabs`, `base = /dashboard/admin{path}`), 9 tabs:

| # | label key | href | icon | exact |
|---|---|---|---|---|
| 1 | dashboard | `` (root) | `LayoutDashboard` | ✓ |
| 2 | tripRequests | `/trip-requests` | `Briefcase` | |
| 3 | users | `/users` | `Users` | |
| 4 | experiences | `/experiences` | `Package` | |
| 5 | payments | `/payments` | `CreditCard` | |
| 6 | reviews | `/reviews` | `Star` | |
| 7 | waitlist | `/waitlist` | `Mail` | |
| 8 | xsed | `/xsed/new` | `Compass` | |
| 9 | xsedNotifications | `/xsed-notifications` | `Bell` | |

(Tab count is **9**, not the proposal's 8 — the new home tab is added and trip-requests moves off root. `packages` route has no sidebar link today and gets none. `xsed` targets `/xsed/new` since no `/xsed` index page exists.)

Dictionary additions (`adminDashboard` section, es+en + `AdminDashboardDict` in `dictionary.ts`): `nav.{dashboard,tripRequests,users,experiences,payments,reviews,waitlist,xsed,xsedNotifications}`, `pageHeadings.{home,tripRequests,users,experiences,experiencesDetail,payments,reviews,waitlist,xsedNotifications,xsedNew}` (each `{title,description}`), `home.{eyebrow,heading, stats.{tripsSold,earnings,waitlist,xsedSignups}, pending.{eyebrow,heading,experiencesReview,tripsDestination,reviewsApproval,allClear}}`. Remove `adminSidebar` keys when the sidebar is deleted.

## Overview Queries (server component, `Promise.all`)
```ts
tripRequest.count({ where: { status: "COMPLETED" } })                       // trips sold
payment.aggregate({ _sum:{amount:true}, where:{ status:{in:["APPROVED","COMPLETED"]} } }) // gross earnings → _sum.amount ?? 0
waitlistEntry.count()                                                        // waitlist size
xsedNotificationSignup.count()                                              // XSED signups
experience.count({ where: { status: "PENDING_REVIEW" } })                   // pending: experiences
tripRequest.count({ where: { status:"CONFIRMED", actualDestination:null } }) // pending: destination assignment
review.count({ where: { isApproved: false } })                             // pending: reviews
```
All single-table filters on indexed status/FK columns; no joins. "Needs destination" = `CONFIRMED` + `actualDestination IS NULL` (per spec; field confirmed on `TripRequest`). The overview page (or its layout) MUST be `force-dynamic` so counts reflect the latest state with no caching delay (spec scenario "Data reflects the latest state on every load"); `admin/layout.tsx` already sets `export const dynamic = "force-dynamic"`.

## Reference JSX (from design-system.md)
KPI stat card (one of 4):
```tsx
<div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">{copy.stats.tripsSold}</span>
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue/10 text-light-blue"><CheckCircle className="h-4 w-4" /></span>
  </div>
  <div className="flex items-stretch gap-3">
    <div className="w-1 shrink-0 self-stretch rounded-full bg-yellow-400" />
    <span className="font-barlow-condensed text-5xl font-extrabold leading-[.9] text-gray-900">{tripsSold}</span>
  </div>
</div>
```
Pending-action row (panel-card list, links to filtered view):
```tsx
<Link href={pathForLocale(locale, "/dashboard/admin/experiences?status=PENDING_REVIEW")}
  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
  <span className="text-sm text-neutral-700">{copy.pending.experiencesReview}</span>
  <span className="flex items-center gap-3">
    <span className="font-barlow-condensed text-lg font-bold text-gray-900">{pending.experiences}</span>
    <ChevronRight className="h-4 w-4 text-neutral-400" />
  </span>
</Link>
```

## Per-Section Migration Pattern (waitlist BEFORE/AFTER)
BEFORE (`AdminWaitlistPageClient`, sidebar-era): `<div className="flex flex-1 flex-col overflow-hidden">` → `shrink-0 border-b … px-5 py-4` count header → `flex-1 overflow-y-auto` → `mx-5 my-4 … rounded-xl border` card → bare `<table>` with `text-sm font-medium text-neutral-600` headers and a text `<button>` delete.
AFTER: page.tsx wraps `<Section className="py-10!"><div className="rt-container text-left">…</div></Section>`; client returns `<div className="space-y-10">` containing (1) eyebrow+heading block, (2) filter row with `{filtered} of {total} {noun}` count, (3) documented table card (`rounded-xl border border-gray-200 … overflow-hidden` + `overflow-x-auto`, `thead` `bg-gray-50` + `text-[11px] … tracking-wider text-neutral-500`, `tbody divide-y divide-gray-50`, rows `hover:bg-gray-50`), delete via `<TableIconButton danger title={copy.delete}><Trash2 className="h-4 w-4"/></TableIconButton>`. **Every** `flex-1`/`overflow-hidden`/`overflow-y-auto`/`shrink-0` wrapper is removed — the page now scrolls with the document, not a fixed `h-screen` pane. Same recipe for payments, reviews, xsed-notifications; users/trip-requests add row-action buttons + (trip-requests) the supporting strip.

## Data Flow
```
admin/layout.tsx  →  StrictDashboardLayout(requiredRole=admin, shellRole=admin)
                       ├─ DashboardRoleShell role=admin → DashboardPageHeading(resolveAdminPageHeading)
                       │                                 → DashboardNavTabs(buildAdminNavTabs)
                       └─ {children}
admin/page.tsx (server, Promise.all 7 queries) → AdminHomeContent(stats, pending, copy, locale)
admin/<section>/page.tsx (Section wrapper) → Admin<Section>PageClient (useDictionary + fetch/API as today)
```

## File Changes (mapped to the 5 sequencing slices)

| Slice | File | Action | Est. lines |
|---|---|---|---|
| 1 infra | `DashboardRoleShell.tsx`, `DashboardPageHeading.tsx`, `StrictDashboardLayout.tsx` | Modify (union + branch) | ~15 |
| 1 | `config/adminNav.ts`, `config/adminHeadings.ts` | Create | ~100 |
| 1 | `admin/layout.tsx` | Rewrite → StrictDashboardLayout | ~15 |
| 1 | `(shell)/layout.tsx`, `AdminLayoutClient.tsx`, `AdminSidebar.tsx`, `AdminSidebarLink.tsx` | Delete | ~-110 |
| 1 | `(shell)/*` pages → `admin/*` (move up; fix `../../`→`../` imports); add `admin/trip-requests/page.tsx` | Move/Create | ~40 |
| 1 | `dictionaries/{es,en}.json`, `lib/types/dictionary.ts` (`adminDashboard.nav`+`pageHeadings`; drop `adminSidebar`) | Modify | ~90 |
| 2 | `AdminWaitlistPageClient`, `AdminPaymentsPageClient`, `AdminReviewsPageClient`, `AdminXsedNotificationsPageClient` + their `page.tsx` Section wrappers | Modify | ~300 |
| 3 | `AdminUsersPageClient` + `UsersTableRow` (row actions), `UserRoleModal`, `DeleteUserModal` restyle | Modify | ~180 |
| 3 | `AdminTripRequestsPageClient` + `TripRequestsKPIStrip`→supporting strip, `TripRequestModal` restyle; delete `AdminKPICard` | Modify/Delete | ~170 |
| 4 | `AdminExperiencesPageClient`, `AdminExperienceReviewClient` (+ page wrappers) | Modify | ~300 |
| 5 | `admin/page.tsx` (server queries), `AdminHomeContent.tsx`, `dictionaries` home copy + type | Create/Modify | ~260 |

Total ≈ **1470 changed lines** → far over the 400-line budget → chaining across the 5 slices is required (slice 1 blocking).

## Testing Strategy
| Layer | What | Approach |
|---|---|---|
| Type | Role union widening doesn't break client/tripper; new dict keys typed | `npm run typecheck` after slice 1 and each slice |
| Lint | No raw `<img>`, no inline badge/row-action styles | `npm run lint` |
| Manual | Nav renders top tabs (no sidebar); each migrated section layout; each modal edit flow unchanged; overview counts vs. DB; pending rows deep-link to filtered views; zero/empty states | Per-slice QA at ≥360px and ≥1280px |

## Migration / Rollout
No data/schema/API change (overview reads only). Chained by slice; each reverts independently. Reverting slice 1 restores `AdminSidebar`/`AdminLayoutClient`/`(shell)`. Code-only rollback.

## Open Questions
- [ ] Spec requires non-admin redirect to `/dashboard`, but the shared `StrictDashboardLayout` redirects via `getDefaultDashboardPath` (role's default dashboard). Confirm the shared guard's behavior is acceptable, or special-case the admin redirect target.
- [ ] Tab-count contract mismatch: `specs/dashboard-shell` scenario asserts the bar "lists all 8 admin sections", but adding the new overview home tab makes **9** tabs (home + 8 sections). Reconcile before `sdd-verify` — either update the spec scenario to 9, or treat home as one of the 8 (dropping a separate section tab). Recommend updating the scenario to 9.
- [ ] `xsed` nav tab targets `/xsed/new` (no `/xsed` index exists) — confirm this is the intended destination vs. a new xsed index.
- [ ] `packages` route (`(shell)/packages`) has no nav entry today and gets none — confirm it can stay unlinked (or is dead and removable in a follow-up).
