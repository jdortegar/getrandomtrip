# Delta Spec: experience-approval-flow-v2

## Change: `experience-approval-flow-v2`

Two new capabilities and one modified capability. New capabilities get full specs; the modified capability is a delta against `openspec/specs/experience/spec.md`.

---

# experience-admin-edit Specification (NEW)

## Purpose

Allows an admin to edit all fields of a `PENDING_REVIEW` experience via a lazy review copy before sending proposed changes to the tripper for acceptance. The original is never overwritten until the tripper explicitly approves.

## Requirements

### Requirement: Lazy Copy Creation

The system MUST create exactly one review copy per original experience per approval cycle. The copy MUST be created on the admin's first edit, inside a single transaction that also sets `reviewLockedBy` on the original. The copy MUST have `isReviewCopy = true` and `parentId` pointing to the original's `id`. Identity fields (`id`, `ownerId`, `createdAt`, `slug`) MUST NOT be copied — the copy receives its own generated `id`. If a non-INACTIVE copy already exists for the original, the system MUST NOT create a second copy.

#### Scenario: First admin edit creates copy

- GIVEN an experience in `PENDING_REVIEW` with no existing review copy
- WHEN an admin triggers the start-edit action
- THEN a new Experience row is created with `isReviewCopy = true` and `parentId = original.id`
- AND `reviewLockedBy` is set to the acting admin's id on the original
- AND the copy has its own unique `id` distinct from the original

#### Scenario: Second start-edit on same experience is blocked

- GIVEN an experience in `PENDING_REVIEW` with an existing non-INACTIVE review copy
- WHEN a different admin triggers start-edit
- THEN the API MUST return 409 with the locking admin's identity
- AND no second copy is created

#### Scenario: Copy identity fields are independent

- GIVEN a review copy was created
- WHEN the copy record is inspected
- THEN `copy.id`, `copy.ownerId`, `copy.createdAt`, and `copy.slug` differ from the original's values

---

### Requirement: Admin Edit Scope

While editing the review copy, the admin MUST be able to modify all fields available in `NewExperienceShell`, including media fields. Autosave MUST route to the copy's endpoint (keyed by `adminCopyId`), not to the original. The original MUST remain unchanged during admin editing.

#### Scenario: Autosave routes to copy

- GIVEN an admin is editing the review copy
- WHEN an autosave fires
- THEN the PATCH request targets the copy record (via `adminCopyId`)
- AND the original record is unmodified

#### Scenario: Original read-only during admin edit

- GIVEN a review copy exists and `reviewLockedBy` is set
- WHEN the original's direct edit endpoint is called
- THEN the API MUST return 409 indicating the experience is locked for review editing

---

### Requirement: Discard Copy

The admin MUST be able to discard the review copy at any time before sending it to the tripper. Discarding MUST delete the copy record and clear `reviewLockedBy` on the original in a single transaction. After discard, the original MUST return to `PENDING_REVIEW` with no lock.

#### Scenario: Discard removes copy and clears lock

- GIVEN a review copy exists and the original has `reviewLockedBy` set
- WHEN the admin triggers discard-copy
- THEN the copy record is hard-deleted
- AND `reviewLockedBy` on the original is set to `null`
- AND the original's status remains `PENDING_REVIEW`

---

### Requirement: changedFields Computation

When the admin sends the copy to the tripper, the system MUST compute `changedFields` by deep-comparing the copy's field values against the original's. The result MUST be stored on the copy record. `changedFields` MUST contain at least one entry — the system MUST NOT allow sending a copy with zero changed fields.

#### Scenario: changedFields populated on send

- GIVEN the admin edited the copy's `description` and `heroImage`
- WHEN the admin triggers send-to-tripper
- THEN `copy.changedFields` contains `["description", "heroImage"]`

#### Scenario: No-change send is rejected

- GIVEN the admin opened the copy but made no edits
- WHEN the admin attempts to send-to-tripper
- THEN the API MUST return 422 with a message indicating no fields were changed

---

### Requirement: Send to Tripper Action

Sending the copy to the tripper MUST transition the original's status to `PENDING_TRIPPER_REVIEW`, clear `reviewLockedBy`, and trigger an email notification to the tripper. The copy MUST persist (not be deleted) with `changedFields` populated.

#### Scenario: Send transitions original status

- GIVEN a review copy with at least one changed field
- WHEN the admin confirms send-to-tripper
- THEN the original status becomes `PENDING_TRIPPER_REVIEW`
- AND `reviewLockedBy` on the original is cleared
- AND the tripper receives an email notification

