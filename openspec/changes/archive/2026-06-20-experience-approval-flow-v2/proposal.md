# Proposal: Experience Approval Flow v2 (Admin Edit + Tripper Re-Review)

## Intent

Today an admin can only approve or reject a `PENDING_REVIEW` experience as-is. There is no path for an admin to refine a tripper's submission and let the tripper approve those edits before it goes live. v2 adds an admin editing loop with a reversible copy and a tripper re-review step, so content quality improves without admins silently overwriting tripper work.

## Scope

### In Scope
- New status `PENDING_TRIPPER_REVIEW` and the full 7-transition state machine.
- Lazy review copy in the `Experience` table (`isReviewCopy`, `parentId`, `changedFields`) created on the admin's first edit.
- Soft lock (`reviewLockedBy`) with a warning banner and a transactional 409 guard.
- Admin actions: approve, reject, start-edit, send-to-tripper, discard-copy.
- Tripper re-review screen (read-only copy + `changedFields`) with approve/reject.
- Atomic copy→original overwrite on tripper approve; copy→INACTIVE on reject; INACTIVE cleanup on resubmit.
- Shared form via `NewExperienceShell` `mode` prop (`tripper | adminEdit | adminReadOnly`) + `adminCopyId` autosave routing.
- 3 new transactional email senders (both directions) + es/en copy.

### Out of Scope
- Multi-round admin↔tripper negotiation history (single copy per cycle only).
- Field-level diff UI beyond `changedFields` highlighting.
- Versioning/audit log of past approval cycles.
- Changes to non-experience approval flows (packages, blog posts).

## Capabilities

### New Capabilities
- `experience-admin-edit`: admin lazy-copy editing, soft lock, discard, send-to-tripper.
- `experience-tripper-review`: tripper re-review of admin copy with approve/reject and overwrite semantics.

### Modified Capabilities
- `experience-approval`: existing approve/reject extended with copy-based branch and new state machine.

## Approach

Lazy copy-on-first-edit keeps the original intact and reversible. The copy lives in the same `Experience` table flagged by `isReviewCopy` so the existing form and autosave reuse the model with only an endpoint switch via `adminCopyId`. Status (not a separate `isReadOnly`) plus the `mode` prop drives form editability. All destructive transitions (overwrite, discard, resubmit cleanup) run inside `prisma.$transaction`; `start-edit` uses a transactional `reviewLockedBy` check to win the lock race. `changedFields` is computed by deep-comparing copy vs original at send-to-tripper time. Resend (already wired) fires on every transition in both directions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | New enum value + 4 fields on `Experience` |
| `src/types/tripper.ts`, `src/lib/admin/types.ts`, `src/lib/constants/packages.ts` | Modified | New status across types/constants |
| `src/app/api/admin/experiences/[id]/{start-edit,send-to-tripper,discard-copy}/route.ts` | New | Admin copy lifecycle endpoints |
| `src/app/api/tripper/experiences/[id]/{approve-copy,reject-copy}/route.ts` | New | Tripper re-review endpoints |
| `src/app/api/admin/experiences/[id]/{approve,reject}/route.tsx` | Modified | Direct vs copy branching, scope guard |
| `src/app/api/tripper/experiences/[id]/{submit,route}.ts` | Modified | INACTIVE copy cleanup, PATCH guard |
| `NewExperienceShell.tsx`, `ExperienceFormContent.tsx` | Modified | `mode` + `adminCopyId` props, `changedFields` highlight |
| Admin/Tripper page clients + review-copy page | New/Modified | Status badges, action buttons, re-review screen |
| `src/lib/email/index.ts` + 2 email templates | New/Modified | 3 senders, es/en copy |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Soft-lock race | Med | Transactional `reviewLockedBy` check, 409 with locker info |
| Non-atomic copy→original overwrite | Med | Single `prisma.$transaction`, preserve id/owner/createdAt/slug |
| Editability decoupled from status | Med | `mode` prop drives form, not status flag |
| Autosave hits wrong row in admin mode | Med | `adminCopyId` routes autosave to copy endpoint |
| `changedFields` wrong for JSON fields | Low | Deep compare at send-to-tripper time |
| Email direction confusion | Low | Distinct template per direction |

## Rollback Plan

Revert the migration (drop enum value + 4 fields) only after confirming no rows use `PENDING_TRIPPER_REVIEW` or `isReviewCopy=true`. Code is additive: new endpoints/pages can be removed and `approve`/`reject` reverted to prior commit. Feature is gated by the new status, so reverting the UI buttons disables the flow without data loss on in-flight `PENDING_REVIEW` items.

## Dependencies

- Resend email integration (already wired).
- Prisma migration applied to all environments before deploying code.

## Success Criteria

- [ ] All 7 state transitions work end-to-end with correct emails both directions.
- [ ] Lazy copy created only on first admin edit; never duplicated per cycle.
- [ ] Concurrent admin edit returns 409 with locker identity.
- [ ] Tripper approve overwrites original atomically and hard-deletes copy.
- [ ] Tripper reject leaves INACTIVE copy and reverts original to DRAFT; resubmit cleans it up.
- [ ] `npm run typecheck` and `npm run lint` pass.
