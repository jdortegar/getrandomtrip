# Proposal: Tripper Image Editor Modal (hero + avatar)

## Intent

A tripper positions their hero banner on `/dashboard/tripper/settings`, sees the face perfectly framed, saves — and the public page `/[locale]/trippers/[tripper]` crops the head off. This is not a storage or CSS bug: it is a **geometry mismatch between the edit-time preview and the render-time container**.

| Surface | Container | Effective shape |
| --- | --- | --- |
| `TripperHero.tsx` (public) | `min-h-[70vh] w-full` | ~375×550 portrait on mobile, ~1440×630 wide on desktop |
| `TripperSettingsHeroCard.tsx` (editor) | `h-95` / `md:h-72` | fixed-height box, different ratio on both breakpoints |

`object-fit: cover` crops a different region of the same image for each of those shapes, so the same stored `heroImagePositionX/Y` percentages cannot be correct in both places. The editor preview is structurally incapable of telling the truth.

We fix it by removing the variable from the equation: **the public hero becomes a fixed 16:9 container on all devices, the editor previews that exact 16:9 frame, and the server bakes the final cropped image so no consumer ever recomputes transform math.** The same modal, parametrized by mask shape, also gives avatars their first-ever crop capability.

Success looks like: what the tripper frames in the modal is pixel-for-pixel what visitors see, on every device, with no per-consumer positioning logic.

## Scope

### In Scope

**New generic primitive**
- `ImageEditorModal` — a reusable upload + crop + zoom modal built on the existing `src/components/ui/Modal.tsx` (Radix Dialog) shell. Mask is parametrized by target shape: rectangular with an explicit aspect ratio, or circular.
- Adopt `react-easy-crop` as a new dependency (drag, pinch-zoom, `cropShape="round"`).

