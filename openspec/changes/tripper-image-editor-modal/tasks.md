# Tasks: Tripper Image Editor Modal (hero + avatar)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1400–1800 (7 new files ~660 incl. `crop.test.ts` ~140 + backfill test ~100; 12 modified files ~740–1100 incl. a new `upload/__tests__/route.test.ts` ~180 and heavy rewrites of `TripperSettingsHeroCard.tsx`/`TripperHero.tsx`; i18n across 3 files ~90) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split (if exception is declined) | PR 1: schema + API contract + field plumbing (~500) → PR 2: modal primitive + i18n (~350) → PR 3: hero + avatar integrations + 16:9 container rework (~550) → PR 4: backfill script (~250) |
| Delivery strategy | `single-pr` (user-selected) |
| Chain strategy | N/A while `single-pr` holds — requires an explicit `size:exception` confirmation before `sdd-apply` runs. If the user reconsiders, `stacked-to-main` is the natural fit: PR 1 is independently mergeable (additive schema + opt-in API), PR 4 (backfill) is independently mergeable and reversible. |

**Decision needed before apply: Yes**
**Chained PRs recommended: Yes**
**400-line budget risk: High**

This matches the proposal's own flagged risk ("Diff size triggers the review workload guard — High") and the design's 19-file `File Changes` table (7 new, 12 modified) plus 3 new/extended test files. Per the proposal's Rollback Plan, the 16:9 container swap and the baked-image pipeline cannot ship or revert independently of each other — so even a chained-PR split cannot isolate the hero rework into a fully standalone slice; PR 3 above must land as one unit.

### Suggested Work Units

Maps to the phases below. Whether these become 4 commits in one PR (`single-pr` + `size:exception`) or 4 chained PRs depends on the orchestrator's review-workload-guard decision.

