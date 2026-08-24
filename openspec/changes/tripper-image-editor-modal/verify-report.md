# Verify Report: tripper-image-editor-modal

**Verdict: FAIL** (1 CRITICAL, 3 WARNING, 2 SUGGESTION)

Adversarial, independent re-derivation from source + command execution. Apply-progress self-report (engram #591) was used only as a pointer to files touched, not trusted for correctness claims.

---

## 1. Command Evidence (re-run independently)

| Command | Result |
|---|---|
| `npm run typecheck` | **0 errors** — `tsc -p tsconfig.json --noEmit` clean |
| `npm run test` | **217 files / 1616 tests, all green** (8.29s) |
| Targeted re-run: `crop.test.ts`, `upload/route.test.ts`, `backfill-tripper-hero-crop.test.ts`, `optimizeImage.test.ts` | **4 files / 34 tests, all green** |
| `npm run lint` (`next lint`) | `Invalid project directory provided` — Next 16 removed the `next lint` CLI, confirmed |
| `npx eslint src/app/api/upload/route.ts` (a file this change touched) | `TypeError: Converting circular structure to JSON` |
| `npx eslint src/lib/xsed/notifications.ts` (untouched file, unrelated to this change) | **Identical** `TypeError: Converting circular structure to JSON` |

**Lint verdict: pre-existing, NOT a regression.** The circular-JSON crash reproduces identically against `src/lib/xsed/notifications.ts`, a file this change never touches — it's an ESLint 8.57 / flat-config interaction broken repo-wide, independent of this diff. Confirmed by direct comparison, not by trusting the apply agent's claim.

---

## 2. Design Trap Verification (read actual code, not comments)

| Trap | Verified | Evidence |
|---|---|---|
| `sharp(buf).rotate()` before `.extract()` | **Correct** | `src/lib/images/bake.ts:20-28` — `rotated = sharp(buffer).rotate()`; `.metadata()` read from `rotated`; `return rotated.extract(pixelRect)...` — rotate happens first, extract is chained off the already-rotated pipeline object. Also has a dedicated regression test asserting call order: `src/app/api/upload/__tests__/route.test.ts:99-113` (`rotateIndex` before `extractIndex`), and passes. |
| Backfill legacy `user-media` fallback | **Correct** | `scripts/backfill-tripper-hero-crop.ts:77-93` (`readOriginalBlobWithFallback`) replicates `src/app/api/upload/route.ts:66-69`'s GET-handler fallback (primary store miss → `DEFAULT_STORE`/`user-media`). Covered by a dedicated test case (verified passing). |
| Dry-run default / Phase A+B non-destructive/separable | **Correct** | `--commit` flag required for any write (`backfill-tripper-hero-crop.ts:255,312`); without it, Phase B computes and prints the table only. Phase B never overwrites `heroImageOriginal` or deletes the original blob — `heroImage` only ever repoints to a **new** key (`backfill-1234.webp`, line 244). `--revert` is a single `UPDATE ... SET heroImage = heroImageOriginal` (line 289-295). |
| Crop rect normalized 0-1 end-to-end | **Correct** | `NormalizedCrop` (`crop.ts:12-17`) is fractions throughout: client (`ImageEditorModal.tsx:118-131`, divides react-easy-crop's percent by 100), API (`parseCropPayload`, `crop.ts:73-107`, range-checked 0-1), server bake (`normalizedCropToPixels`, `crop.ts:114-141`, converts to pixels only at the sharp boundary). No pixel coordinates cross the client→API boundary. |
| `avatar-original` distinct larger bound | **Correct** | `route.ts:131` `avatar: 400×400` vs `route.ts:140` `"avatar-original": 1280×1280` — genuinely distinct constants, not aliased. |
| `heroImagePositionX/Y` retained + deprecated, not read for rendering | **Correct** | `prisma/schema.prisma:59-64` — columns present, `/// @deprecated` comments on both. `rg` across `src/` + `scripts/` shows the only remaining reads are inside `scripts/backfill-tripper-hero-crop.ts` (the migration tool itself, expected) and stale field values in an unrelated pre-existing test fixture (`tripper-queries.getTripperBySlug.test.ts`, harmless — the fixture is a superset mock, the actual `select` blocks in `tripper-queries.ts:64,1275` only select `heroImageOriginal`). No render path reads the position fields. |

---

## 3. CRITICAL — Re-crop is unreachable in the shipped UI for BOTH hero and avatar

The proposal's Success Criteria states: *"Reopening the editor for an already-cropped image re-crops from the original, not from the baked derivative."* The spec's matching scenario: *"GIVEN a tripper previously saved a cropped hero image, WHEN they reopen the editor to adjust the crop, THEN the modal loads the original retained file..."*

**Neither surface has any UI action that reopens the editor without first picking a brand-new file.** The apply agent's own deviation note undersells this — it says only hero has the gap and that "avatar exercises `source.originalUrl`." That claim does not hold up:

- **Hero** (`src/components/app/dashboard/tripper/settings/TripperSettingsHeroCard.tsx`): `editorOpen` is only ever set `true` inside the hidden `<input type="file">`'s `onChange` (lines 151-161), which requires `e.target.files?.[0]` to be truthy. The `ImageEditorModal` invocation (lines 163-178) passes `source={{ file: pendingFile ?? undefined }}` — **`formData.heroImageOriginal` (available on the prop, `TripperSettingsFormState.heroImageOriginal`, threaded all the way from `TripperSettingsPageClient.tsx:41`) is never passed as `source.originalUrl`.** Even a future "Edit crop" button would need this wiring added — it does not exist today.
- **Avatar** (`src/components/app/account/AccountSettingsPanel.tsx`): `avatarEditorOpen` is only ever set `true` inside `handleAvatarChange(file: File)` (lines 308-317), which is the callback wired to `UserAvatar`'s hidden file input (`onAvatarChange={handleAvatarChange}`, line 545). `source={{ file: pendingAvatarFile ?? undefined, originalUrl: profileMe?.avatarUrlOriginal ?? undefined }}` (lines 562-565) **does** pass `originalUrl`, but since the modal can only ever be opened via `handleAvatarChange(file)`, `pendingAvatarFile` is always non-null when the modal renders. In `ImageEditorModal.tsx:81` (`activeFile = source.file ?? pickedFile`) and `:110` (`imageSrc = objectUrl ?? source.originalUrl ?? null`), the `originalUrl` fallback branch can only execute when `activeFile` is falsy — which never happens through any reachable user action. The prop is real but **dead code** in the shipped product.

**No test at any level exercises "reopen an already-saved image without picking a new file."** There is no component/unit test for `ImageEditorModal.tsx` itself (searched `src/` for `*.test.*` referencing `ImageEditorModal` — zero results), and the two manual-QA checkpoints that would have caught this (tasks 9.3, 10.4) are unchecked in `tasks.md`. Per the verify decision gate ("Spec scenario has no passing covering test → CRITICAL"), this is CRITICAL, not a documentation nit: the backend/API/schema fully supports lossless re-crop, but the feature is inaccessible to a real user on both integration surfaces today.

**Recommendation**: either (a) add a "Re-crop" / "Adjust" affordance on both surfaces that opens the modal with `source={{ originalUrl }}` and no `file`, and wire `heroImageOriginal` into the hero card's `source` prop, or (b) explicitly descope this scenario from Phase 1 with sign-off and amend the proposal's Success Criteria + spec scenario accordingly before archiving. Do not archive silently against an unmet, literally-worded success criterion.

---

## 4. WARNING findings

**W1 — Manual QA tasks left unchecked, no automated substitute.** `tasks.md` items 9.3 (avatar renders correctly at all sizes), 10.4 (public hero pixel-parity at 360/768/1280), 11.6 (backfill dry-run spot-check), 13.4 (cancel-leaves-no-blob / re-open-uses-original / no-regression QA) are unchecked, and no automated test exists at the integration level for the pixel-parity or orphan-blob claims. These are legitimately manual (no browser/visual tooling available in this environment), but they gate two more Success Criteria beyond the one in Section 3 ("What a tripper frames in the modal matches the public hero pixel-for-pixel," "Cancelling mid-edit leaves no orphaned blob") that are currently **unverified by any evidence**, not just unautomated. Recommend a human QA pass before archive, tracked explicitly rather than silently left unchecked.

**W2 — `13.3 npm run lint` is unchecked and cannot be run to completion** in this environment (see Section 1). Confirmed pre-existing and non-blocking, but the task itself remains formally incomplete against `tasks.md` — should be explicitly annotated as "environment-blocked, not a code issue" in the task list itself rather than left as a bare unchecked box, so a future reader doesn't re-investigate this from scratch.

**W3 — `coverCropFromFocalPoint`'s `number | null` signature vs. design's `number`.** Confirmed as a strict superset, not a regression: `crop.ts:31-35` defaults `fxPct ?? 50` / `fyPct ?? 50` internally, and the backfill script still explicitly passes `tripper.heroImagePositionX ?? 50` (redundant but harmless double-guard). Test coverage for the null-default path exists (per task 1.1's literal requirement). No functional issue — flagged as WARNING only because it's a signature deviation from `design.md`'s literal interface, not because it's wrong.

---

## 5. SUGGESTION findings

**S1 — Backfill Phase A (`findMany` + per-row `update` loop) instead of design's literal `updateMany` pseudocode.** Confirmed necessary and correct: Prisma's `updateMany` cannot do field-to-field copies (`heroImageOriginal: heroImage`) — there is no `$field` reference syntax in the `data` clause, only literals. The loop is the only viable approach with the Prisma Client API. N+1 is acceptable here: this is a one-time, human-triggered backfill script over the tripper population (not a hot request path), and each row is independently idempotent (no transaction-safety issue — a partial failure mid-loop leaves already-updated rows correctly copied and un-updated rows simply retried on the next run, since Phase A's `where` clause self-excludes already-copied rows).

**S2 — Consider wrapping Phase B's per-tripper bake+write+update in a `try/catch` per row** (currently only the "blob not found" case is guarded, not e.g. `sharp` decode failures) so one malformed image can't abort the whole batch. Not required — the top-level `.catch` in the CLI entrypoint already prevents a silent hang, but a single bad row currently stops all subsequent rows in the same run rather than being skipped and reported like the missing-blob case.

---

## 6. Non-Regression Checks (all passed)

- **8 deferred upload surfaces**: `rg` for `ImageEditorModal` imports and `.append("crop"` usage across `src/` returns exactly the two intended call sites (`TripperSettingsHeroCard.tsx`, `AccountSettingsPanel.tsx`) plus the primitive's own definition file. No accidental adoption elsewhere.
- **`/api/upload` no-crop path is byte-identical**: `git diff` on `route.ts` shows the no-`crop` branch is a straight extraction of pre-existing inline constants (`ALLOWED_MIME_TYPES`, `MAX_BYTES`, the slugify logic) into module scope, with identical values, identical error strings/status codes, and identical control flow — confirmed mechanically, not just by reading the comment claiming it.
- **i18n**: `imageEditor` section present in both `es.json` and `en.json` with identical key sets (`title`, `dropHint`, `dropHintDivider`, `chooseFile`, `zoomLabel`, `pickAnother`, `cancel`, `save`, `saving`, `uploadError`); `ImageEditorDict` interface exists in `src/lib/types/dictionary.ts:2128` and is referenced from `MarketingDictionary` at line 2192.
- **Field plumbing**: `heroImagePositionX/Y` fully removed from `TripperProfile`, `TripperSessionExtras`, `TripperSettingsFormState` (`src/types/tripper.ts`) and from `src/app/api/user/tripper/route.ts`; `heroImageOriginal`/`avatarUrlOriginal` correctly threaded through `tripper-queries.ts`, `user/update/route.ts`, `user/me/route.ts`, `UserProfileMe.ts`.
- **16:9 rendering**: `TripperHero.tsx` uses `aspect-[16/9] w-full mx-auto max-w-[1920px]`, plain `object-cover` on `SafeImage` with no `objectPosition`/`style` prop, and renders `TripperHeroContent` twice (`overlay` hidden md:flex, `stacked` md:hidden) — matches design exactly, single source of truth confirmed (no JSX duplication).

---

## Task Completeness vs. `tasks.md`

Of 13 phases, all core implementation tasks (Phases 1-8, 10-12) are checked and verified correct against the actual code. Phase 9 (avatar) is checked except 9.3 (manual QA, legitimately unchecked). Phase 13 (final verification) has 13.1/13.2 checked and confirmed (typecheck/test both genuinely pass); 13.3 (lint) and 13.4 (manual QA) remain unchecked — 13.3 is environment-blocked (confirmed pre-existing), 13.4 is legitimately manual.

The checked boxes accurately reflect the code state for everything that was checked — no false "done" markers found. The one substantive issue (Section 3) was **honestly flagged by the apply agent's own deviation notes**, just under-scoped (described as hero-only when it also applies to avatar).

---

## Summary

- **CRITICAL**: 1 — re-crop-from-original is architecturally supported end-to-end but has zero reachable UI entry point on either hero or avatar, directly contradicting a literal proposal Success Criterion and spec scenario.
- **WARNING**: 3 — unchecked manual QA with no automated substitute for two more Success Criteria; unchecked lint task needs explicit "environment-blocked" annotation; minor signature deviation (harmless).
- **SUGGESTION**: 2 — backfill loop justified but could use finer-grained per-row error isolation.