#### Scenario: Form mode becomes read-only after send

- GIVEN the admin just sent the copy to the tripper
- WHEN either admin views the original experience
- THEN the form renders in `adminReadOnly` mode (no further editing)

---

### Requirement: Soft-Lock Warning

When an admin opens a `PENDING_REVIEW` experience that is already locked by another admin, the system MUST display a soft-lock warning banner identifying the locking admin. The second admin MUST NOT be able to start a new edit.

#### Scenario: Warning shown when locked

- GIVEN admin A holds the lock on experience X
- WHEN admin B opens experience X in the admin panel
- THEN a warning banner is visible showing admin A's name/email
- AND the start-edit button is disabled for admin B

---

## API Contracts

| Endpoint | Auth | Precondition | Success | Error |
|----------|------|--------------|---------|-------|
| `POST /api/admin/experiences/[id]/start-edit` | ADMIN | `PENDING_REVIEW`, no active copy | 201 copy created, `reviewLockedBy` set | 409 locked / 403 not admin |
| `POST /api/admin/experiences/[id]/send-to-tripper` | ADMIN | copy exists, `changedFields` non-empty | 200, original → `PENDING_TRIPPER_REVIEW` | 422 no changes / 403 / 409 |
| `POST /api/admin/experiences/[id]/discard-copy` | ADMIN | copy exists | 200, copy deleted, lock cleared | 403 / 404 no copy |

---

# experience-tripper-review Specification (NEW)

## Purpose

Allows the tripper to review the admin's proposed copy read-only, inspect which fields changed, and either approve (overwriting the original atomically) or reject (keeping the copy as an INACTIVE reference and reverting the original to DRAFT).

## Requirements

### Requirement: Tripper Review Screen

The system MUST provide a read-only view of the review copy when the original is in `PENDING_TRIPPER_REVIEW`. The view MUST display the `changedFields` list so the tripper knows exactly what the admin changed. All inputs MUST be disabled — the tripper cannot edit the copy.

#### Scenario: Review screen shows changed fields

- GIVEN an original in `PENDING_TRIPPER_REVIEW` with a review copy
- WHEN the tripper opens the experience
- THEN a read-only form renders in `adminReadOnly` mode
- AND a `changedFields` summary is visible (e.g. "Admin changed: description, heroImage")

#### Scenario: PATCH blocked during PENDING_TRIPPER_REVIEW

- GIVEN an experience in `PENDING_TRIPPER_REVIEW`
- WHEN any PATCH request is sent to the tripper experiences endpoint
- THEN the API MUST return 409

---

### Requirement: Tripper Approve Copy

When the tripper approves, the system MUST overwrite the original with the copy's data in a single transaction. Identity fields (`id`, `ownerId`, `createdAt`, `slug`) MUST NOT be overwritten. After overwrite, the copy MUST be hard-deleted and the original MUST transition to `ACTIVE`. An email MUST be sent to the admin confirming tripper approval.

#### Scenario: Approve overwrites original atomically

- GIVEN a review copy with `changedFields: ["description"]`
- WHEN the tripper approves
- THEN the original's `description` matches the copy's `description`
- AND the copy record no longer exists
- AND the original status is `ACTIVE`
- AND the original's `id`, `ownerId`, `createdAt`, and `slug` are unchanged

#### Scenario: Admin receives email on tripper approval

- GIVEN the tripper approved the copy
- WHEN the transaction completes
- THEN an email is sent to the admin notifying them of the approval

---

### Requirement: Tripper Reject Copy

When the tripper rejects, the copy MUST be set to `INACTIVE` (not deleted) as a reference. The original MUST transition to `DRAFT`. An email MUST be sent to the admin. The tripper may then edit and resubmit the original.

#### Scenario: Reject preserves copy as INACTIVE

- GIVEN an original in `PENDING_TRIPPER_REVIEW` with a review copy
- WHEN the tripper rejects
- THEN the copy status becomes `INACTIVE`
- AND the original status becomes `DRAFT`
- AND the admin receives an email notification

#### Scenario: Tripper can edit after reject

- GIVEN the original is now in `DRAFT` after tripper rejection
- WHEN the tripper opens the experience form
- THEN all inputs are editable (standard DRAFT behavior)

---

### Requirement: INACTIVE Copy Cleanup on Resubmit

When a tripper submits a `DRAFT` experience that has an associated `INACTIVE` review copy, the system MUST hard-delete that `INACTIVE` copy in the same transaction as the status transition to `PENDING_REVIEW`.

