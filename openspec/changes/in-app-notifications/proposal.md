# Proposal: In-App Notifications

## Intent

Trippers and clients have no way to learn about events that affect them (experience approvals/rejections, future bookings/payments) without leaving the app or relying on email. We need a read-only, in-app notification surface as the durable foundation for event-driven user messaging. Starting with experience approval/rejection gives immediate value to trippers while establishing the model, API, and UI that future event types reuse.

## Scope

### In Scope

- `Notification` model + `NotificationType` and `NotificationAudience` enums in Prisma; `notifications` relation on `User`.
- API: `GET /api/notifications` (list, `createdAt desc`), `PATCH /api/notifications/[id]/read` (mark one read), `GET /api/notifications/unread-count` (`{ count }`).
- Tripper page at `/{locale}/dashboard/tripper/notifications` + nav entry in `TripperNavTabs`.
- Client `NotificationsPanel` widget in the existing dashboard grid.
- Unread avatar dot in the tripper nav (dedicated fetch, not a tab badge).
- Shared `NotificationsList` + `NotificationItem` components.
- Emit `EXPERIENCE_APPROVED` / `EXPERIENCE_REJECTED` (tripper audience) from the approve/reject routes.
- `notifications` dictionary section (es/en) + `NotificationsDict` type + `Notification` domain types.

### Out of Scope

- Real-time delivery (SSE/WebSockets) — v1 fetches on mount only, no polling interval.
- Emitting `BOOKING_*` / `PAYMENT_RECEIVED` (enum reserved, not wired).
- Mark-all-read, pagination, filtering, deletion, user notification preferences.
- Email/push channels; admin-facing notifications.

## Capabilities

### New Capabilities

- `in-app-notifications`: durable per-user notification records, the read/unread-count API contract, audience-scoped rendering (tripper page + client panel), the unread avatar indicator, and the emit contract for experience approval/rejection events.

### Modified Capabilities

- None. Approve/reject routes gain a notification-emit side effect but their lifecycle requirements (`experience-review-lifecycle`) are unchanged.

## Approach

Polling-on-mount per the exploration recommendation (Option A): self-contained, zero new infra, consistent with existing dashboard `useEffect + fetch`. Notifications are created as a side effect inside the existing approve/reject routes via `prisma.notification.create` — no separate emit endpoint. All routes reuse the canonical `getServerSession` guard and scope every query to `session.user.id`. UI follows the canonical white panel/list-item pattern; `NotificationsList`/`NotificationItem` are shared across both audiences. The avatar dot consumes `unread-count` via a small dedicated fetch. SSE/WebSocket is a clean future swap (`fetch` → `EventSource`) once model + API exist.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | `Notification` model, two enums, `User.notifications` relation |
| `src/app/api/notifications/route.ts` | New | `GET` list |
| `src/app/api/notifications/[id]/read/route.ts` | New | `PATCH` mark read |
| `src/app/api/notifications/unread-count/route.ts` | New | `GET` count |
| `src/app/[locale]/(secure)/dashboard/tripper/notifications/page.tsx` | New | Tripper page |
| `src/app/[locale]/(secure)/dashboard/page.tsx` | Modified | Client panel widget |
| `src/components/app/dashboard/tripper/TripperNavTabs.tsx` | Modified | Nav entry + avatar dot |
| `src/components/app/notifications/*` | New | `NotificationsList`, `NotificationItem` |
| `src/app/api/admin/experiences/[id]/approve` + reject routes | Modified | Emit notification |
| `src/lib/types/dictionary.ts`, `src/dictionaries/{es,en}.json`, `src/types/` | Modified/New | Copy + domain types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Approve/reject route file extension uncertain (`.ts` vs `.tsx`) | Med | Confirm path before wiring emit; emit is additive |
| `metadata: Json?` shape drift across callers | Med | Define narrow `NotificationMetadata` type in `src/types/` |
| Avatar dot couples previously-static nav to a fetch | Low | Isolate fetch in a small client subcomponent; fail silent |
| Name collision with `XsedNotificationSignup` | Low | Distinct model/table (`notifications`) and naming discipline |

## Rollback Plan

Revert the feature commit(s) and run `prisma migrate` down (or drop the `notifications` table + enums). The added nav entry, client panel, and approve/reject emit calls are additive and removable without affecting the experience lifecycle. No data migration of existing records is involved.

## Dependencies

- Prisma migration applied to the database.
- Existing experience approve/reject routes must exist to host the emit side effect.

## Success Criteria

- [ ] Tripper sees `EXPERIENCE_APPROVED`/`EXPERIENCE_REJECTED` notifications on the notifications page after admin action.
- [ ] Unread avatar dot reflects unread count and clears as items are marked read.
- [ ] Client dashboard renders the notifications panel scoped to the authenticated user.
- [ ] All notification queries are scoped to `session.user.id`; no cross-user leakage.
- [ ] `npm run typecheck` and `npm run lint` pass.
