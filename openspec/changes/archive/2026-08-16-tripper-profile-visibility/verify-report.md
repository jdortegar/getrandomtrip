# Verify Report: tripper-profile-visibility

Branch: `tripper-profile-visibility-followup` (confirmed via `git branch --show-current` before any work began)
Verified: 2026-08-07, independent fresh-context pass — apply-progress and tasks.md checkboxes treated as claims, not facts; every finding below is backed by a direct `Read`/`grep`/command re-run in this session.

## Summary

CRITICAL: 0 · WARNING: 3 · SUGGESTION: 3

All 10 spec.md requirements are correctly implemented in the code currently on this branch. The naming migration (`outcome`/`"active"` → `status`/`"ok"`) is complete and consistent everywhere — the one remaining stale reference was in `experiences/by-tripper/[tripper]/page.tsx`, and diffing that file against HEAD confirms it was fixed in this pass, not merely claimed fixed. `getTripperBySlug`'s catch block rethrows unconditionally (verified by reading the live function body, not the claim). `getTripperJourneyContext`'s tagged union and the journey-context route's 404/410/200 contract are implemented exactly as designed, and `JourneyPageClient.tsx` branches on all three states (`none`/`ok`/`unavailable`) with the notice rendered right after the `!dict` guard. All 9 matching-exclusion sites carry the correct filter, in the correct place, confirmed by reading each file directly. `PATCH /api/user/tripper/status` matches its contract exactly. `admin/trip-requests/[id]` returns 400 (not 422) and the owner-active guard runs before the write (confirmed via diff — this was a genuine reorder, not a no-op). `admin/experiences` only applies `owner.isActive` when `?ownerActive=true` is present.

