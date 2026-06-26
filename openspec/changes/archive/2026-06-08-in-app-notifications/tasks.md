# Tasks: In-App Notifications

**Change:** in-app-notifications
**Delivery strategy:** stacked-to-main chained PRs
**Chain strategy:** stacked-to-main

---

## Phase 1 — Schema & Types (PR #1) ✅ COMPLETE

Sequential. All downstream work depends on the Prisma model existing and types being correct.

### [x] T1.1 — Add `Notification` model, enums, and `User` relation to `prisma/schema.prisma`

**Spec:** Notification Data Model, NotificationType Enum, NotificationAudience Enum
**File:** `prisma/schema.prisma`
**Details:**
- Add enum `NotificationType` with values: `EXPERIENCE_APPROVED`, `EXPERIENCE_REJECTED`, `BOOKING_CONFIRMED`, `BOOKING_REVEALED`, `BOOKING_COMPLETED`, `BOOKING_CANCELLED`, `PAYMENT_RECEIVED`
- Add enum `NotificationAudience` with values: `TRIPPER`, `CLIENT`
- Add model `Notification` with fields: `id` (cuid), `userId`, `type NotificationType`, `audience NotificationAudience`, `isRead Boolean @default(false)`, `title String`, `body String?`, `metadata Json?`, `createdAt DateTime @default(now())`, `user` relation with `onDelete: Cascade`; add `@@map("notifications")`
- Add indexes: `@@index([userId, isRead])`, `@@index([userId, createdAt])`
- Add `notifications Notification[]` to `User` model
**Note:** `isRead` instead of `readAt` — the spec uses `isRead: Boolean`; the design draft used `readAt: DateTime?`. Use `isRead: Boolean @default(false)` as the spec is authoritative. `ClientNotification.isRead` in the TS type consistent throughout.

### [x] T1.2 — Run Prisma migration

**Spec:** Notification Data Model (cascade delete scenario)
**Commands:** `npm run db:generate` then `npm run db:migrate` (name: `add_notifications`)
**Verifies:** Migration file created; `notifications` table present; `npm run typecheck` passes

### [x] T1.3 — Create `src/types/notifications.ts`

**Spec:** Notification Data Model, Mark-Read API
**File:** `src/types/notifications.ts` (new)
**Details:**
```ts
export type NotificationMetadata =
  | { experienceId: string }
  | { tripRequestId: string }
  | null;

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  metadata: NotificationMetadata;
}
```

### [x] T1.4 — Add `NotificationsDict` to `src/lib/types/dictionary.ts`

**Spec:** Localization (dictionary key present scenario)
**File:** `src/lib/types/dictionary.ts`
**Details:**
- Add `export interface NotificationsDict` with fields covering UI chrome: `pageTitle`, `emptyState`, `markRead`, `unreadBadge` (at minimum)
- Add `notifications: NotificationsDict` field to `MarketingDictionary`
**Verify:** `npm run typecheck` reports error until step T1.5 adds the JSON keys; after T1.5 it must pass.

### [x] T1.5 — Add `notifications` section to `src/dictionaries/es.json` and `src/dictionaries/en.json`

**Spec:** Localization
**Files:** `src/dictionaries/es.json`, `src/dictionaries/en.json`
**Details:** Add `"notifications"` top-level key with at minimum: `pageTitle`, `emptyState`, `markRead`, `unreadBadge` strings in each language. UI chrome only — stored notification titles/bodies are resolved at emit time, not from these dictionaries.

---

## Phase 2 — API Routes (PR #2, depends on PR #1 merged)

Tasks T2.1–T2.3 can run in parallel once PR #1 is merged. They share no file.

### T2.1 — Create `GET /api/notifications` route

**Spec:** List API
**File:** `src/app/api/notifications/route.ts` (new)
**Details:**
- `getServerSession` → 401 if no session
- `prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } })`
- Return `{ notifications }` with HTTP 200
- Return HTTP 401 if unauthenticated

### T2.2 — Create `PATCH /api/notifications/[id]/read` route

**Spec:** Mark-Read API
**File:** `src/app/api/notifications/[id]/read/route.ts` (new)
**Details:**
- `getServerSession` → 401 if no session
- `prisma.notification.findFirst({ where: { id, userId: session.user.id } })` → 404 if not found (ownership check implicit)
- `prisma.notification.update({ where: { id }, data: { isRead: true } })`
- Return `{ notification }` with HTTP 200
- Return 404 if ownership check fails or record missing

### T2.3 — Create `GET /api/notifications/unread-count` route

**Spec:** Unread Count API
**File:** `src/app/api/notifications/unread-count/route.ts` (new)
**Details:**
- `getServerSession` → 401 if no session
- `prisma.notification.count({ where: { userId: session.user.id, isRead: false } })`
- Return `{ count }` with HTTP 200