#### Scenario: Resubmit cleans up INACTIVE copy

- GIVEN an experience in `DRAFT` with an associated `INACTIVE` review copy
- WHEN the tripper submits for review
- THEN the experience transitions to `PENDING_REVIEW`
- AND the INACTIVE copy is hard-deleted
- AND no orphaned copy records remain

---

## API Contracts

| Endpoint | Auth | Precondition | Success | Error |
|----------|------|--------------|---------|-------|
| `POST /api/tripper/experiences/[id]/approve-copy` | TRIPPER (owner) | `PENDING_TRIPPER_REVIEW`, copy exists | 200, original → `ACTIVE`, copy deleted | 403 / 409 |
| `POST /api/tripper/experiences/[id]/reject-copy` | TRIPPER (owner) | `PENDING_TRIPPER_REVIEW`, copy exists | 200, copy → `INACTIVE`, original → `DRAFT` | 403 / 409 |

---

# Delta for admin-experience-review + experience-review-lifecycle (MODIFIED)

## MODIFIED Requirements

### Requirement: Status State Machine

The system MUST enforce the following lifecycle for Experience records:

- `DRAFT` → `PENDING_REVIEW` (tripper submits; INACTIVE copy cleaned up if present)
- `PENDING_REVIEW` → `ACTIVE` (admin approves directly, no copy)
- `PENDING_REVIEW` → `DRAFT` (admin rejects directly)
- `PENDING_REVIEW` → `PENDING_TRIPPER_REVIEW` (admin edits + sends copy to tripper)
- `PENDING_TRIPPER_REVIEW` → `ACTIVE` (tripper approves copy)
- `PENDING_TRIPPER_REVIEW` → `DRAFT` (tripper rejects copy)
- `ACTIVE` → `DRAFT` (tripper edits; reverts to draft, loses ACTIVE)

No other direct transitions are permitted.

(Previously: only 4 transitions existed; `PENDING_TRIPPER_REVIEW` did not exist.)

#### Scenario: Happy path — submit → approve (no copy)

- GIVEN an experience in `DRAFT` with all required fields complete
- WHEN a tripper submits for review
- THEN status becomes `PENDING_REVIEW`
- AND the experience is read-only for the tripper until admin acts

#### Scenario: Admin approves directly — no copy path

- GIVEN an experience in `PENDING_REVIEW` with no review copy
- WHEN an admin approves with valid `pricingByType`
- THEN status becomes `ACTIVE`
- AND `pricingByType` is persisted on the record

#### Scenario: Admin approves — copy exists path

- GIVEN an experience in `PENDING_REVIEW` with an existing review copy
- WHEN an admin approves
- THEN the copy data is used to overwrite the original (same atomic overwrite as tripper approve)
- AND the copy is hard-deleted
- AND status becomes `ACTIVE`

#### Scenario: Rejection returns to DRAFT

- GIVEN an experience in `PENDING_REVIEW`
- WHEN an admin rejects with a non-empty `reviewNote`
- THEN status becomes `DRAFT`
- AND `reviewNote` is persisted on the record
- AND the tripper can edit the experience again

#### Scenario: Invalid transition rejected

- GIVEN an experience in `ACTIVE` status
- WHEN a request attempts to set status directly to `PENDING_REVIEW` without going through `DRAFT`
- THEN the API MUST return a 422 error

---

### Requirement: Approve Action

The "Approve" button MUST be disabled until all per-type price inputs have a positive numeric value (direct path). On click, the system MUST call `POST /api/admin/experiences/[id]/approve` with `pricingByType`. The approve endpoint MUST check whether a review copy exists. If a copy exists, the endpoint MUST perform the copy→original overwrite atomically before setting `ACTIVE`. If no copy exists, the endpoint MUST follow the existing direct-approve path. On success, the experience MUST be `ACTIVE`, the side panel MUST close, and the row MUST disappear from the Pending Review tab.

(Previously: approve always followed the direct path; no copy-based branch existed.)

#### Scenario: Approve disabled without prices

- GIVEN the side panel is open with two price inputs unfilled
- WHEN the admin clicks "Approve"
- THEN the action is prevented (button disabled or form validation blocks submission)

#### Scenario: Direct approve — no copy

- GIVEN all per-type price inputs are filled and no review copy exists
- WHEN the admin clicks "Approve" and the API succeeds
- THEN the experience becomes `ACTIVE`
- AND the row is removed from the Pending Review tab

#### Scenario: Copy-based approve

