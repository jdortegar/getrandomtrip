# Exploration: notifications-inbox

## Current State

`src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` (473 lines) renders a flat feed shared by traveler/tripper/admin — full `title` + `body` inline per row, no detail view.

Read semantics are inconsistent:
- Rows without `href` (`resolveHref` in `src/lib/helpers/notificationHrefs.ts`) are click-to-mark-read on the whole row (`:361-381`).
- Rows with `href` are only markable via the small `TableIconLink` (`:426-435`); clicking the row body does nothing.
- No mark-as-unread. `markRead` swallows fetch errors (`:193`).
- Unread cue is only `bg-sky-50/40` + bold text.

API: `GET /api/notifications` (paginated, audience/status via `src/lib/notifications/list-query.ts`), `PATCH [id]/read` (ownership-checked, sets `isRead: true` only), `DELETE [id]` (ownership-scoped `deleteMany`), `PATCH read-all`. `src/lib/notifications/unreadDotBus.ts` is a pub/sub used by the dot and list.

Content model: `Notification.title`/`body` (`prisma/schema.prisma:760-776`) are frozen strings written at emit time. `metadata: Json?` already stores typed refs (`tripRequestId`, `experienceId`, `blogId`, `reviewId` — `src/types/notifications.ts`).

Known emit-site defects (out of scope here):
- `src/app/api/internal/destination-reveal/route.ts:73-113` creates ADMIN notifications with `type: "BOOKING_CONFIRMED"` and hardcoded Spanish copy.
- `BOOKING_REVEALED/COMPLETED/CANCELLED` and `PAYMENT_RECEIVED` are never emitted.

`openspec/specs/notifications-management/spec.md` locks "Preserve Click-to-Mark-Read Semantics" and lists "No schema changes" as a non-goal — both need deltas.

UI primitives: `src/components/ui/dialog.tsx` (Radix Dialog), `Modal.tsx`. No split-pane primitive exists.

## Affected Areas

- `src/components/app/dashboard/shared/RoleNotificationsPageClient.tsx` — row click model, detail view
- `src/app/api/notifications/[id]/read/route.ts` — accept `{ isRead }` or add unread toggle
- `src/app/api/notifications/[id]/route.ts` — optional GET for detail fetch
- `src/lib/helpers/notificationHrefs.ts` — href becomes a CTA inside the reading view
- `openspec/specs/notifications-management/spec.md`, `openspec/specs/dashboard-shell/spec.md` — deltas

## Approaches

| # | Approach | Pros | Cons | Effort |
|---|----------|------|------|--------|
| 1 | Dialog detail view (reuse `dialog.tsx`), open state mirrored to `?id=` | No new routes, one shared component, existing primitive | Modal, not a persistent pane | Low–Medium |
| 2 | Nested route `/dashboard/{role}/notifications/[id]`, desktop split-pane + mobile full page | Closest to real email client, natively deep-linkable | 3 new pages, new layout pattern, biggest diff | High |
| 3 | `?id=` inline panel inside the existing client component | URL-addressable, no new files | New panel layout from scratch, squeezes list on narrow layouts | Medium |

## Recommendation (explore agent)

Option 1 with `?id=` sync. Whole row opens the dialog and marks read; dialog footer has Mark unread / Delete / Prev / Next and the deep-link CTA. Keep frozen `title`/`body`. Emit-site i18n fixes and missing `BOOKING_*` emits as a fast-follow.

## Scope

- **In**: reading view, read/unread toggle + endpoint change, unified row click, spec deltas, i18n dict additions.
- **Out**: emit-site i18n fixes, missing `BOOKING_*` emits, schema changes, split-pane route architecture.

## Risks

- Spec deltas required for `notifications-management` and `dashboard-shell`.
- `PATCH [id]/read` contract change — update tests first (strict TDD).
- Scope creep from the `destination-reveal` bug.

## Open Questions

1. Dialog (Option 1) vs split-pane email layout (Option 2)?
2. Confirm emit-site fixes are a fast-follow, not bundled.
