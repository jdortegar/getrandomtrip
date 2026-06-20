# Design: Experience Approval Flow v2 (Admin Edit + Tripper Re-Review)

## Technical Approach

Add an admin editing loop on top of the existing approve/reject flow without making admin edits silently overwrite tripper work. The mechanism is a **lazy review copy**: on the admin's first edit, a duplicate `Experience` row is created (`isReviewCopy=true`, `parentId` → original). The admin edits the copy through the same `NewExperienceShell` form; the original stays untouched and reversible. A new status `PENDING_TRIPPER_REVIEW` plus a tripper re-review screen close the loop. All destructive transitions run inside `prisma.$transaction`. This maps directly to the proposal's lazy copy-on-first-edit approach (see `specs/`).

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Copy storage | Same `Experience` table, flagged `isReviewCopy` + `parentId` | Separate `ExperienceRevision` table; JSON snapshot column | Reuses the existing model, form, validation, and autosave with only an endpoint switch. No new schema surface to maintain. |
| Form editability | `mode: 'tripper'\|'adminEdit'\|'adminReadOnly'` prop drives `isReadOnly` | Keep status-based `isReadOnly` (current line 134) | Status alone can't distinguish "admin viewing a PENDING_REVIEW original read-only" from "admin editing its copy". Mode decouples editability from status. |
| Concurrency control | Soft lock via `reviewLockedBy` checked inside a transaction | Pessimistic DB lock; optimistic version column; no lock | A soft lock is enough for a low-contention admin team; the transactional check wins the race deterministically and returns 409 with locker identity. |
| changedFields timing | Computed at `send-to-tripper`, deep-compare copy vs original | Track per-keystroke; recompute on tripper view | The diff only matters when the tripper is asked to review; computing once at hand-off is cheapest and correct. |
| Atomicity | Single `prisma.$transaction` per destructive transition | Sequential awaits | Overwrite + delete-copy + status change must not partially apply, or the original could be corrupted or orphaned copies left behind. |
| Copy creation | Lazy (on first edit), not on entering review | Eager copy at submit | Avoids creating copies for experiences that get approved/rejected directly with no edits. |

## Data Flow

State machine (7 transitions):

```
DRAFT ──submit──► PENDING_REVIEW
  PENDING_REVIEW ──approve(no copy)──► ACTIVE
  PENDING_REVIEW ──reject──► DRAFT
  PENDING_REVIEW ──start-edit──► PENDING_REVIEW (+ copy, locked)
    copy ──send-to-tripper──► original: PENDING_TRIPPER_REVIEW
      ──approve-copy──► overwrite original ► ACTIVE (copy hard-deleted)
      ──reject-copy──► original: DRAFT, copy: INACTIVE
    copy ──discard-copy──► copy deleted, lock cleared, original: PENDING_REVIEW
  PENDING_REVIEW ──approve(copy exists)──► overwrite original ► ACTIVE (copy deleted)
DRAFT ──submit (resubmit)──► delete INACTIVE copy, PENDING_REVIEW
```

```
Admin form (adminEdit) ──autosave──► PATCH /admin/experiences/{adminCopyId}  ── copy row
Tripper review screen (adminReadOnly) ──approve/reject──► tripper endpoints ── original row
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add enum `PENDING_TRIPPER_REVIEW`; add `isReviewCopy`, `parentId`, `changedFields String[]`, `reviewLockedBy` to `Experience` |
| `src/app/api/admin/experiences/[id]/start-edit/route.ts` | Create | Lazy copy + transactional soft-lock |
| `.../send-to-tripper/route.ts` | Create | Compute `changedFields`, set original → `PENDING_TRIPPER_REVIEW`, email |
| `.../discard-copy/route.ts` | Create | Delete copy, clear lock |
| `src/app/api/tripper/experiences/[id]/approve-copy/route.ts` | Create | Transactional overwrite + copy delete, email admin |
| `.../reject-copy/route.ts` | Create | Copy → INACTIVE, original → DRAFT, email admin |
| `.../admin/experiences/[id]/approve/route.tsx` | Modify | Branch: copy exists → overwrite+delete; else direct ACTIVE (current behavior) |
| `.../tripper/experiences/[id]/submit/route.ts` | Modify | Delete INACTIVE copy on resubmit |
| `.../tripper/experiences/[id]/route.ts` (PATCH) | Modify | 403 guard when `status === PENDING_TRIPPER_REVIEW` |
| `NewExperienceShell.tsx`, `ExperienceFormContent.tsx` | Modify | `mode` + `adminCopyId` props; mode-based `isReadOnly`; autosave routes to copy endpoint; `changedFields` highlight |
| `.../admin/.../experiences/[id]/page.tsx`, `AdminReviewSlot.tsx` | Modify | Pass `mode`; soft-lock banner; new action buttons |
| `.../tripper/experiences/[id]/review-copy/page.tsx` | Create | Read-only copy + `changedFields` sidebar + approve/reject |
| Email templates + `src/lib/email/index.ts` | Create/Modify | 3 senders + es/en copy (uses existing `sendMail` from `src/lib/helpers/sendMail.ts`) |

## Interfaces / Contracts

```prisma
// Experience additions
isReviewCopy   Boolean  @default(false)
parentId       String?
changedFields  String[] @default([])
reviewLockedBy String?
// ExperienceStatus: + PENDING_TRIPPER_REVIEW
```

**Soft-lock (start-edit)** — single transaction:
```
tx: read original {status, reviewLockedBy, existing copy by parentId}
  if reviewLockedBy && != callerId  → throw 409 (return locker)
  if copy exists                     → return its id (idempotent re-entry)
  else create copy (isReviewCopy, parentId=original.id) + set reviewLockedBy=callerId
```

**Copy → original overwrite (approve-copy / approve-with-copy)** — single transaction.
Overwrite: `title, slug, description, teaser, type, level, heroImage, galleryImages, activities, hotels, itinerary, inclusions, exclusions, destinationCountry, destinationCity, pricingByType, tags, highlights, nights (min/max), minPax, maxPax`; set `changedFields=[]`.
Preserve: `id, ownerId, createdAt, isReviewCopy(false), parentId(null), reviewLockedBy(null), reviewNote(null)`.
Then `status=ACTIVE, isActive=true`; hard-delete the copy row.

**changedFields computation (send-to-tripper)**: deep-compare each mutable field copy vs original. JSON fields (`hotels, activities, itinerary, pricingByType`, plus `inclusions/exclusions`) compared via `JSON.stringify`; scalars/arrays via `===`/element compare. Return field names that differ.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `changedFields` deep-compare incl. JSON fields | Pure function test, fixtures for each field type |
| Unit | Overwrite field map (overwrite vs preserve) | Snapshot of resulting row given copy+original |
| Integration | Soft-lock 409 on concurrent start-edit | Two callers hit `start-edit`; assert second gets 409 + locker |
| Integration | approve-copy atomicity, INACTIVE-copy cleanup on resubmit | DB assertions after each transition |
| E2E | Full 7-transition loop + both-direction emails | Manual QA per success criteria |

## Migration / Rollout

Prisma migration adds one enum value + four nullable/defaulted columns — additive and backward-compatible; apply to all environments before deploying code (proposal dependency). No data backfill: existing rows default `isReviewCopy=false`, `changedFields=[]`, nulls elsewhere. Rollback only after confirming no rows use `PENDING_TRIPPER_REVIEW` or `isReviewCopy=true`.

## Open Questions

- [ ] Overwrite `slug`: original tripper experiences have null `slug`; confirm copy never sets one so the `@unique` constraint can't collide (preserve original `slug` if non-null).
