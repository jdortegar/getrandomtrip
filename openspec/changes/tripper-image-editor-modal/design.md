# Design: Tripper Image Editor Modal (hero + avatar)

## Technical Approach

Five layers, built bottom-up so each is testable before the next depends on it:

1. **Pure crop math** — `src/lib/images/crop.ts` owns the normalized-rect type, the focal-point→rect conversion used by the backfill, and payload validation. No sharp, no React, fully unit-testable.
2. **Server bake** — `src/lib/images/bake.ts` (sharp) turns `buffer + NormalizedCrop + output dims` into a webp buffer. Imported by both the API route and the backfill script, so there is exactly one crop implementation in the codebase.
3. **API** — `POST /api/upload` gains two optional form fields (`crop`, `originalKey`). Absent → today's code path, byte-identical response.
4. **Client primitive** — `ImageEditorModal` wraps `react-easy-crop` inside the existing `Modal` shell and returns a normalized rect. It never touches the network.
5. **Integrations** — hero (16:9 rect) and avatar (1:1 round), plus the `TripperHero` container/layout rework and the one-time backfill.

The invariant that makes this work: **the crop rect is always normalized 0–1 against the source image's EXIF-rotated natural size.** It is therefore immune to any resize the server applies to the stored original, which is what lets re-crop be lossless.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| **Q1 — Schema field names** | `User.heroImageOriginal String?` and `User.avatarUrlOriginal String?`. Rule: original field = base field name + `Original`. | `heroImageOriginalUrl` / `avatarOriginalUrl`; a shared `originalImages Json?` | Suffix-on-base keeps the pair greppable by prefix (`avatarUrl*` finds both). A JSON blob would hide two scalar URLs behind an untyped column. Both fields live on `User` because `Tripper` is not a separate model — tripper fields are User columns (`schema.prisma:46-61`). |
| **Q1b — Fate of `heroImagePositionX/Y`** | **Retain** the columns, marked deprecated in the schema comment. Remove every read/write in TS. Drop them in a follow-up change after a soak period. | Drop in this change's `db push` | They are the only recovery input if the backfill mis-crops. Dropping them makes the backfill mathematically irreversible in the same commit that introduces it. Also: `npm run db:migrate` is `prisma db push` — a column drop triggers a data-loss prompt, retention avoids that entirely. |
| **Q2 — API shape** | Extend `POST /api/upload`; new behaviour opt-in via presence of the `crop` form field. | Dedicated `POST /api/upload/crop` | Auth, 10 MB limit, MIME allowlist, `isSafeKey`, store resolution, and the sibling `GET`/`DELETE` handlers all live in this route. A sibling endpoint duplicates all of it and the two would drift. Existing `{file, feature}` callers hit the identical branch they hit today. |
| **Q2b — Crop rect encoding** | **Normalized 0–1 fractions**, sent as a JSON string in a multipart field. | Pixel rect (`croppedAreaPixels`) | The stored original is resized by `optimizeImage` (`fit: "inside"`), so client-side pixel coordinates would not map to the stored bytes on re-crop. Fractions survive any resize. |
| **Q2c — Output dimensions** | **Server-owned**, keyed by feature. Never client-supplied. | Client sends target width/height | A client-supplied output size is an unbounded sharp allocation. The feature already implies the size (`FEATURE_MAX_DIMENSIONS`, route L115-120). |
| **Q2d — Re-crop transport** | Client sends `originalKey` (no file). Server reads the original blob from its own store. | Client downloads the original and re-POSTs it as a `File` | Avoids a pointless ~2 MB round trip and any canvas/CORS handling. Ownership is enforced by the same `key.startsWith(userId + "/")` rule the `DELETE` handler uses (route L94). |
| **Q3 — `avatar` vs `avatarUrl`** | **Leave it. Document it.** Add a JSDoc line on `User.avatar` in `src/store/slices/userStore.ts:43` pointing at `avatarUrl` as the DB/API name. | Rename store field to `avatarUrl` | Verified call sites: `userStore.ts:43` (decl), `SessionUser.ts:82-86`, `UserAvatar.tsx:26`, `AccountSettingsPanel.tsx:306,337` — 4 files, 6 lines, so a rename is cheap. Rejected anyway: `SessionUser.ts:82-86` deliberately coalesces `avatar ?? avatarUrl ?? image` across three upstream shapes, so a rename there is a semantic change, not a rename. `src/content/types.ts:45` and `TripperProfile.tsx:23` use an unrelated static-content `avatar` — a global rename invites collateral damage. This change already carries a `size:exception`; unrelated churn makes the diff harder to review, not easier. |
| **Bundle boundary** | `dynamic()` at **module scope in each consumer** (`TripperSettingsHeroCard.tsx`, `AccountSettingsPanel.tsx`), `ssr: false`, rendered behind `{editorOpen && <ImageEditorModal …/>}`. | `dynamic()` inside `ImageEditorModal.tsx` around `react-easy-crop` only | One boundary, one chunk fetch. Wrapping only the cropper leaves the modal shell + copy eager and creates a second waterfall on open. The `{open && …}` guard is what actually defers the fetch — `dynamic()` alone loads on first render. Gotcha: `dynamic()` must be module-scope; calling it in the component body remounts the modal every render. |