---

## Phase 3 — UI Components (PR #3, depends on PR #1 merged; can overlap PR #2)

T3.1 and T3.2 are sequential (item before list). T3.3, T3.4, T3.5 can start after T3.1–T3.2 are done. T3.4 is independent of T3.3.

### [x] T3.1 — Create `NotificationItem.tsx`

**Spec:** Tripper Notifications Page (read/unread visual distinction, title, body, timestamp)
**File:** `src/components/app/notifications/NotificationItem.tsx` (new, `"use client"`)
**Details:**
- Props: `notification: ClientNotification`, `onMarkRead: (id: string) => void`
- Render: title, optional body, relative timestamp (e.g. `formatDistanceToNow` from date-fns or simple string), read/unread visual distinction (e.g. left border, font weight, background tint)
- On click: if `!isRead`, call `onMarkRead(id)`
- Uses `ClientNotification` from `@/types/notifications`

### [x] T3.2 — Create `NotificationsList.tsx`

**Spec:** Tripper Notifications Page, Client Notifications Panel (shared list component)
**File:** `src/components/app/notifications/NotificationsList.tsx` (new, `"use client"`)
**Details:**
- Props: `notifications: ClientNotification[]`, `copy: { emptyState: string; markRead: string }`
- Internal state: local `notifications` list; on mark-read click, call `PATCH /api/notifications/[id]/read`, update local state
- Renders `NotificationItem` for each; empty state when list is empty using `copy.emptyState`
- Shared across both tripper page and client panel

### [x] T3.3 — Create `TripperUnreadDot.tsx`

**Spec:** Tripper Avatar Unread Dot
**File:** `src/components/app/dashboard/tripper/TripperUnreadDot.tsx` (new, `"use client"`)
**Details:**
- On mount: `fetch('/api/notifications/unread-count')` — if `count > 0`, render a small dot (e.g. `w-2 h-2 rounded-full bg-red-500 absolute`)
- On error or `count === 0`: render nothing
- Fail-silent: no error UI

### [x] T3.4 — Create `NotificationsPanel.tsx`

**Spec:** Client Notifications Panel
**File:** `src/components/app/notifications/NotificationsPanel.tsx` (new, `"use client"`)
**Details:**
- On mount: `fetch('/api/notifications')`, populate state with `ClientNotification[]`
- Renders `NotificationsList` with the fetched data
- Uses panel card style: `bg-white p-6 rounded-xl border border-gray-200 shadow-sm`
- Panel heading: `copy.notifications.pageTitle`
- Imports `copy` via `getCopy(locale)` pattern (static import of both JSONs, select by `useParams` locale)

### T3.5 — Add i18n strings for notification stored titles/bodies

**Spec:** Localization (locale-aware storage scenario)
**Note:** This is a constant map, NOT dictionary strings. Create a helper or inline object in the emit utility (Phase 5) that maps `(type, locale)` → `{ title, body }`. No new files needed — this is authored during Phase 5. Captured here as a tracking task.
**Status:** deferred to Phase 5 (T5.1)

---

## Phase 4 — Pages & Layout (PR #4, depends on PR #2 + PR #3 merged)

### T4.1 — Create tripper notifications server page

**Spec:** Tripper Notifications Page
**File:** `src/app/[locale]/(secure)/dashboard/tripper/notifications/page.tsx` (new)
**Details:**
- Server component (`async` function, no `"use client"`)
- `requireAuth` → redirect if not authenticated
- `prisma.notification.findMany({ where: { userId, audience: 'TRIPPER' }, orderBy: { createdAt: 'desc' } })`
- Serialize to `ClientNotification[]` (convert dates to ISO strings)
- Render `<NotificationsList notifications={...} copy={dict.notifications} />`
- Use `hasLocale` guard on `params.locale` before `getDictionary`

### T4.2 — Add notifications tab to `TripperNavTabs.tsx` and mount `TripperUnreadDot`

**Spec:** Tripper Avatar Unread Dot (dot mounted in nav), Tripper Notifications Page (navigation)
**File:** `src/components/app/dashboard/tripper/TripperNavTabs.tsx`
**Details:**
- Add a "Notifications" tab entry pointing to `/{locale}/dashboard/tripper/notifications`
- Mount `<TripperUnreadDot />` relative to the avatar/profile area — as a sibling with `position: relative` on the parent
- `TripperUnreadDot` must be imported dynamically or as a plain client import (it is already `"use client"`)

### T4.3 — Mount `NotificationsPanel` in client dashboard

