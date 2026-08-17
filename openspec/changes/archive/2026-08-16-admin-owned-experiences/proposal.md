# Proposal: Admin-Owned (RandomTrip) Experiences

## Intent

Today every `Experience` is owned by a `User`, created via one of two paths: a tripper's `POST /api/tripper/experiences` (own `ownerId`, goes through the `DRAFT → PENDING_REVIEW → ACTIVE` approval pipeline) or an admin's `POST /api/admin/xsed` (own `ownerId`, `type: ["XSED"]`, self-published). There is no way for an admin to create a **generic (non-XSED) experience owned by RandomTrip itself** rather than by a specific tripper. This change adds that capability and introduces a single, immutable ownership signal (`source`) to replace the current implicit, drift-prone `owner.roles` check.

## Scope

### In Scope

- New admin "New Experience" flow producing generic experiences owned by RandomTrip.
- Add `source: ExperienceSource` enum (`TRIPPER | RANDOMTRIP`) to the `Experience` model — distinct from `type: String[]` (travel category).
- Admin-created generic experiences auto-publish `DRAFT → ACTIVE` (no `PENDING_REVIEW`), mirroring XSED self-publish.
- Make `POST /api/tripper/experiences` and its multi-step "New Experience" form **role-aware** and reuse them for the admin flow (no parallel endpoint).
- Server-derive `source` from the route/UI section that creates the row; ignore/reject any client-sent `source`.
- New admin dashboard "New Experience" tab, parallel to the XSED "New Drop" tab, reusing the tripper form component with role-aware behavior.
- Hide/omit the commission field when the creator is admin (source `RANDOMTRIP`); keep it shown/required for trippers.
- Refactor `src/app/api/reviews/route.ts` commission attribution from `owner.roles.includes("TRIPPER")` to `experience.source === "TRIPPER"`.
- Prisma migration: add `source` with `@default(TRIPPER)` + one-time backfill `UPDATE "Experience" SET source = 'RANDOMTRIP' WHERE 'XSED' = ANY(type)`.
- New/updated `es` + `en` dictionary entries for all new admin UI copy (tab label, form differences).

### Out of Scope (Non-Goals)

- **Booking/consumption UI or filtering** — the only path assigning `experienceId` to a generic `TripRequest` is a manual, unfiltered admin action (`PATCH /api/admin/trip-requests/[id]`, bare `findUnique` with no owner/status/type filter). RANDOMTRIP experiences are already assignable there with zero code change.
- Changing the tripper approval pipeline or XSED creation flow.
- Removing or reworking `type: ["XSED"]` (kept as-is; still drives XSED-specific fields/behavior).
- Making `source` user-selectable.

## Capabilities

### New Capabilities

- None (extends existing experience-authoring capability; no net-new spec file).

### Modified Capabilities

- `experience-approval-flow` (or equivalent existing spec): admin/RandomTrip creation path auto-publishes; commission conditional; `source` becomes the ownership source of truth for review attribution.

## Approach

Introduce `source` as the single, immutable ownership signal on `Experience`, decoupled from the overloaded `type` array and from mutable `owner.roles`. Rather than duplicate an endpoint, make the tripper creation route and form role-aware: an admin caller sets `source: RANDOMTRIP`, skips `PENDING_REVIEW` (auto-`ACTIVE`), and hides the commission field; a tripper caller behaves exactly as today. `source` is always server-derived from the calling context — never trusted from the request body. Existing XSED drops are retroactively unified to `source: RANDOMTRIP` via backfill, so `source` cleanly describes ownership across the whole model without disturbing XSED's `type` tag.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `ExperienceSource` enum + `source` field (`@default(TRIPPER)`) on `Experience` |
| `prisma/migrations/` | New | Additive column + one-time XSED → `RANDOMTRIP` backfill |
| `src/app/api/tripper/experiences/route.ts` | Modified | Role-aware: derive `source`, admin auto-`ACTIVE`, commission conditional |
| Multi-step "New Experience" form component | Modified | Role-aware; hide commission field for admin |
| Admin dashboard `src/app/[locale]/.../dashboard/admin/...` | New | "New Experience" tab parallel to XSED "New Drop" |
| `src/app/api/reviews/route.ts` (33-37) | Modified | Attribution via `experience.source === "TRIPPER"` |
| `src/dictionaries/{es,en}.json` | Modified | New admin tab + form copy in both locales |
| `src/lib/types/dictionary.ts` | Modified | Types for any new dictionary section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backfill mis-tags rows (matches XSED substring vs. exact array element) | Med | Use exact `'XSED' = ANY(type)`; verify count before/after against known XSED set |
| Role-aware route leaks admin behavior to trippers (or vice-versa) | Med | Derive `source`/status server-side from authenticated role only; reject client `source` |
| Hidden commission field UX / stale default persisted for RANDOMTRIP rows | Med | Omit field from admin payload; ensure server nulls/ignores commission when `RANDOMTRIP` |
| New admin UI drifts from design system | Low | Follow `.claude/rules/design-system.md` + `component-patterns.md`; reuse existing tab/form primitives |
| Untranslated admin copy | Low | Enforce dual `es`/`en` dictionary entries per `i18n-and-types.md` |

## Rollback Plan

Revert the change commits. The `source` column is additive with a safe default (`TRIPPER`), so schema rollback is low-risk; drop the column via a down migration if needed. The backfill is idempotent and reversible (`UPDATE ... SET source = 'TRIPPER' WHERE 'XSED' = ANY(type)`) but leaves any admin-created generic experiences without a distinguishing marker — reconcile before rollback if such rows exist in production.

## Dependencies

- Prisma migration coordination (`db:migrate` / `db:push`) with the backfill step.

## Success Criteria

- [ ] Admin can create a generic experience that persists with `source: RANDOMTRIP` and status `ACTIVE` (no `PENDING_REVIEW`).
- [ ] Tripper creation flow unchanged: `source: TRIPPER`, approval pipeline intact, commission required.
- [ ] `source` is server-derived; client-sent `source` is ignored/rejected.
- [ ] Existing XSED drops backfilled to `source: RANDOMTRIP` with `type: ["XSED"]` preserved.
- [ ] `reviews/route.ts` attributes commission via `experience.source`.
- [ ] Commission field hidden for admin creation, shown/required for trippers.
- [ ] New admin UI follows the design system; all copy present in `es` and `en`.
- [ ] `npm run typecheck` and `npm run lint` pass.
