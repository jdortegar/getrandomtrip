# Design: In-App Notifications

## Technical Approach

Read-only notification surface layered on Prisma + Next.js App Router, polling-on-mount (proposal Option A, no new infra). A `Notification` model holds per-user, audience-scoped records. Three thin API routes (list, mark-read, unread-count) reuse the canonical `getServerSession` + `prisma.user` guard and scope every query to `session.user.id`. Approve/reject routes gain an additive fire-and-forget `prisma.notification.create` side effect alongside the existing email block. UI is a shared `NotificationsList`/`NotificationItem` rendered by a server-fetched tripper page and a client dashboard panel; an isolated avatar dot consumes unread-count.

## Architecture Decisions

| # | Decision | Choice | Alternatives rejected | Rationale |
|---|----------|--------|-----------------------|-----------|
| D1 | Schema placement | `Notification` model + `NotificationType`/`NotificationAudience` enums in `schema.prisma`; `User.notifications Notification[]` relation | Separate JSON column on User; generic events table | Mirrors existing model style (`@@map`, cuid id); typed enums; indexable per-user queries |
| D2 | Metadata typing | Narrow TS union `NotificationMetadata` over `Json?` column | `Record<string,unknown>`; loose `any` | Prevents shape drift; only valid links (`experienceId`/`tripRequestId`) representable |
| D3 | API structure | `/api/notifications` GET, `/api/notifications/[id]/read` PATCH, `/api/notifications/unread-count` GET | Single route w/ query params; tRPC | Matches existing REST file-per-action convention; each route trivially auth-scoped |
| D4 | Avatar dot | Dedicated `TripperUnreadDot` client subcomponent, own fetch, fails silent | Badge inside nav tab; pass count via server layout | Isolates a fetch from the static `TripperNavTabs`; no prop drilling through server layout |
| D5 | List component | Shared `NotificationsList` taking `notifications: ClientNotification[]` | Duplicate list per audience | One render contract across tripper page + client panel |
| D6 | Emit pattern | Append second fire-and-forget `prisma.notification.create(...).catch()` block; do NOT touch email block | Refactor email+notif into shared emitter; emit endpoint | Additive, low-risk, removable; matches existing swallow-failure side-effect style |
| D7 | Stored-text i18n | Resolve title/body at creation in owner locale (`owner.locale === "en" ? "en" : "es"`) | Store keys, translate at render | Same pattern as email subjects; render stays dumb; no runtime dictionary lookup for stored rows |
| D8 | Page pattern | Tripper page = server component, Prisma fetch direct, passes prop to `NotificationsList` client child for mark-read | Full client page w/ API fetch | Consistent with other tripper pages; interactivity isolated to child |

## Data Flow

    Admin approve/reject route
       │ (DB update succeeds)
       ├─ void sendMail(...).catch()            [existing — untouched]
       └─ void prisma.notification.create({      [new — additive]
              userId: ownerId, type, audience,
              title/body in owner.locale, metadata })

    Tripper page (server)  ──Prisma──→ NotificationsList (client)
                                            │ click → PATCH /[id]/read
    TripperNavTabs ──mounts──→ TripperUnreadDot ──GET /unread-count──→ dot
    Client dashboard ──→ NotificationsPanel ──→ NotificationsList

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `Notification` model, enums, `User.notifications` relation |
| `src/types/notifications.ts` | Create | `NotificationMetadata`, `ClientNotification` domain types |
| `src/app/api/notifications/route.ts` | Create | GET list, createdAt desc, scoped to user |
| `src/app/api/notifications/[id]/read/route.ts` | Create | PATCH mark single read (ownership checked) |
| `src/app/api/notifications/unread-count/route.ts` | Create | GET `{ count }` |
| `src/components/app/notifications/NotificationsList.tsx` | Create | Client list (`"use client"`), mark-read on click |
| `src/components/app/notifications/NotificationItem.tsx` | Create | Single row, read/unread style |
| `src/components/app/dashboard/tripper/TripperUnreadDot.tsx` | Create | Client dot, fetch unread-count on mount, fail silent |
| `src/app/[locale]/(secure)/dashboard/tripper/notifications/page.tsx` | Create | Server page, Prisma fetch, renders list |
| `src/components/app/notifications/NotificationsPanel.tsx` | Create | Client dashboard panel widget |
| `src/components/app/dashboard/tripper/TripperNavTabs.tsx` | Modify | Add notifications tab + mount `TripperUnreadDot` |
| client dashboard `page.tsx` | Modify | Mount `NotificationsPanel` in grid |
| `src/app/api/admin/experiences/[id]/approve/route.tsx` | Modify | Add emit `EXPERIENCE_APPROVED` side effect |
| `src/app/api/admin/experiences/[id]/reject/route.tsx` | Modify | Add emit `EXPERIENCE_REJECTED` side effect |
| `src/lib/types/dictionary.ts` | Modify | Add `NotificationsDict` + field on `MarketingDictionary` |
| `src/dictionaries/{es,en}.json` | Modify | Add `notifications` section (UI chrome only) |

## Interfaces / Contracts

```prisma
model Notification {
  id        String               @id @default(cuid())
  userId    String
  type      NotificationType
  audience  NotificationAudience
  title     String
  body      String
  metadata  Json?
  isRead    Boolean              @default(false)
  createdAt DateTime             @default(now())
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
  @@map("notifications")
}
enum NotificationType { EXPERIENCE_APPROVED EXPERIENCE_REJECTED BOOKING_CREATED PAYMENT_RECEIVED }
enum NotificationAudience { TRIPPER CLIENT }
```

```ts
// src/types/notifications.ts
export type NotificationMetadata =
  | { experienceId: string }
  | { tripRequestId: string }
  | null;

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata: NotificationMetadata;
}
```

API: `GET /api/notifications` → `ClientNotification[]`; `PATCH /api/notifications/[id]/read` → `{ ok: true }` (404 if not owner); `GET /api/notifications/unread-count` → `{ count: number }`. All return 401 unauthenticated.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Integration | Each route auth-scopes to session user; cross-user 404/empty | Test runner against handlers with mocked session |
| Integration | Emit creates row on approve/reject; HTTP response unaffected on emit failure | Assert row exists; force create throw, assert 200 |
| Unit | `NotificationItem` read/unread render; metadata link rendering | Component render test |
| Manual | Dot reflects count, clears on read; panel scoped | QA in dashboard |

## Migration / Rollout

Additive Prisma migration creating `notifications` table + enums (`db:migrate`). No backfill — table starts empty. Rollback = migrate down (drop table/enums); nav tab, panel, emit calls are removable with no data dependency.

## Open Questions

- [ ] Client dashboard page exact path/grid slot for `NotificationsPanel` — confirm during tasks against current dashboard file.