- GIVEN a review copy exists for the experience
- WHEN the admin clicks "Approve"
- THEN the copy data overwrites the original atomically
- AND the copy is deleted
- AND the experience becomes `ACTIVE`

---

## ADDED Requirements

### Requirement: ExperienceStatus Enum Extension

The `ExperienceStatus` Prisma enum MUST include `PENDING_TRIPPER_REVIEW` as a valid value. All TypeScript types and runtime constants that reference `ExperienceStatus` MUST be updated to handle the new value.

#### Scenario: New status accepted at API boundary

- GIVEN `PENDING_TRIPPER_REVIEW` is added to the enum
- WHEN `npm run typecheck` is run
- THEN no unhandled switch/union errors are reported for `ExperienceStatus`

---

### Requirement: Schema Fields for Review Copy

The `Experience` Prisma model MUST include:

| Field | Type | Default | Rule |
|-------|------|---------|------|
| `isReviewCopy` | `Boolean` | `false` | `true` only on copy rows |
| `parentId` | `String?` | `null` | foreign key to original; set only on copy rows |
| `changedFields` | `String[]` | `[]` | populated at send-to-tripper time |
| `reviewLockedBy` | `String?` | `null` | admin id; cleared on discard or send |

#### Scenario: Invariant — original is never a copy

- GIVEN any Experience row where `isReviewCopy = false`
- THEN `parentId` MUST be `null`

#### Scenario: Invariant — copy always has parent

- GIVEN any Experience row where `isReviewCopy = true`
- THEN `parentId` MUST be a non-null id of an existing Experience

#### Scenario: Invariant — one active copy per original

- GIVEN an original experience X
- THEN at most one Experience row with `parentId = X.id` and status not `INACTIVE` MAY exist at any time

---

### Requirement: Email Notifications — New Transitions

The system MUST send email notifications for all new state transitions:

| Trigger | Direction | Content |
|---------|-----------|---------|
| Admin sends copy to tripper | Admin → Tripper | "Admin has suggested changes to your experience" |
| Tripper approves copy | Tripper → Admin | Notification of tripper approval |
| Tripper rejects copy | Tripper → Admin | Notification of tripper rejection |

Existing notifications (tripper submits → admin, admin approves/rejects → tripper) MUST remain unchanged.

#### Scenario: Tripper receives email when admin sends copy

- GIVEN admin has sent a review copy to the tripper
- WHEN the send-to-tripper transaction completes
- THEN the tripper's email address receives a notification email

#### Scenario: Admin receives email when tripper acts

- GIVEN the tripper approves or rejects the review copy
- WHEN the transaction completes
- THEN the admin receives an email indicating the tripper's decision

#### Scenario: Emails are locale-aware

- GIVEN both `es` and `en` email templates exist for each new notification
- WHEN an email is sent
- THEN the template rendered matches the recipient's preferred locale

---

## Schema Delta (experience-approval-flow-v2 additions)

| Change | Detail |
|--------|--------|
| `ExperienceStatus` enum | Add `PENDING_TRIPPER_REVIEW` value |
| `Experience.isReviewCopy` | Added as `Boolean @default(false)` |
| `Experience.parentId` | Added as `String?` |
| `Experience.changedFields` | Added as `String[] @default([])` |
| `Experience.reviewLockedBy` | Added as `String?` |

---

## Cross-Cutting Requirements

### Requirement: Form Mode Prop

`NewExperienceShell` MUST accept a `mode` prop with values `tripper | adminEdit | adminReadOnly`. The `mode` prop MUST control editability of all form inputs. `adminCopyId` MUST be accepted to route autosave to the copy endpoint in `adminEdit` mode.

#### Scenario: adminReadOnly disables all inputs

- GIVEN `mode = "adminReadOnly"`
- WHEN `NewExperienceShell` renders
- THEN all form inputs are disabled regardless of the experience's status

#### Scenario: adminEdit routes autosave to copy

- GIVEN `mode = "adminEdit"` and `adminCopyId` is provided
- WHEN an autosave fires
- THEN the PATCH request targets the copy identified by `adminCopyId`

---

### Requirement: Type and Lint Compliance

After all changes, `npm run typecheck` and `npm run lint` MUST pass with zero errors. All new status values MUST be handled in every switch/conditional that covers `ExperienceStatus`.

#### Scenario: No unhandled status in switch statements

- GIVEN `PENDING_TRIPPER_REVIEW` is added to `ExperienceStatus`
- WHEN `npm run typecheck` runs
- THEN no unhandled union member errors are reported