| Unit | Goal | Phases | Notes |
|------|------|--------|-------|
| 1 | Pure crop math + server bake + `POST /api/upload` opt-in contract + Prisma schema + read/write field plumbing | 1–5 | Self-contained; existing `{file, feature}` callers are byte-identical (design's Q2 rationale). Deployable alone — no UI depends on it yet. |
| 2 | `ImageEditorModal` generic primitive + i18n copy | 6–7 | Component with no network calls; renders standalone but isn't wired into any page yet. |
| 3 | Hero integration + avatar integration + 16:9 container/content rework | 8–10 | The proposal's Rollback Plan requires container + baked-image changes to ship together — do not split 8–10 across separate PRs. |
| 4 | One-time backfill script (dry-run default) | 11 | Independently deployable and reversible (`--revert`); safe to run well after Unit 3 ships. |
| — | Final verification | 12–13 | Attaches to whichever unit lands last. |

---

## Phase 1: Pure Crop Math — `src/lib/images/crop.ts`

*Spec requirement: Server-Side Crop Baking With Original Retention (re-crop math foundation).*

- [x] 1.1 RED — create `src/lib/images/__tests__/crop.test.ts`: `coverCropFromFocalPoint` — wide source (4000×2000, aspect 16/9, fx=0, fy=50) → `{x:0, y:0, width:0.888…, height:1}`; tall source (1000×2000, aspect 16/9, fy=100) → `{x:0, y:0.719, width:1, height:0.281}`; square source at 1:1 aspect; `fx`/`fy` `null` defaults to `50`. `parseCropPayload` rejects `x<0`, `width>1`, `x+width>1+EPSILON`, `NaN`, string input, missing keys, and accepts a valid rect. `normalizedCropToPixels` clamps to `[0,1]` and never returns `width`/`height < 1`.
- [x] 1.2 GREEN — create `src/lib/images/crop.ts` exporting `NormalizedCrop`, `coverCropFromFocalPoint(sourceW, sourceH, aspect, fxPct, fyPct)`, `normalizedCropToPixels(crop, sourceW, sourceH)`, `parseCropPayload(raw: unknown): NormalizedCrop | null` — implement the exact branch from design.md (`sourceAspect > aspect` → full-height crop; else → full-width crop). No sharp import, no React import — this file stays pure per the design's layering.

## Phase 2: Server Bake — `src/lib/images/bake.ts`

*Spec requirement: Server-Side Crop Baking With Original Retention.*

- [x] 2.1 Create `src/lib/images/bake.ts` exporting `bakeCrop(buffer: Buffer, crop: NormalizedCrop, outputDims: { width: number; height: number }): Promise<Buffer>` — pipeline: `sharp(buffer).rotate()` (EXIF-normalize — **must run before `.extract()`**, see trap note below) → `.metadata()` for source W/H → `.extract(normalizedCropToPixels(crop, meta.width, meta.height))` → `.resize(outputDims, { fit: "cover" })` → `.webp({ quality: 82 })` → `.toBuffer()`. Import `normalizedCropToPixels` from `src/lib/images/crop.ts` — this is the single crop implementation shared by the route and the backfill script (no duplicate math).
- [x] 2.2 **Trap — EXIF rotation ordering**: add an inline comment at the `.rotate()` call in `bake.ts` stating why it must precede `.extract()` (browsers auto-apply EXIF orientation; skipping this silently offsets every crop on photos taken in portrait mode on a rotated phone). This is exercised transitively by the Phase 3 route tests (Task 3.3) — no dedicated `bake.test.ts` per design's Testing Strategy table (bake.ts is thin sharp wiring over already-unit-tested `crop.ts` math; sharp itself is mocked at the route-test level).

## Phase 3: API Contract — `POST /api/upload`

*Spec requirements: Single-POST Save With No Orphaned Uploads; Server-Side Crop Baking With Original Retention.*

- [x] 3.1 RED — create `src/app/api/upload/__tests__/route.test.ts` (new file; `optimizeImage.test.ts` already covers the pre-existing resize path and must keep passing unmodified). Mock `sharp`, `@netlify/blobs`, `next-auth`, `@/lib/auth` per the existing `optimizeImage.test.ts` pattern. Cases: (a) no `crop` field → response is exactly `{ url }`, exactly one `store.set` call — proves the 8 deferred features regress to nothing; (b) `crop` + `file` → two `store.set` calls (original + baked), response `{ url, originalUrl }`; (c) `crop` + `originalKey` (re-crop path) → one `store.set` call (baked only), response `{ url, originalUrl }` echoing the input `originalKey`'s derived URL; (d) unparseable/out-of-range `crop` JSON → `400 { error: "Invalid crop" }` and **zero** `store.set` calls; (e) `originalKey` not owned by the session user (fails `key.startsWith(userId + "/")`) → `403 { error: "Forbidden" }`.
- [x] 3.2 GREEN — modify `src/app/api/upload/route.ts`: add `FEATURE_MAX_DIMENSIONS` entries `"tripper-hero-original": { width: 2560, height: 2560 }` and `"avatar-original": { width: 1280, height: 1280 }` (deliberately generous vs. `avatar`'s existing `400×400` — the original must stay usable for re-crop); add a new `FEATURE_OUTPUT_DIMENSIONS` map with `"tripper-hero": { width: 1920, height: 1080 }` and `"avatar": { width: 400, height: 400 }`; parse optional `crop` (JSON string, validated via `parseCropPayload`) and `originalKey` form fields — presence of `crop` is the sole opt-in switch, absent `crop` must hit the byte-identical existing code path; when `originalKey` is present, read the original via `store.get(originalKey)` and enforce `isSafeKey(originalKey) && originalKey.startsWith(session.user.id + "/")` before use (403 otherwise); implement the server flow from design.md's "Server flow when `crop` is present" block, importing `bakeCrop` from `src/lib/images/bake.ts`.
- [x] 3.3 GREEN — modify `getBlobStore(feature)` in `route.ts` to strip a trailing `-original` suffix when resolving the store name, so an original lands in the same store as its derivative and the existing `GET` handler (which derives `feature` from `key.split("/")[1]`) resolves it without changes.
- [x] 3.4 Add a route-test assertion (extends Task 3.1's case (b)) that the mocked `sharp(...)` call chain invokes `.rotate()` before `.extract()` — this is the concrete regression guard for the Phase 2.2 trap, not just a code comment.

## Phase 4: Prisma Schema — Original-Image Reference Fields

*Spec requirement: Server-Side Crop Baking With Original Retention (re-crop from source, not derivative).*

- [x] 4.1 In `prisma/schema.prisma`, on the `User` model: add `heroImageOriginal String?` and `avatarUrlOriginal String?`. Add a `// @deprecated` comment above `heroImagePositionX`/`heroImagePositionY` noting they are retained for backfill recovery only and are no longer read or written by application code as of this change (design Q1b — do not drop the columns in this change).
- [x] 4.2 Run `npm run db:push` (additive nullable columns only — no destructive prompt expected). Run `npm run db:generate` to regenerate the Prisma client.

## Phase 5: Field Plumbing — Carry the Original-Image Reference Through Read/Write Paths

*Spec requirement: Server-Side Crop Baking With Original Retention.*

- [x] 5.1 In `src/types/tripper.ts`: add `heroImageOriginal: string | null` to `TripperProfile` and `TripperSessionExtras`; add `heroImageOriginal: string | null` to `TripperSettingsFormState`; remove `heroImagePositionX`/`heroImagePositionY` from all three interfaces (the settings form keeps them out — the modal replaces drag-to-reposition entirely).
- [x] 5.2 In `src/app/api/user/tripper/route.ts`: accept and `select` `heroImageOriginal`; stop writing/reading `heroImagePositionX`/`heroImagePositionY` (design cites current write/read sites at ~L51-52, L136-137, L155-156 — verify against current line numbers, they may have drifted).
- [x] 5.3 In `src/lib/db/tripper-queries.ts`: add `heroImageOriginal` to both `select` blocks that currently select `heroImage` (design cites ~L75-ish and a second query further down, same file as the commission-management change touched); drop `heroImagePositionX`/`heroImagePositionY` from both.
- [x] 5.4 In `src/app/api/user/update/route.ts`: accept `avatarUrlOriginal` with the same origin-stripping treatment already applied to `avatarUrl` (design cites ~L70-80).
- [x] 5.5 In `src/app/api/user/me/route.ts` and `src/lib/types/UserProfileMe.ts`: expose `avatarUrlOriginal` on the response/type so `AccountSettingsPanel` can pass it to the modal as `source.originalUrl` for lossless re-crop.
- [x] 5.6 Run `npm run typecheck` — confirms every consumer of the now-removed `heroImagePositionX`/`heroImagePositionY` fields on these types has been updated; expect compile errors in `TripperSettingsHeroCard.tsx`, `TripperSettingsPageClient.tsx`, and `TripperHero.tsx` at this point — those are resolved in Phases 8–10, not here. Do not "fix" them by re-adding the fields.

## Phase 6: Generic Image Editor Modal Primitive — `src/components/ui/ImageEditorModal.tsx`

*Spec requirements: Generic Image Editor Modal Upload; Mask-Constrained Pan and Zoom.*

- [x] 6.1 Add `react-easy-crop` to `package.json` dependencies.
- [x] 6.2 Create `src/components/ui/ImageEditorModal.tsx` implementing the exact `ImageEditorModalProps`/`ImageEditorSource`/`ImageEditorResult`/`ImageEditorMaskShape` interfaces from design.md. Shell: `<Modal className="max-w-3xl p-0">` + `DialogHeader`/`DialogTitle`/`DialogFooter` re-exported from `src/components/ui/Modal.tsx`. Drag-and-drop zone + hidden file input for initial pick (no image loaded state); `<Cropper image={objectUrl} aspect={aspect} cropShape={maskShape} onCropComplete={(area) => setCrop(area)} />` from `react-easy-crop`, reading **`croppedArea`** (percent, ÷100) — not `croppedAreaPixels` (design's explicit rejection). Zoom control: native `<input type="range" min={1} max={3} step={0.01}>` (no `Slider` primitive exists in `src/components/ui/`, and one consumer doesn't justify adding one). `safeAreaTopPct` prop draws a horizontal guide strip over the mask at that fractional height (navbar-occlusion guide for the hero use case).
- [x] 6.3 Object-URL lifecycle: create the object URL in a `useEffect` keyed on `source.file`, call `URL.revokeObjectURL` in the cleanup function — omitting this leaks a blob URL per file pick/re-render.
- [x] 6.4 Bundle boundary: in each consumer (`TripperSettingsHeroCard.tsx` in Phase 8, `AccountSettingsPanel.tsx` in Phase 9), `dynamic(() => import(".../ImageEditorModal"), { ssr: false })` **at module scope**, rendered behind `{editorOpen && <ImageEditorModal .../>}`. Do not call `dynamic()` inside the component body (design's explicit gotcha — it remounts the modal every render) and do not put the `dynamic()` boundary inside `ImageEditorModal.tsx` itself around only `react-easy-crop` (creates a second fetch waterfall on open).
- [x] 6.5 On Save: `onSave` must fire exactly once per confirm click, and no network request may originate from inside `ImageEditorModal.tsx` itself — it returns `{ crop, file?, originalUrl? }` to the caller, which performs the single `POST /api/upload` (Phase 8/9 own the actual fetch call). This is what keeps "cancel leaves no uploaded blob" true: the modal never touches the network.

## Phase 7: Dual-Locale Modal Copy

*Spec requirement: Dual-Locale Modal Copy.*

- [x] 7.1 In `src/lib/types/dictionary.ts`: add an `ImageEditorDict` interface covering every string surfaced in Phase 6 (drag-and-drop hint, "choose a file" button, zoom label, Save, Cancel, "pick another image", generic upload-error message) and reference it from `MarketingDictionary` (or the nearest existing top-level section it's sliced from — check whether it should live standalone or nested under `tripperDashboard`/`profile` given both hero and avatar consume it).
- [x] 7.2 Add the corresponding keys to `src/dictionaries/es.json`.
- [x] 7.3 Add the same keys, translated, to `src/dictionaries/en.json`.
- [x] 7.4 Run `npm run typecheck` — zero missing-dictionary-key errors for either locale (this is the spec's literal acceptance scenario for this requirement).

## Phase 8: Hero Integration — Settings Editor

*Spec requirement: Tripper Hero Fixed-Ratio Rendering (MODIFIED) — settings-preview half; Single-POST Save With No Orphaned Uploads.*

- [x] 8.1 Modify `src/components/app/dashboard/tripper/settings/TripperSettingsHeroCard.tsx`: delete the `DragState` interface, `dragRef`, `isDragging` state, `handlePointerDown`/`handlePointerMove`/`handlePointerUp`, `stopPropagation`, `handleResetPosition`, and the "Reset" button — all pointer-drag reposition code is replaced by the modal. Change the preview container from `h-95 md:h-72` to a fixed `aspect-[16/9]` box. Wire the existing "Change photo" button and hidden file input to open `ImageEditorModal` (`aspect={16/9}`, `maskShape="rect"`) instead of calling `onUploadHeroImage` directly; render the modal behind the `dynamic()` + `{editorOpen && ...}` guard from Phase 6.4.
- [x] 8.2 Modify `src/app/[locale]/(secure)/dashboard/tripper/settings/TripperSettingsPageClient.tsx`: replace `handleUploadHeroImage(file: File)` with `handleUploadHeroImage(file: File | undefined, crop: NormalizedCrop, originalUrl?: string)` that builds the multipart body with `feature: "tripper-hero"` plus the new `crop`/`originalKey`/`file` fields per the Phase 3 contract, and stores both `heroImage` and `heroImageOriginal` from the response. Remove `heroImagePositionX`/`heroImagePositionY` from `normalizeExtras`, `EMPTY_FORM`, the `formData` initializer, `profile` initializer, `cancelEdit`, the PATCH body in `handleSave`, and the `updateSession` payload — design cites these at (drifted-verify) L40-41, L57-58, L104-105, L115-116, L167-168, L241-242, L259-260, L288-289.
- [x] 8.3 Delete the `imageTooLarge` 5 MB pre-check special-casing if it no longer applies once the modal owns file selection, or relocate it into `ImageEditorModal`'s file-pick handler so oversized files are rejected before the crop UI opens rather than after Save — decide during implementation and keep the existing `copy.hero.imageTooLarge` key either way (no orphaned dict key).

## Phase 9: Avatar Integration — Account Settings Panel

*Spec requirement: Avatar Cropping.*

- [x] 9.1 Modify `src/components/app/account/AccountSettingsPanel.tsx`: `handleAvatarChange(file: File)` currently uploads immediately — change it to stash the picked `File` and open `ImageEditorModal` (`aspect={1}`, `maskShape="round"`, `source={{ file, originalUrl: profileMe?.avatarUrlOriginal }}`) instead. Add the actual `POST /api/upload` (feature `"avatar"`, plus `crop`/`originalKey`/`file`) and the `PATCH /api/user/update` (now also sending `avatarUrlOriginal`) inside the modal's `onSave` callback, preserving the existing session/store update logic (`updateSession`, `useUserStore.setState`) and the fire-and-forget delete of the old blob.
- [x] 9.2 `src/components/ui/UserAvatar.tsx` stays unchanged (confirm no edits needed) — it keeps its hidden file input and `onAvatarChange(file)` callback; only the panel's handling of that callback changes.
- [x] 9.3 Manual QA checkpoint (per design's Testing Strategy — no automated test for this UI layer): saved cropped avatar renders without additional clipping/distortion at every `UserAvatar` size used across the app (nav, profile header, cards).

## Phase 10: 16:9 Container Rework — Public Hero

*Spec requirement: Tripper Hero Fixed-Ratio Rendering (MODIFIED) — public-hero half.*

- [x] 10.1 Create `src/components/tripper/TripperHeroContent.tsx` with `variant: "overlay" | "stacked"` per design.md's Hero Layout Rework table — `stacked`: avatar `h-24 w-24` with `-mt-12` overlap + `ring-4 ring-white`, location/name(`text-3xl`)/bio/CTA centered on `bg-slate-950`, `px-4 pb-10`; `overlay`: the existing absolute-positioned content block logic from today's `TripperHero.tsx` (avatar, name, tagline, CTA), unchanged visually at `md+`.
- [x] 10.2 Modify `src/components/tripper/TripperHero.tsx`: replace `min-h-[70vh] w-full` with `aspect-[16/9] w-full mx-auto max-w-[1920px]`; delete the `heroObjectPosition` computed value and the `style={{ objectPosition: heroObjectPosition }}` prop on `SafeImage` — the baked image renders with plain `object-cover`, no client-side position math. Render `<TripperHeroContent variant="overlay" className="hidden md:flex" .../>` inside the band and `<TripperHeroContent variant="stacked" className="md:hidden" .../>` below it (`pt-16` on the section so the full 16:9 band clears the navbar on mobile) — one source of truth, two placements, no JSX duplication.
- [x] 10.3 Pass `safeAreaTopPct={0.09}` from `TripperSettingsHeroCard`'s `ImageEditorModal` instance (Phase 8.1) — this must match the navbar-occlusion fraction the public hero actually has at `md+`, per design's guide-strip rationale.
- [x] 10.4 Manual QA checkpoint (per design's Testing Strategy): frame a face off-center in the settings editor → public hero matches pixel-for-pixel at 360px, 768px, and 1280px viewport widths; verify the `< md` stacked layout fits the full framed 16:9 crop below the navbar with no clipping.

## Phase 11: One-Time Non-Destructive Hero Backfill

*Spec requirement: One-Time Non-Destructive Hero Backfill.*

- [x] 11.1 RED — create `scripts/__tests__/backfill-tripper-hero-crop.test.ts` following the `backfill-tripper-since.test.ts` pattern (exported function + injected fake client): Phase A (`heroImageOriginal: heroImage` copy) is idempotent — running it twice yields `count: 0` on the second run; Phase B without `--commit` performs **zero** writes and still prints/returns the per-tripper computed-rect table.
- [x] 11.2 GREEN — create `scripts/backfill-tripper-hero-crop.ts` (dotenv + `PrismaPg` adapter + `isMainModule` guard + exported function, per `scripts/backfill-tripper-since.ts`): Phase A — `updateMany where { heroImage: {not:null}, heroImageOriginal: null } data { heroImageOriginal: heroImage }`. Phase B — per tripper with `heroImageOriginal != null`: read the blob, `sharp.metadata()` for W/H, `coverCropFromFocalPoint(W, H, 16/9, posX ?? 50, posY ?? 50)` from `src/lib/images/crop.ts`, `bakeCrop` from `src/lib/images/bake.ts`, store as a **new** blob key, then `heroImage = <new key>` — never overwrite `heroImageOriginal` or the original blob. `--commit` flag required to write anything; without it the script prints a table (slug, source W×H, computed rect, output dims, target key) and exits 0 — **dry-run is the default, not opt-in**, so forgetting the flag can never silently rewrite every tripper.
- [x] 11.3 **Trap — legacy `user-media` blob fallback**: the script's blob read in Phase B must replicate the same legacy-store fallback the `GET` handler in `src/app/api/upload/route.ts` already has (falls back to the `user-media`/`DEFAULT_STORE` bucket when the feature-scoped store returns nothing) — trippers whose `heroImage` predates the feature-store split live there. Without this, Phase B silently skips those rows. Add a test case in Task 11.1 asserting the fallback store is queried when the primary store misses.
- [x] 11.4 Add `--revert` flag: `UPDATE "User" SET "heroImage" = "heroImageOriginal" WHERE "heroImageOriginal" IS NOT NULL` — exposed on the same script, per design's Rollback stated as "one statement."
- [x] 11.5 Add `"db:backfill-tripper-hero-crop": "npx tsx scripts/backfill-tripper-hero-crop.ts"` to `package.json` scripts, matching the naming convention of the existing `db:backfill-*` entries.
- [x] 11.6 Manual step (not scripted, run post-merge): execute the backfill in dry-run, spot-check the printed rects against a sample of live tripper profiles, then re-run with `--commit`. Do not run `--commit` as part of `sdd-apply` — this is a deployment-time operational step. Done against the live `verceldb` (Neon) DB: 3 trippers backfilled (`david` validated visually first, then `carla-prueba` + `Ropsy` committed). Note found during this step: Phase A (the `heroImageOriginal` copy) is **not** gated by `--commit` — only Phase B is; `tasks.md`'s 11.2 wording ("`--commit` flag required to write anything") is inaccurate and should say "for Phase B."

## Phase 12: Documentation Touch-ups and Non-Regression Confirmation

*Spec requirements: Non-Regression on Deferred Upload Surfaces; supports Q3 documentation decision.*

- [x] 12.1 In `src/store/slices/userStore.ts` (~L43): add a JSDoc comment on the `avatar` field pointing at `avatarUrl` as the DB/API name (design Q3 — documented, not renamed; do not touch `SessionUser.ts`, `UserAvatar.tsx`, `AccountSettingsPanel.tsx`, `src/content/types.ts`, or `TripperProfile.tsx` for this).
- [x] 12.2 Confirm (no code change expected) that none of the 8 deferred upload surfaces — `BlogPostHero.tsx`, blog gallery, experience hero, experience per-activity images, experience per-itinerary-day images, XSED drop hero, XSED gallery, XSED section images — call `ImageEditorModal` or send a `crop` field to `/api/upload`. Grep for `ImageEditorModal` imports and for `.append("crop"` outside the two Phase 8/9 call sites as the verification step.

## Phase 13: Final Verification

- [x] 13.1 Run `npm run typecheck` — zero errors, both locales fully keyed, no leftover `heroImagePositionX`/`heroImagePositionY` references outside the schema/backfill script.
- [x] 13.2 Run `npm run test` — full suite green, including `crop.test.ts`, the new `upload/__tests__/route.test.ts`, `optimizeImage.test.ts` (unmodified behavior), and `backfill-tripper-hero-crop.test.ts`.
- [ ] 13.3 Run `npm run lint` — **environment-blocked, not a code issue**: Next 16 removed the `next lint` CLI (`Invalid project directory provided`), and direct `npx eslint` crashes with `TypeError: Converting circular structure to JSON` identically on files this change never touches (confirmed pre-existing repo-wide, see verify-report.md §1). Leave unchecked until the repo's ESLint 8.57/flat-config setup is fixed independently of this change.
- [x] 13.4 Manual QA (≥360px, ≥1280px, per proposal's Success Criteria): cancel mid-edit on both hero and avatar → no new blob appears in storage; reopen the editor on an already-cropped hero/avatar → source loaded is the original, not the baked derivative, and quality is not degraded by a prior pass; existing (pre-backfill, then post-backfill) trippers show no visual regression without re-editing.