**Phase 1 integration — two surfaces only**
- Tripper hero banner on `/dashboard/tripper/settings` (`TripperSettingsHeroCard.tsx`) — 16:9 rectangular mask, replaces the hand-rolled pointer-drag code.
- Avatar upload in `AccountSettingsPanel.tsx` (the app's only existing avatar upload entry point — confirmed there is no avatar upload UI on `/dashboard/tripper/settings` today, only a read-only `UserAvatar` display) — 1:1 circular mask, replacing the current plain "upload as-is" flow. Avatar cropping does not exist anywhere in the app today; this is net-new capability. We resolved to extend the existing single entry point rather than build a second, divergent one on the tripper settings page.

**Rendering + persistence**
- `TripperHero.tsx` public container switches from `min-h-[70vh]` to a fixed **16:9** aspect ratio on all breakpoints; `objectPosition` is removed (server-baked image renders with plain `object-cover`).
- `TripperSettingsHeroCard.tsx` preview switches to the same 16:9 ratio.
- Extend `/api/upload` (or add a sibling endpoint) to accept **original file + crop rectangle in one POST**, bake the final image with `sharp`, and persist the original alongside it.
- Prisma: add a field to reference the original (pre-crop) image for hero and avatar so the editor can reopen for a lossless re-crop.
- One-time backfill migration for existing trippers with `heroImagePositionX/Y` set.
- `es.json` + `en.json` copy for all new modal UI, per `.claude/rules/i18n-and-types.md`.

### Out of Scope

Every other upload surface keeps its current plain "upload as-is, no crop" behaviour. Audited and explicitly deferred to later phases:

| Deferred surface | Note |
| --- | --- |
| Blog cover hero (`BlogPostHero.tsx`, `min-h-[80vh]`) | Has the identical viewport-relative-ratio defect |
| Blog gallery images | — |
| Experience hero image | — |
| Experience per-activity images | — |
| Experience per-itinerary-day images | — |
| XSED drop hero (`h-[60vh] min-h-[520px]`) | Has the identical viewport-relative-ratio defect |
| XSED gallery | — |
| XSED section images | — |
| Duplicated dead-code `ImageUploadInput.tsx` (admin + `components/ui`) | Byte-for-byte duplicate; cleanup deferred |

Also out of scope: image CDN/storage migration, non-image media, and any change to `Experience.heroImage`.

## Capabilities

### New Capabilities

- **Image crop/zoom editor** — trippers can frame an uploaded image against a live mask matching the real render container, for both rectangular and circular targets.
- **Avatar cropping** — previously nonexistent; avatars were always uploaded centered and untouched.
- **Lossless re-crop** — the original upload is retained, so reopening the editor re-crops from source rather than from an already-cropped derivative.

### Modified Capabilities

- **Tripper hero rendering** — fixed 16:9 container replaces viewport-relative height; stored focal-point percentages stop driving the render.

## Approach

Seven decisions, all resolved during exploration:

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Build the modal as a **generic primitive**, wire it into **only** hero + avatar on tripper settings | 8+ other surfaces need this eventually; building it generic now avoids a rewrite, but wiring it everywhere now would balloon the diff and the blast radius |
| 2 | Public hero + settings preview both become **fixed 16:9** | This is the actual fix. A device-independent target ratio is the only way a mask can be an honest preview |
| 3 | **Server bakes the final crop** (sharp); original kept separately | Rejected the "store original + position/zoom metadata, compute at render" pattern (today's approach) because it forces every future consuming surface to reimplement transform math. Baked images render with plain `object-cover` everywhere |
| 4 | **`react-easy-crop`** replaces the hand-rolled pointer-drag | Needed for pinch-zoom on mobile and for both mask shapes; extending the existing bespoke drag code to cover zoom + circular masks is more work than adopting the library |
| 5 | **Single POST at Save time** (file + crop rect together) | Rejected upload-on-file-pick + confirm-in-second-request: cancelling mid-edit would leave orphaned blobs in storage |
| 6 | **One-time automated backfill** for existing `heroImagePositionX/Y` | Bakes each tripper's 16:9 crop from their existing focal point at zoom=1, so nobody sees a visual regression on rollout day without re-editing |
| 7 | Avatar uses the **same modal with a circular mask** | 1:1 target, so no ratio complication. Reuse over a second bespoke component |

Sequencing intent for later phases: schema + API contract first (they gate everything), then the modal primitive, then the two integrations, then the 16:9 container swap, then the backfill.

## Affected Areas

| Area | Impact | Description |
| --- | --- | --- |
| `src/components/ui/ImageEditorModal.tsx` | New | Generic upload + crop + zoom modal (mask shape/ratio parametrized) |
| `src/components/tripper/TripperHero.tsx` | Modified | `min-h-[70vh]` → fixed 16:9; drop `objectPosition` |
| `src/components/app/dashboard/tripper/settings/TripperSettingsHeroCard.tsx` | Modified | `h-95 md:h-72` → 16:9; remove `DragState` / pointer handlers; open modal instead |
| `src/app/[locale]/(secure)/dashboard/tripper/settings/TripperSettingsPageClient.tsx` | Modified | Hero upload handler sends file + crop rect |
| `src/components/app/account/AccountSettingsPanel.tsx` | Modified | Avatar upload replaced with the modal (circular mask), sends file + crop rect |
| `src/components/ui/UserAvatar.tsx` | Unchanged | Stays a pure display component; the modal lives in the panels that call it, not inside it |
| `src/app/api/upload/route.ts` | Modified | Accept crop rect; bake final via sharp; store + return original reference |
| `prisma/schema.prisma` | Modified | Add original-image reference field(s); decide fate of `heroImagePositionX/Y` |
| `src/types/tripper.ts`, `src/lib/db/tripper-queries.ts`, `src/app/api/user/tripper/route.ts` | Modified | Carry the new field through the read/write path |
| `prisma/` migration + backfill script | New | One-time bake of existing focal points at zoom=1 |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | Modal copy in both locales |
| `package.json` | Modified | Add `react-easy-crop` |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Backfill script mis-crops existing trippers (silent visual regression at scale) | Med | Dry-run against a copy; spot-check a sample before committing writes; keep originals so re-crop is always possible |
| 16:9 hero is visually shorter than today's `70vh` on mobile — layout/overlay text may need rework | High | Treat the hero content block (avatar + name + CTA) as part of the change, not an afterthought; verify at 360px |
| Storing originals roughly doubles blob storage for these two features | Low | Accepted; originals are capped by the existing 10MB upload limit and the sharp resize bounds |
| `react-easy-crop` bundle weight on a dashboard route | Low | Dynamic-import the modal so it is not in the settings page's initial bundle |
| Extending `/api/upload` breaks the 8 other features that already POST to it | Med | New behaviour must be opt-in via the request shape; existing `{ file, feature }` calls must keep working unchanged |
| Diff size triggers the review workload guard | High | `delivery_strategy: single-pr` is set for this change; a `size:exception` will likely be required before apply |

## Open Questions

All architectural decisions are settled. These are implementation-shape details, to be resolved in `sdd-design` — not re-litigations:

1. **Schema field names** for the original-image reference (e.g. `heroImageOriginal` on `Tripper`, `avatarUrlOriginal` on `User`), and whether `heroImagePositionX/Y` are dropped or retained as historical data after backfill.
2. **API contract shape** — extend `POST /api/upload` with optional crop fields vs. add a dedicated endpoint; exact crop-rect payload (pixel rect vs. normalized) and whether the response returns both URLs.
3. **`avatar` vs `avatarUrl` naming inconsistency** — Prisma and the API use `avatarUrl`; `userStore` exposes it as `user.avatar`. Decide whether this change also normalizes the name or just documents it.

**Resolved** (was open question #3 during proposal drafting): avatar editing in this change lives in `AccountSettingsPanel.tsx`, the app's one existing avatar upload entry point — not a new entry point on `/dashboard/tripper/settings`, which has no avatar upload UI today. This avoids shipping two divergent avatar flows.

## Rollback Plan

Revert the change commits and re-run `db:push`. Two caveats:

- Reverting **after** the backfill runs does not restore the old rendering, because the baked hero images have replaced the originals in the `heroImage` field. Keep the pre-backfill `heroImage` values recoverable (the backfill must write to new fields and only then swap, never overwrite in place).
- Rolling back the 16:9 container without rolling back the baked images leaves 16:9 images stretched into a `70vh` box. Container and image changes must ship and revert together.

## Dependencies

- New npm dependency: `react-easy-crop`.
- `sharp` (`^0.34.5`) already present and already used server-side in `src/app/api/upload/route.ts`.
- Prisma schema change requires `db:push` / migration coordination plus a scheduled backfill run.

## Success Criteria

- [ ] What a tripper frames in the modal matches the public hero pixel-for-pixel at 360px, 768px, and 1280px
- [ ] Public hero renders in a fixed 16:9 container with plain `object-cover`, no `objectPosition`
- [ ] Avatar can be cropped and zoomed via a circular mask and renders correctly at every avatar size in the app
- [ ] Cancelling mid-edit leaves no orphaned blob in storage
- [ ] Reopening the editor for an already-cropped image re-crops from the original, not from the baked derivative
- [ ] Existing trippers with `heroImagePositionX/Y` show no visual regression after the backfill, without re-editing
- [ ] The 8 deferred upload surfaces are functionally untouched
- [ ] All modal copy exists in both `es.json` and `en.json`
- [ ] `npm run typecheck` and `npm run lint` pass

## Next step

`sdd-spec` and `sdd-design` can run in parallel from this proposal. `sdd-design` owns the four open questions above.
