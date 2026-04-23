# BlogComposer Refactor + Gallery Block

**Date:** 2026-04-15
**Scope:** `src/components/tripper/blog/BlogComposer.tsx` + dictionary files

---

## Problem

1. `handleSave` and `handlePublish` share ~60 lines of near-identical logic — maintenance hazard.
2. Both hardcode `blocks: []` on save, discarding any image blocks — a data-loss bug.
3. Cover section and body editor share one panel card — two unrelated concerns in one container.
4. No UI for uploading gallery images that feed the `LightboxCarousel` on the public blog post page.

---

## Architecture

### 1. Refactor `BlogComposer`

- Extract `submitPost(status: 'draft' | 'published')` — `handleSave` and `handlePublish` become one-liners delegating to it.
- Pass `post.blocks` (not `[]`) in the payload so gallery images survive saves.
- Split the single panel card (`bg-white border border-gray-200 p-6 rounded-xl shadow-sm`) into:
  - **Cover card** — cover image upload only
  - **Body card** — rich text editor only

### 2. Gallery panel card (new section below Body card)

Stores images as `{ type: 'image', url: string, caption?: string }` entries in `post.blocks`.

**Structure:**
```
[Panel card]
  h3: gallery.title
  p:  gallery.hint
  [hidden <input type="file" multiple accept="image/*">]
  [Button] → triggers input click (disabled while any upload in progress)
  [Grid: grid-cols-2 sm:grid-cols-3 gap-3]
    per image:
      <Img> thumbnail (object-cover, rounded-lg, aspect-square)
      <input> caption placeholder (gallery.captionPlaceholder)
      <button aria-label={gallery.removeAria}> × remove
```

**State additions:**
- `galleryUploading: boolean` — true while any image is uploading (disables button)

Gallery images are already wired into `post.blocks`; no new state slice needed beyond the existing `post.blocks`.

### 3. Dictionary additions

Both `es.json` and `en.json` get a `gallery` key inside `tripperBlogs.composer`:

```json
"gallery": {
  "title": "...",
  "hint": "...",
  "upload": "...",
  "uploading": "...",
  "captionPlaceholder": "...",
  "removeAria": "..."
}
```

`TripperBlogComposerDict` in `src/lib/types/dictionary.ts` gets a `gallery` sub-interface.

---

## Data Flow

```
upload click → uploadImageFile(file) → url
→ setPost(p => ({ ...p, blocks: [...p.blocks, { type:'image', url, caption:'' }] }))
→ handleSave/handlePublish → submitPost() → POST/PATCH with blocks included
→ public page: carouselImages = [coverUrl, ...blocks.filter(image).map(b => b.url)]
```

---

## Component Boundaries

| File | Change |
|------|--------|
| `BlogComposer.tsx` | Refactor + gallery block UI |
| `src/lib/types/dictionary.ts` | Add `gallery` to `TripperBlogComposerDict` |
| `src/dictionaries/es.json` | Add gallery strings |
| `src/dictionaries/en.json` | Add gallery strings |

No new files. No schema changes.

---

## Design System Compliance

- Panel cards: `bg-white p-6 rounded-xl border border-gray-200 shadow-sm`
- Headings: `text-lg font-semibold text-neutral-900`
- Labels: `text-sm font-medium text-neutral-500`
- Body: `text-sm text-neutral-600`
- Icons: `lucide-react` (`ImagePlus`, `X`)
- Images: `<Img>` wrapper (never raw `<img>`)
- Buttons: `<Button>` component only