## Interfaces

```ts
// src/lib/images/crop.ts  (new, pure)
/** Crop rect as fractions of the source image's EXIF-rotated natural size. */
export interface NormalizedCrop { x: number; y: number; width: number; height: number }

/** The rect `object-fit:cover` + `object-position:{fx}% {fy}%` would show at zoom 1. Backfill input. */
export function coverCropFromFocalPoint(
  sourceW: number, sourceH: number, aspect: number, fxPct: number, fyPct: number,
): NormalizedCrop;

/** Clamp to [0,1], guarantee >=1px, convert to sharp `extract` args. */
export function normalizedCropToPixels(
  crop: NormalizedCrop, sourceW: number, sourceH: number,
): { left: number; top: number; width: number; height: number };

/** API guard: finite, 0<=x, 0<w<=1, x+w<=1+EPSILON. Returns null on any violation. */
export function parseCropPayload(raw: unknown): NormalizedCrop | null;
```

`coverCropFromFocalPoint` math (this is the whole backfill correctness story):

```
sourceAspect = W / H
if (sourceAspect > aspect)  cropH = H, cropW = H * aspect, left = (W - cropW) * fx/100, top = 0
else                        cropW = W, cropH = W / aspect, left = 0,                    top = (H - cropH) * fy/100
→ { x: left/W, y: top/H, width: cropW/W, height: cropH/H }
```

```ts
// src/components/ui/ImageEditorModal.tsx  (new)
export type ImageEditorMaskShape = "rect" | "round";

export interface ImageEditorSource {
  /** New pick from a file input. */
  file?: File;
  /** Stored original, same-origin `/api/upload/...`. Used for lossless re-crop. */
  originalUrl?: string;
}
export interface ImageEditorResult {
  crop: NormalizedCrop;
  file?: File;         // set only when the user picked a new file
  originalUrl?: string; // set only on re-crop
}
export interface ImageEditorModalProps {
  aspect: number;                       // 16/9 hero, 1 avatar
  copy: ImageEditorDict;                // sliced dictionary, per component-patterns.md
  maskShape?: ImageEditorMaskShape;     // default "rect"
  onOpenChange: (open: boolean) => void;
  onPickAnother?: () => void;           // re-open the file input without closing
  onSave: (result: ImageEditorResult) => Promise<void> | void;
  open: boolean;
  /** 0–1 fraction of frame height covered by the site navbar at render time. Draws a guide strip. */
  safeAreaTopPct?: number;
  saving?: boolean;
  source: ImageEditorSource;
}
```