**Spec:** Client Notifications Panel
**File:** `src/app/[locale]/(secure)/dashboard/page.tsx`
**Details:**
- Import `NotificationsPanel` from `@/components/app/notifications/NotificationsPanel`
- Add `<NotificationsPanel copy={copy.notifications} />` inside the sidebar `div.space-y-6` (after `<FinancialSummary />`)
- Pass `notifications` key of dict as `copy` prop

---

## Phase 5 — Emit Integration (PR #5, depends on PR #1 merged; independent of PRs #2–4)

Both T5.1 and T5.2 can run in parallel — they touch different route files.

### T5.1 — Emit `EXPERIENCE_APPROVED` notification in approve route

**Spec:** Emit on Experience Approve and Reject
**File:** `src/app/api/admin/experiences/[id]/approve/route.tsx`
**Details:**
- After the `prisma.experience.update` (status → APPROVED) and after the existing `void sendMail().catch()` block, add:
  ```ts
  const approvedTitle = owner.locale === "en" ? "Experience approved" : "Experiencia aprobada";
  void prisma.notification.create({
    data: {
      userId: owner.id,
      type: "EXPERIENCE_APPROVED",
      audience: "TRIPPER",
      isRead: false,
      title: approvedTitle,
      metadata: { experienceId: experience.id },
    },
  }).catch(() => {});
  ```
- Must NOT await; must NOT touch the email block; must NOT delay the HTTP response
- Include locale-aware title resolution (owner.locale === 'en' → English, else Spanish)

### T5.2 — Emit `EXPERIENCE_REJECTED` notification in reject route

**Spec:** Emit on Experience Approve and Reject (reject with note scenario)
**File:** `src/app/api/admin/experiences/[id]/reject/route.tsx`
**Details:**
- Same pattern: after existing email side-effect, add fire-and-forget `prisma.notification.create`
- `type: "EXPERIENCE_REJECTED"`, `audience: "TRIPPER"`, `body: reviewNote` (the rejection note from request body), locale-aware `title`
- `.catch(() => {})` to swallow errors

---

## Phase 6 — Verification (no PR; runs against final merged state)

Sequential — depends on all prior PRs merged.

### T6.1 — Run typecheck and lint

**Spec:** Localization (dictionary key present scenario)
**Commands:** `npm run typecheck`, `npm run lint`
**Accept:** zero errors

### T6.2 — Manual QA checklist

**Spec:** All requirements
**Checks:**
- [ ] Approve an experience → notification row appears in DB, tripper notifications page shows it
- [ ] Reject an experience → notification row with body = review note appears
- [ ] Avatar dot appears when unread count > 0; disappears after clicking all items
- [ ] Clicking unread item transitions it to read visual state; subsequent page reload shows it as read
- [ ] Client dashboard panel renders client-audience notifications (none for tripper-audience)
- [ ] Empty state shown when no notifications exist on both tripper page and client panel
- [ ] API returns 401 unauthenticated on all three endpoints
- [ ] Cross-user isolation: user A cannot see user B's notifications
- [ ] `npm run build` passes with no errors

---

## Dependency Graph

```
T1.1 → T1.2 → T1.3, T1.4 → T1.5
                    ↓
             T2.1, T2.2, T2.3  (parallel)
             T3.1 → T3.2 → T3.3, T3.4  (T3.3/T3.4 parallel)
                    ↓
             T4.1, T4.2, T4.3  (parallel once T2+T3 done)
             T5.1, T5.2  (parallel; only need T1.x)
                    ↓
             T6.1 → T6.2
```

## PR Boundaries (stacked-to-main)

| PR | Tasks | Merges to |
|----|-------|-----------|
| PR #1 | T1.1, T1.2, T1.3, T1.4, T1.5 | main |
| PR #2 | T2.1, T2.2, T2.3 | main (after PR #1) |
| PR #3 | T3.1, T3.2, T3.3, T3.4 | main (after PR #1; can overlap PR #2) |
| PR #4 | T4.1, T4.2, T4.3 | main (after PR #2 + PR #3) |
| PR #5 | T5.1, T5.2 | main (after PR #1; can overlap PRs #2–4) |
| Verify | T6.1, T6.2 | — (no PR; post-merge validation) |

## Review Workload Forecast

- Estimated changed lines: ~350–420 across all PRs
- Largest PR: PR #3 (components, ~150 lines)
- Each individual PR is well under the 400-line budget
- Chained PRs recommended: Yes (already chosen — stacked-to-main)
- 400-line budget risk per PR: Low
- Decision needed before apply: No (strategy already set)

## Open Questions Resolved

- Client dashboard `NotificationsPanel` placement: sidebar `div.space-y-6` after `<FinancialSummary />` in `src/app/[locale]/(secure)/dashboard/page.tsx`
- `isRead: boolean` wins over `readAt: DateTime?` — spec is authoritative
- Approve/reject routes are `.tsx` (confirmed in design)