Fresh command runs (not taken from apply-progress):
- `npm run typecheck` → 1 error, in `src/app/api/upload/route.ts:209` (`Buffer` vs `BlobInput`), unrelated to this change (that file's only diff is an unrelated `sharp`-based image-optimization feature — see Suggestions).
- `npm run test -- --run` → 906 tests, 905 pass. The 1 failure is `src/app/api/user/tripper/__tests__/route.test.ts > "still rejects an empty availableTypes with 400"` (expects 400, gets 200) — traces to the already-merged `admin-owned commission` feature, not to any file this change touches.
- `npm run lint` → fails (`next lint` errors out on argument parsing under Next 16.2.6, not because the command was literally removed — the exact failure mode differs slightly from the apply-progress's phrasing but the conclusion is the same: `next lint` is non-functional). A direct `npx eslint .` independently fails with `TypeError: Converting circular structure to JSON` inside the flat-config react plugin. Both confirmed independently; this is a pre-existing repo/tooling issue, not introduced by this change.

## CRITICAL

None found.

## WARNING

**W1 — Toggle switch can show a stale value after Cancel following a successful visibility change.**
`src/app/[locale]/(secure)/dashboard/tripper/settings/page.tsx`: `handleToggleVisibility`'s inline handler (~line 392) optimistically sets `formData.isActive` before the PATCH and only reverts `formData.isActive` on failure — it never calls `setProfile(...)` on success. `cancelEdit()` (line 219) unconditionally resets `formData` from `profile`, including `isActive: profile.isActive ?? true` (line 226). Sequence: toggle visibility off (succeeds, DB now `isActive: false`, `formData.isActive` becomes `false`, but `profile.isActive` stays `true` since it's never updated) → open Edit for an unrelated field (e.g. bio) → Cancel → `formData.isActive` reverts to the stale `profile.isActive = true`, so the switch visually shows "visible" again even though the server-persisted value is correctly `false`. Self-corrects on next full profile refetch (page reload), and does not touch the DB value, but is a real UI/data-consistency bug users could hit. Deviates from design.md's explicit spec: `onIsActiveChange`/`handleToggleVisibility` was supposed to call `setProfile((p) => ({ ...p, isActive: next }))` on success so the switch reads a single source of truth (`profile.isActive`), not `formData.isActive`.
Fix: on a successful PATCH, also call `setProfile((p) => ({ ...p, isActive: next }))`, or (cleaner, matches the original design) drive the Switch off `profile.isActive` directly rather than `formData.isActive` and remove `isActive` from `TripperSettingsFormState`/`EMPTY_FORM` entirely (see Suggestion S3).

**W2 — Toggle failure is silent; no user-facing error, and the specified `visibilityError` copy key was never added.**
The failure branches of `handleToggleVisibility` (`!res.ok` and `catch`) only revert `formData.isActive` — neither calls `toast.error(...)`, unlike every other mutation on this page (`handleSave`, `handleUploadHeroImage`), which do show `toast.error` on failure. Correspondingly, `copy.publicUrl.visibilityError` — explicitly specified in design.md's i18n table (`"No pudimos actualizar la visibilidad de tu perfil." / "We couldn't update your profile visibility."`) — is absent from `src/dictionaries/es.json`, `src/dictionaries/en.json`, and `TripperDashboardDict.publicUrl` in `src/lib/types/dictionary.ts` (confirmed by direct read of all three; only `visibilityLabel` and `visibilityDisabledHint` exist). Not a spec.md scenario violation (spec.md's Dual-Locale Copy requirement only lists "toggle label, disabled hint, and unavailable-state copy," not an error string), but a design-doc gap that produces a real UX regression: a tripper whose toggle silently fails to save has no way to know it failed except noticing the switch snap back.

**W3 — `getTripperExperiencesByTypeAndLevel`'s owner-active guard uses a different pattern than design.md specifies and than its sibling functions use, though it is functionally correct.**
Design.md's diff for this site prescribes a separate `prisma.user.findFirst({ id: tripperId, isActive: true })` pre-check, matching the pattern used by all four `tripper-trips.ts` functions (which do use exactly that, via the extracted `isOwnerActive` helper — confirmed by reading `tripper-trips.ts` directly). The actual `getTripperExperiencesByTypeAndLevel` (`tripper-queries.ts:345-397`) instead adds `owner: { isActive: true }` as a nested relation filter directly inside the single `experience.findMany` call, alongside `ownerId` and the pre-existing `isActive: true` (which means `Experience.isActive`, a different field). This is a legitimate, functionally-correct alternative — Prisma relation filters genuinely join to `User.isActive` at the DB level, and a dedicated test (`tripper-queries.matching.test.ts`) explicitly guards against the exact defect the spec's last matching-exclusion scenario forbids (`isActive` accidentally meaning only `Experience.isActive`, with no join to `User`). It is not the defect spec.md describes. It is, however, inconsistent with the sibling sites in the same change and with the literal "Lookup: User lookup" cell in spec.md's requirement table for this row — worth normalizing in a follow-up for consistency, not correctness.

## SUGGESTION

**S1 — Unrelated, uncommitted concurrent work is mixed into this working tree.**
`git status` and `git diff HEAD` show `src/components/app/dashboard/tripper/settings/TripperSettingsHeroCard.tsx`, `src/components/tripper/TripperHero.tsx`, and `src/app/api/upload/route.ts` carry a substantial, unrelated hero-image drag-to-reposition feature plus `sharp`-based image optimization on upload — none of it touches `isActive`/visibility logic, and it was correctly left alone by this change's edits (confirmed by reading the diffs). It does, however, mean this branch cannot be committed/archived cleanly as a single `tripper-profile-visibility` diff without first separating that unrelated work into its own commit.

**S2 — `sharp` used in `upload/route.ts` is not declared in `package.json`.**
Only present in `package-lock.json` as a transitive dependency. Unrelated to this SDD change (belongs to the concurrent hero-image work in S1) but flagging since it could produce a fragile install if that transitive path ever changes.

**S3 — Root cause of W1: `isActive` lives in `TripperSettingsFormState`/`EMPTY_FORM`, contradicting design.md's explicit decision.**
Design.md states plainly: "`isActive` is **not** added to `TripperSettingsFormState` — it is not part of the batched Save form... it lives in `profile`, which the toggle handler updates directly." The actual code adds `isActive: boolean` to `TripperSettingsFormState` (`src/types/tripper.ts:117`) and `EMPTY_FORM` (`page.tsx:59`). No data-corruption results today because `handleSave`'s PATCH body (confirmed by direct read) never includes `isActive` — but this structural choice is exactly what causes W1's stale-switch bug via `cancelEdit`'s blanket `...profile` spread. Recommend removing `isActive` from `TripperSettingsFormState` and driving the `Switch` from `profile.isActive` directly, per the original design.

## Requirement-by-requirement confirmation (spec.md)

- Listing Completeness Filter / Listing Active Filter — `getAllTrippers()` where clause has both `tripperSlug: { not: null }` and `isActive: true`; type-narrowing filter present (`tripper-queries.ts:204-227`). Confirmed.
- isActive Field — `prisma/schema.prisma:39` `isActive Boolean @default(true)`. Confirmed.
- Profile Lookup Three-Way Outcome — `getTripperBySlug` returns `{status:"not_found"|"inactive"|"ok"}`; `trippers/[tripper]/page.tsx` branches on all three; catch rethrows. Confirmed by direct read.
- Journey Flow Unavailable State — `getTripperJourneyContext` tagged union + `journey-context/route.ts` 404/410/200 + `JourneyPageClient.tsx` tri-state render. Confirmed.
- Matching Exclusion at Every User Lookup — all 9 sites confirmed present and correctly placed (see W3 for a stylistic, non-correctness note on one site).
- Self-Service Status Endpoint — `PATCH /api/user/tripper/status` matches contract exactly (401/400/400/200, only touches `isActive`). Confirmed.
- Toggle UI Gating — `canToggleVisibility={Boolean(profile.tripperSlug)}` (persisted, not draft). Confirmed. (Runtime staleness issue is W1, not a gating issue.)
- Dual-Locale Copy — toggle label/hint and unavailable-state copy present in both `es.json`/`en.json`, typed in `dictionary.ts`. Confirmed. (`visibilityError` from design.md is missing — W2, not a spec.md scenario.)

## Scope confirmation

- `src/app/api/internal/destination-reveal/route.ts` — empty diff against HEAD. Untouched, as required.
- No admin-side `isActive` override/control was added anywhere in `src/app/api/admin/**` or `src/components/app/admin/**` beyond the specified `ownerActive=true` opt-in filter and the pre-update guard in `[id]/route.ts`. Confirmed by grep — all other `isActive` hits in admin code are pre-existing `Experience.isActive`/`BlogPost.isActive` references, unrelated to `User.isActive`.
- `experiences/by-tripper/[tripper]/page.tsx` received only the compile-forced 3-line adaptation at both call sites (`lookup.status !== "ok" → notFound()`); no unavailable-state extension, no i18n fix. Confirmed by diff.
- No already-assigned/in-progress TripRequest logic changed.

## Test/typecheck/lint (independently re-run, not trusted from apply-progress)

- `npm run typecheck`: 1 pre-existing, unrelated error (`upload/route.ts:209`).
- `npm run test -- --run`: 906 tests, 905 pass, 1 pre-existing unrelated failure (`api/user/tripper` commission-lockdown test).
- `npm run lint`: broken at the repo/tooling level (Next 16 `next lint` + direct `eslint` flat-config circularity), pre-existing, not introduced by this change.

## Recommendation

Fix W1/W2/W3 (all small, isolated) before archiving, or explicitly accept them as known follow-ups. None are CRITICAL — no spec.md requirement is violated, no data-integrity risk exists (DB state is always correct; only a client-side display can go stale), and no scope leak was found. `next_recommended` is left to the orchestrator's delivery-strategy policy given the WARNING count.