Internals: `<Cropper image={objectUrl} aspect={aspect} cropShape={maskShape} onCropComplete={(area) => setCrop(area)} />`. Use react-easy-crop's **`croppedArea`** (percent) ÷ 100, not `croppedAreaPixels`. Zoom is a native `<input type="range" min={1} max={3} step={0.01}>` — there is no `Slider` in `src/components/ui/`, and one consumer does not justify a new primitive. Object-URL lifecycle: create in an effect keyed on `source.file`, `URL.revokeObjectURL` in cleanup (leak otherwise). Shell: `<Modal className="max-w-3xl p-0">` + `DialogHeader`/`DialogTitle`/`DialogFooter` re-exported from `src/components/ui/Modal.tsx`.

## API Contract

`POST /api/upload` — `multipart/form-data`

| Field | Required | Notes |
|---|---|---|
| `file` | yes, unless `originalKey` is present | Unchanged: 10 MB cap, existing MIME allowlist |
| `feature` | yes | Unchanged `^[a-zA-Z0-9_-]{1,64}$` |
| `crop` | no | JSON string `{"x":0.1,"y":0,"width":0.8,"height":0.45}`, all 0–1. **Presence of this field is the opt-in switch.** |
| `originalKey` | no | `{userId}/{feature}-original/{filename}`. Re-crop path; must pass `isSafeKey` and start with the session user id |

| Case | Response | Status |
|---|---|---|
| no `crop` | `{ url }` — identical to today | 200 |
| `crop` + `file` | `{ url, originalUrl }` | 200 |
| `crop` + `originalKey` | `{ url, originalUrl }` (`originalUrl` echoes the input) | 200 |
| unparseable / out-of-range `crop` | `{ error: "Invalid crop" }` | 400 |
| `originalKey` not owned by session user | `{ error: "Forbidden" }` | 403 |

Server flow when `crop` is present:

```
buffer = file bytes  |  store.get(originalKey)
sharp(buffer).rotate()                      ← EXIF normalize FIRST; browsers auto-apply orientation,
  ├─ (file path) optimizeImage → store at   ← so skipping this silently offsets every crop
  │     `${userId}/${feature}-original/${filename}`  → originalUrl
  └─ .extract(normalizedCropToPixels(crop, meta.width, meta.height))
       .resize(OUT[feature], { fit: "cover" })
       .webp({ quality: 82 })  → store at `${userId}/${feature}/${filename}` → url
```

Route deltas: `getBlobStore` strips a trailing `-original` when resolving the store name, so an original lands in the same store as its derivative and the existing `GET` (which derives the feature from `key.split("/")[1]`) resolves it identically. New `FEATURE_MAX_DIMENSIONS` entries: `"tripper-hero-original": 2560×2560`, `"avatar-original": 1280×1280`. **The generous avatar-original bound is load-bearing** — `avatar` is capped at 400×400 (L116), so storing originals under that bound would make re-crop useless.

Baked output dims (new `FEATURE_OUTPUT_DIMENSIONS`): `tripper-hero` → 1920×1080, `avatar` → 400×400.

## Hero Layout Rework

At 360px, 16:9 is **202px tall**. The current overlay puts a 128px avatar + `text-4xl` h1 + bio + CTA inside a 70vh (~550px) box. That does not fit, and a 64px navbar over a 202px frame hides **32% of the tripper's framed crop**. Mobile cannot keep the overlay.

| Breakpoint | Treatment |
|---|---|
| `< md` | **Stacked.** Band starts *below* the navbar (`pt-16` on the section) so the whole framed 16:9 is visible. Content flows underneath on `bg-slate-950`: avatar `h-24 w-24` with `-mt-12` overlap + `ring-4 ring-white`, then location / `text-3xl` name / bio / CTA, centered, `px-4 pb-10`. |
| `md+` | **Overlay preserved.** 16:9 at 1280px is 720px tall — *taller* than today's 70vh, so the existing absolute overlay still fits unchanged. Navbar covers ~9% of the frame; the editor draws a matching `safeAreaTopPct={0.09}` guide. |
| Width cap | Band is `aspect-[16/9] w-full mx-auto max-w-[1920px]`. Bounds height to 1080px on ultrawide without clipping. Capping *width* is safe; capping height with `overflow-hidden` would break the "you see exactly what you framed" contract and is rejected. |

