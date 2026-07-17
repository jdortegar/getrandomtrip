# Tasks: Admin-Owned (RandomTrip) Experiences

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300–380 (schema ~10, backfill script ~50, package.json ~1, tripper POST route ~10, submit route ~40, reviews route ~15, NewExperienceShell ~60, admin new/page.tsx ~35, adminNav/adminHeadings ~10, dictionary.ts ~15, es.json+en.json ~40, tests ~50-70) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (user-selected single-pr) |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

Single PR per user's explicit choice. If the actual diff crosses ~400 lines during apply, record `size:exception` per the `single-pr` delivery-strategy rule rather than splitting — do not propose chained/stacked PRs for this change.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Everything below (Phases 1–7) | PR 1 (single) | `size:exception` recorded if diff exceeds ~400 lines |

---

## Phase 1: Schema & Backfill

- [x] 1.1 `prisma/schema.prisma` — add `enum ExperienceSource { TRIPPER RANDOMTRIP }`; add `source ExperienceSource @default(TRIPPER)` on `Experience` after `status` (line ~163). Satisfies spec "Experience Ownership Source".
- [ ] 1.2 Run `npm run db:push` to apply the additive column. **BLOCKED in apply sandbox — no reachable local Postgres (no `psql`/`docker`/`DATABASE_URL`). `npx prisma generate` was run successfully so the Prisma Client types include `source`/`ExperienceSource`, and `npm run typecheck` passes. The user must run `npm run db:push` locally/in CI before merge.**
- [x] 1.3 RED — write `scripts/__tests__/backfill-experience-source.test.ts` asserting the query shape: `updateMany({ where: { type: { has: "XSED" } }, data: { source: "RANDOMTRIP" } })` matches only exact-array-element XSED rows, not substring matches. Satisfies spec "XSED Ownership Backfill".
- [x] 1.4 GREEN — created `scripts/backfill-experience-source.ts`: exports `backfillExperienceSource(client)` (testable, mockable), runs the `updateMany`, logs matched count before/after; only auto-runs when executed directly via `npx tsx` (guarded by `process.argv[1]` check), not on import.
- [x] 1.5 `package.json` — added `"db:backfill-source": "npx tsx scripts/backfill-experience-source.ts"`.
- [ ] 1.6 Run `npm run db:backfill-source` once against local DB. **BLOCKED — same reason as 1.2 (no reachable local DB in this sandbox).** Unit test coverage (1.3/1.4) verifies the query shape and idempotency logic in isolation; the user must run this against a real DB after `db:push`.

## Phase 2: Role-Aware Creation Endpoint

- [x] 2.1 `src/app/api/tripper/experiences/route.ts` — compute `isAdmin = getAppRoles(user).includes("admin")`; set `source: isAdmin ? "RANDOMTRIP" : "TRIPPER"` in `create.data`; kept `status: "DRAFT"` for both roles; client-sent `source` ignored (not in `ExperienceFormDraft`). Satisfies spec "Role-Aware Experience Creation Endpoint" (creation half), "Source derived from admin/tripper caller".
- [x] 2.2 Created `src/app/api/tripper/experiences/__tests__/route.test.ts` (new file — none existed) asserting: admin caller → `source: RANDOMTRIP`, `status: DRAFT`; tripper caller → `source: TRIPPER`, `status: DRAFT`; client-sent `source` in body has no effect. 3/3 passing.

## Phase 3: Auto-Publish & RANDOMTRIP Pricing in Submit Finalizer

- [x] 3.1 RED — extended `src/app/api/tripper/experiences/[id]/submit/__tests__/route.test.ts` with failing cases: (a) `source: RANDOMTRIP` → `ACTIVE`, no `sendExperienceSubmitted` call, no `PENDING_REVIEW`; (b) `source: TRIPPER` → unchanged existing behavior; (c) RANDOMTRIP `pricingByType` derived per non-XSED `type` from `getBasePricePerPerson(type, level)`, XSED excluded from a mixed-type row.
- [x] 3.2 GREEN — `src/app/api/tripper/experiences/[id]/submit/route.ts`: reads `source`/`level` on the loaded experience; branches `targetStatus = source === "RANDOMTRIP" ? "ACTIVE" : "PENDING_REVIEW"`; gates `sendExperienceSubmitted` to only fire when `targetStatus === "PENDING_REVIEW"`; derives `pricingByType` for RANDOMTRIP via `getBasePricePerPerson` (no commission add-on). Satisfies spec "Admin/RandomTrip creation skips PENDING_REVIEW", "Tripper-created rows cannot reach ACTIVE directly". 12/12 passing (7 pre-existing + 5 new).
- [x] 3.3 REFACTOR — confirmed `getExperienceCompleteness` still runs unconditionally before the branch for both source types (unchanged position in the route); no bypass.