Implementation: extract the content block to `src/components/tripper/TripperHeroContent.tsx` with `variant: "overlay" | "stacked"`. `TripperHero.tsx` renders it twice (`hidden md:flex` inside the band, `md:hidden` below it) — one source of truth, two placements, no JSX duplication. `objectPosition` and `heroObjectPosition` (L40, L70) are deleted.

## Backfill

`scripts/backfill-tripper-hero-crop.ts`, wired as `"db:backfill-tripper-hero-crop"` in `package.json`, following `scripts/backfill-tripper-since.ts` (dotenv + `PrismaPg` adapter + `isMainModule` guard + exported function for tests).

**Two phases, never destructive:**

| Phase | Action | Reversibility |
|---|---|---|
| A | `updateMany where { heroImage: {not:null}, heroImageOriginal: null } data { heroImageOriginal: heroImage }` | Pure copy. Zero risk. Idempotent. |
| B | Per tripper with `heroImageOriginal != null`: read blob → `sharp.metadata()` → `coverCropFromFocalPoint(W, H, 16/9, posX ?? 50, posY ?? 50)` → `bakeCrop` → store as a **new** blob → `heroImage = bakedUrl` | `heroImage` only ever moves *forward* to a new key; the original blob and `heroImageOriginal` are never deleted or overwritten. |

Rollback is one statement: `UPDATE "User" SET "heroImage" = "heroImageOriginal" WHERE "heroImageOriginal" IS NOT NULL` — exposed as `--revert` on the same script.

**Dry-run is the default.** The script writes nothing unless invoked with `--commit`; without it, it prints a per-tripper table (slug, source W×H, computed rect, output dims, target key) and exits 0. Opt-in `--dry-run` was rejected: the failure mode of forgetting the flag must not be "silently rewrote every tripper".

Env required: `DATABASE_URL`, `NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN` (the script uses `getStore` directly for both read and write; it does not go through HTTP). Gotcha: existing `scripts/*.ts` avoid `@/` aliases. `tsx` does resolve tsconfig `paths`, but if it misbehaves, import `../src/lib/images/crop` relatively rather than debugging the loader.

## File Changes

| File | Action | Notes |
|---|---|---|
| `src/lib/images/crop.ts` + `__tests__/crop.test.ts` | Create | Pure math + validation. TDD-first. |
| `src/lib/images/bake.ts` | Create | sharp: rotate → extract → resize cover → webp. Shared by route + script. |
| `src/components/ui/ImageEditorModal.tsx` | Create | Props above |
| `src/components/tripper/TripperHeroContent.tsx` | Create | `variant: "overlay" \| "stacked"` |
| `scripts/backfill-tripper-hero-crop.ts` | Create | Two-phase, `--commit` / `--revert` |
| `prisma/schema.prisma` | Modify | `+heroImageOriginal`, `+avatarUrlOriginal`; deprecate comment on `heroImagePositionX/Y` |
| `src/app/api/upload/route.ts` | Modify | `crop` / `originalKey`, `-original` store rule, output dims, bake branch |
| `src/app/api/user/tripper/route.ts` | Modify | Accept + select `heroImageOriginal`; stop writing `heroImagePositionX/Y` (L51-52, 136-137, 155-156) |
| `src/app/api/user/update/route.ts` | Modify | Accept `avatarUrlOriginal` (same origin-stripping as `avatarUrl`, L70-80) |
| `src/app/api/user/me/route.ts`, `src/lib/types/UserProfileMe.ts` | Modify | Expose `avatarUrlOriginal` so the panel can re-crop |
| `src/lib/db/tripper-queries.ts` | Modify | `+heroImageOriginal` in selects; drop position fields |
| `src/types/tripper.ts` | Modify | `TripperProfile`, `TripperSessionExtras`, `TripperSettingsFormState`: `+heroImageOriginal`, `-heroImagePositionX/Y` |
| `src/components/tripper/TripperHero.tsx` | Modify | 16:9 band, drop `objectPosition`, two-placement content |
| `.../settings/TripperSettingsHeroCard.tsx` | Modify | Delete `DragState` + 3 pointer handlers + reset button; 16:9 preview; dynamic modal |
| `.../settings/TripperSettingsPageClient.tsx` | Modify | `handleUploadHeroImage(file, crop)`; drop position state (L40-41, 57-58, 104-105, 115-116, 167-168, 241-242, 259-260, 288-289) |
| `src/components/app/account/AccountSettingsPanel.tsx` | Modify | `handleAvatarChange` opens the modal instead of uploading; dynamic modal |
| `src/store/slices/userStore.ts` | Modify | JSDoc only — document the `avatar` ⟷ `avatarUrl` mismatch |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modify | New `imageEditor` section, both locales |
| `package.json` | Modify | `+react-easy-crop`, `+db:backfill-tripper-hero-crop` |