## Phase 4: Reviews Commission Attribution

- [x] 4.1 RED — extended `src/app/api/reviews/__tests__/route.test.ts` (file already existed in the repo — design.md's "no existing test file" note was stale; reused its established `@/lib/prisma` mock pattern) with failing cases: `tripperId: null` + `source: "TRIPPER"` → `Review.tripperId = experience.ownerId`; `source: "RANDOMTRIP"` → `Review.tripperId = null` even with a stale mocked `owner.roles` containing `"TRIPPER"`; non-null `TripRequest.tripperId` bypasses the `source` check entirely.
- [x] 4.2 GREEN — `src/app/api/reviews/route.ts`: `experience` select changed from `{ ownerId: true, owner: { select: { roles: true } } }` to `{ ownerId: true, source: true }`; `owner?.roles?.includes("TRIPPER")` replaced with `experience.source === "TRIPPER"`. Satisfies spec "Attribution via Experience Source" (all 3 scenarios). 14/14 passing (11 pre-existing + 3 new).

## Phase 5: NewExperienceShell — adminCreate Mode

- [x] 5.1 `src/components/app/dashboard/tripper/experiences/NewExperienceShell.tsx` — widened `ExperienceShellMode` union to `"tripper" | "adminCreate" | "adminEdit" | "adminReadOnly"`.
- [x] 5.2 Same file — added optional `finalizeCopy?: FinalizeCopy` prop; resolved via new pure helper `resolveFinalizeCopy()` (falls back to tripper dict defaults when absent) and wired into the finalize CTA label + confirm-modal title/body.
- [x] 5.3 Same file, `handleRequestSubmit` — guard now delegates to pure helper `canRequestSubmit(mode, isSubmitting, isReadOnly)`, equivalent to `mode !== "tripper" && mode !== "adminCreate"` widening.
- [x] 5.4 Same file, `confirmSubmit` — redirect now uses pure helper `resolvePublishRedirectPath(mode, locale)`: `adminCreate` → `/{locale}/dashboard/admin/experiences`, everything else unchanged → `/{locale}/dashboard/tripper/experiences`.
- [x] 5.5 Same file — tripper-note textarea now conditionally rendered via `shouldShowTripperNoteField(mode)`, hidden only for `adminCreate`.
- [x] 5.6 Confirmed — `AdminReviewSlot`/`admin-pricing` tab still gated solely by `adminReviewSlot` prop; `adminCreate` page never passes it, so no shell change needed. No pricing tab added.
- [x] 5.7 Confirmed — `persistDraft`/autosave and `isReadOnly` require no changes; `adminCreate` falls through the existing tripper POST/PATCH branch and is not in the `isReadOnly` condition list.
  - **TDD note**: full `NewExperienceShell` component tests were not written — rendering it requires 7+ mocks (next/navigation router+searchParams, fetch, ExperienceFormContent, JourneyContentNavigation, JourneyProgressSidebar, ReviewActionsBar, Modal), which breaches the Mock Hygiene Rule (max 3–6 healthy). Per the Extract-Before-Mock Rule, the four branching decisions this phase touches were extracted into pure, zero-mock-tested functions in new file `newExperienceShellHelpers.ts` (13 tests, RED confirmed then GREEN) and the component now delegates to them. The JSX wiring itself (prop pass-through, conditional render) is config-level glue, not independently retested.

## Phase 6: Admin Route, Nav, and Headings

- [x] 6.1 Created `src/app/[locale]/(secure)/dashboard/admin/experiences/new/page.tsx` mirroring the sibling `admin/xsed/new/page.tsx` pattern exactly: locale via `hasLocale()`, `dict = await getDictionary(locale)`, renders `<NewExperienceShell mode="adminCreate" ... finalizeCopy={dict.adminDashboard.newExperience} />`. **Deviation from design.md's literal snippet**: no duplicate `requireAdmin` session/redirect check in the page body — the parent `dashboard/admin/layout.tsx` already wraps all admin routes in `<StrictDashboardLayout requiredRole="admin">`, which redirects unauthorized users; `xsed/new/page.tsx` (the more directly analogous sibling than the tripper page design.md also cited) follows this same no-duplicate-guard convention. Adding a second guard would drift from the established pattern without adding protection.
- [x] 6.2 `src/components/app/dashboard/config/adminNav.ts` — added `{ href: base("/experiences/new"), icon: PackagePlus, label: copy.newExperience }` immediately after the `experiences` tab; both tabs remain non-exact (accepted dual-active-tab highlight).
- [x] 6.3 `src/components/app/dashboard/config/adminHeadings.ts` — added `experiences/new` heading check *before* the `/experiences/.+` detail regex (the regex would otherwise also match `/experiences/new` and shadow the new heading).
- [x] 6.4 Updated `adminNav.test.ts` (9-tab order/href assertions + new placement test) and `adminHeadings.test.ts` (new heading resolution + regression that `/experiences/abc123` still resolves to `experiencesDetail`, not `experiencesNew`). RED confirmed (5 failures) then GREEN (16/16 passing).

## Phase 7: Dictionary & Types

- [x] 7.1 `src/lib/types/dictionary.ts` — extended `AdminDashboardDict`: `nav.newExperience: string`; `pageHeadings.experiencesNew: { title: string; description: string }`; `newExperience: { submitLabel: string; confirmTitle: string; confirmBody: string }`.
- [x] 7.2 `src/dictionaries/es.json` — added `nav.newExperience` ("Nueva experiencia"), `pageHeadings.experiencesNew.{title,description}`, `newExperience.{submitLabel: "Publicar", confirmTitle, confirmBody}` under `adminDashboard`.
- [x] 7.3 `src/dictionaries/en.json` — mirrored all keys in English (`newExperience: "New Experience"`, `submitLabel: "Publish"`, matching title/description/confirmTitle/confirmBody). Both files validated as parseable JSON.
- [x] 7.4 `npm run typecheck` — zero errors repo-wide, confirmed after all phases (see 8.1).

## Phase 8: Final Verification

- [x] 8.1 `npm run typecheck` — zero errors, repo-wide.
- [x] 8.2 `npm run test` — 255/261 passing; the 6 failures (`src/lib/xsed/__tests__/notifications.test.ts` ×2, `src/app/api/admin/xsed/__tests__/route.test.ts` ×4) are **pre-existing baseline failures**, confirmed via `git stash` + re-run before any of this change's edits were applied. Zero regressions from this change; all new/extended suites (Phases 1–4, 6) are green.
- [ ] 8.3 `npm run lint` — **BLOCKED in this sandbox**: `next lint` fails with `Invalid project directory provided, no such directory: .../lint` (pre-existing, confirmed via `git stash` baseline re-run — unrelated to this change, likely a Next 16/ESLint-9-flat-config vs. legacy `.eslintrc` mismatch already present on this branch). Direct `npx eslint` also fails in this environment with a circular-JSON error in `@eslint/eslintrc` resolving the `react` plugin config — also pre-existing tooling breakage, not introduced here. Manually verified touched files: no raw `<img>` tags introduced, no new `dark:` variants, all new UI strings are dictionary-sourced (Phase 7). The user should run `npm run lint` in an environment where the pre-existing tooling issue is resolved.
- [ ] 8.4 Manual QA (admin) — **not executable in this sandbox** (no browser/dev server). Requires the user to run `npm run dev`, apply 1.2/1.6 against a local DB first, then manually verify: create via `/dashboard/admin/experiences/new` → autosave persists `DRAFT`/`RANDOMTRIP`; wizard shows no pricing tab; Publish → `ACTIVE`, no `PENDING_REVIEW`, `pricingByType` populated; redirect to admin experiences list; no commission field visible. QA at ≥360px and ≥1280px.
- [ ] 8.5 Manual QA (tripper) — **not executable in this sandbox.** Regression pass: `DRAFT` → `PENDING_REVIEW`, submitted email fires, approval pipeline intact. (Automated regression coverage for this exists via the unchanged/passing pre-existing submit-route tests — see 8.2.)
- [ ] 8.6 Manual QA (reviews) — **not executable in this sandbox.** Automated equivalent covered in Phase 4's new tests (RANDOMTRIP → no attribution, TRIPPER → attribution preserved), but a live token-based submission QA pass is still recommended before merge.