`src/components/ui/UserAvatar.tsx` stays **unchanged**: it keeps its hidden file input and `onAvatarChange(file)` callback. `AccountSettingsPanel` stops uploading in that callback and instead stashes the `File` and opens the modal. Same pattern for the hero card's existing hidden input.

## Testing Strategy

Strict TDD is active (`vitest`).

| Layer | What | How |
|---|---|---|
| Unit | `coverCropFromFocalPoint`: wide source (4000×2000, fx=0) → `{x:0,y:0,width:0.888…,height:1}`; tall source (1000×2000, fy=100) → `{x:0,y:0.719,width:1,height:0.281}`; square source; fx/fy null→50 | Pure vitest, no mocks |
| Unit | `parseCropPayload` rejects `x<0`, `width>1`, `x+width>1`, `NaN`, strings, missing keys | Pure vitest |
| Unit | `normalizedCropToPixels` clamps and never returns width/height `< 1` | Pure vitest |
| Route | no `crop` → response is exactly `{url}` and only one `store.set` (the 8 deferred features must not regress); `crop`+`file` → two `store.set` calls and `{url, originalUrl}`; bad crop → 400 with **zero** `store.set`; foreign `originalKey` → 403 | `vi.mock("@netlify/blobs")`, `vi.mock("sharp")`, dynamic `await import("../route")` |
| Script | Phase A is idempotent (second run → `count: 0`); Phase B without `--commit` performs zero writes | Exported fn + injected fake client, per `backfill-tripper-since.ts` |
| Manual | Frame a face off-centre → public hero matches at 360 / 768 / 1280; cancel mid-edit → no new blob; re-open editor → source is the original, not the baked crop; avatar renders correctly at every `UserAvatar` size | Responsive QA |
| Gate | `npm run typecheck`, `npm run lint`, `npm run test` | — |

## Migration / Rollout

Ordered, each step independently deployable:

1. `db push` the two new nullable columns (additive, no downtime, no backfill yet).
2. Ship API + modal + both integrations + the 16:9 container **together** — per the proposal's Rollback Plan, container and baked images cannot ship or revert separately.
3. Run the backfill in dry-run, spot-check the printed rects against a sample of live profiles, then `--commit`.
4. Follow-up change (not this one): drop `heroImagePositionX/Y`.

## Open Questions

- [ ] Trippers whose current `heroImage` was uploaded before the feature-store split live in the legacy `user-media` store. The backfill must use the same legacy fallback the `GET` handler has (route L51-54) — confirm during apply that `store.get` in the script replicates it, or Phase B silently skips those rows.
- [ ] `safeAreaTopPct={0.09}` is derived for 1280–1920 viewports. Confirm visually at 1440 before ship; if the navbar becomes opaque later this guide is wrong.
- [ ] Storing originals roughly doubles blob usage for these two features (accepted in the proposal). No cleanup job exists for originals whose derivative was later replaced — the client deletes the old baked blob *and* the old original on save, but a crashed save leaves the original behind.
