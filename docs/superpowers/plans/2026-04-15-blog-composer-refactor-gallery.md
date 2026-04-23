# BlogComposer Refactor + Gallery Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor BlogComposer to eliminate code duplication and a data-loss bug, align card layout with the design system, and add a gallery image upload block that feeds the public `LightboxCarousel`.

**Architecture:** Gallery images are stored as `{ type: 'image', url, caption }` entries in `post.blocks` (a JSON field already in the DB schema). The public blog detail page (`/blog/[slug]/page.tsx`) already extracts these for the `LightboxCarousel` via `blog.blocks.filter(b => b.type === 'image')`. No schema changes needed.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS 4, `lucide-react`, Sonner toasts, `<Img>` wrapper (`@/components/common/Img`), `<Button>` (`@/components/ui/Button`)

---

## Files

| File | Action | What changes |
|------|--------|-------------|
| `src/lib/types/dictionary.ts` | Modify | Add `gallery` sub-interface to `TripperBlogComposerDict` |
| `src/dictionaries/es.json` | Modify | Add `gallery` strings in Spanish |
| `src/dictionaries/en.json` | Modify | Add `gallery` strings in English |
| `src/components/tripper/blog/BlogComposer.tsx` | Modify | Refactor + gallery block |

---

## Task 1: Add `gallery` type to `TripperBlogComposerDict`

**Files:**
- Modify: `src/lib/types/dictionary.ts` (around line 44 — after the existing `cover` block)

- [ ] **Step 1: Add the `gallery` field**

In `src/lib/types/dictionary.ts`, the `TripperBlogComposerDict` interface currently has a `cover` block ending at line ~51. Add `gallery` right after it:

```ts
// Before (existing):
  cover: {
    hint: string;
    previewAlt: string;
    remove: string;
    title: string;
    upload: string;
    uploading: string;
  };
// After — add this block immediately below:
  gallery: {
    captionPlaceholder: string;
    hint: string;
    removeAria: string;
    title: string;
    upload: string;
    uploading: string;
  };
```

- [ ] **Step 2: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: no errors (dict objects will fail until Task 2 adds the keys).

---

## Task 2: Add gallery strings to dictionaries

**Files:**
- Modify: `src/dictionaries/es.json` (around line 2384 — right after the `cover` block)
- Modify: `src/dictionaries/en.json` (around line 2384 — right after the `cover` block)

- [ ] **Step 1: Add Spanish strings**

In `src/dictionaries/es.json`, find the `"cover"` block inside `tripperBlogs.composer` (around line 2377). It ends with `"uploading": "Subiendo…"` followed by `},`. Add the `gallery` key immediately after that closing brace:

```json
      "cover": {
        "hint": "JPG, PNG o WebP. Se muestra como imagen principal del post.",
        "previewAlt": "Vista previa de la imagen de portada",
        "remove": "Quitar imagen",
        "title": "Imagen de portada",
        "upload": "Subir imagen",
        "uploading": "Subiendo…"
      },
      "gallery": {
        "captionPlaceholder": "Añadir descripción…",
        "hint": "Añade fotos para el carrusel de tu publicación.",
        "removeAria": "Eliminar imagen",
        "title": "Galería de fotos",
        "upload": "Subir fotos",
        "uploading": "Subiendo…"
      },
```

- [ ] **Step 2: Add English strings**

In `src/dictionaries/en.json`, same location:

```json
      "cover": {
        "hint": "JPG, PNG, or WebP. Shown as the main image for the post.",
        "previewAlt": "Cover image preview",
        "remove": "Remove image",
        "title": "Cover image",
        "upload": "Upload image",
        "uploading": "Uploading…"
      },
      "gallery": {
        "captionPlaceholder": "Add a caption…",
        "hint": "Add photos for your post's carousel.",
        "removeAria": "Remove image",
        "title": "Photo gallery",
        "upload": "Upload photos",
        "uploading": "Uploading…"
      },
```

- [ ] **Step 3: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: no errors.

---

## Task 3: Refactor `BlogComposer.tsx` — deduplicate logic and fix blocks bug

**Files:**
- Modify: `src/components/tripper/blog/BlogComposer.tsx`

This task replaces `handleSave` and `handlePublish` with a single `submitPost` function and fixes the `blocks: []` data-loss bug. No UI changes yet.

- [ ] **Step 1: Replace the two handlers with `submitPost`**

Remove the existing `handleSave` and `handlePublish` functions entirely. Add this single function in their place (after the `contentHtml` line):

```ts
const submitPost = async (status: "draft" | "published") => {
  if (!post.title?.trim()) {
    toast.error(copy.toasts.titleRequired);
    return;
  }

  const isSaving = status === "draft";
  isSaving ? setSaving(true) : setPublishing(true);

  try {
    const postData = {
      ...post,
      blocks: post.blocks,
      content: contentHtml,
      coverUrl: post.coverUrl,
      excuseKey: post.excuseKey?.trim() ? post.excuseKey.trim() : null,
      format,
      ...(status === "published"
        ? { publishedAt: new Date().toISOString() }
        : {}),
      status,
      tags,
      travelType: post.travelType?.trim() ? post.travelType.trim() : null,
    };

    if (mode === "create") {
      const response = await fetch("/api/tripper/blogs", {
        body: JSON.stringify(postData),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (response.ok) {
        const data = (await response.json()) as { blog: { id: string } };
        toast.success(
          isSaving
            ? copy.toasts.saveSuccessCreate
            : copy.toasts.publishSuccess,
        );
        router.push(`/dashboard/tripper/blogs/${data.blog.id}`);
      } else {
        const error = (await response.json()) as { error?: string };
        toast.error(
          error.error ??
            (isSaving ? copy.toasts.saveError : copy.toasts.publishError),
        );
      }
    } else {
      const response = await fetch(`/api/tripper/blogs/${post.id}`, {
        body: JSON.stringify(postData),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (response.ok) {
        toast.success(
          isSaving ? copy.toasts.saveSuccessEdit : copy.toasts.publishSuccess,
        );
      } else {
        const error = (await response.json()) as { error?: string };
        toast.error(
          error.error ??
            (isSaving ? copy.toasts.saveError : copy.toasts.publishError),
        );
      }
    }
  } catch {
    toast.error(
      isSaving ? copy.toasts.genericSaveError : copy.toasts.genericPublishError,
    );
  } finally {
    isSaving ? setSaving(false) : setPublishing(false);
  }
};
```

- [ ] **Step 2: Update call sites**

In the JSX, replace:
- `onClick={handleSave}` → `onClick={() => submitPost("draft")}`
- `onPublish={handlePublish}` → `onPublish={() => submitPost("published")}`

- [ ] **Step 3: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/tripper/blog/BlogComposer.tsx
git commit -m "refactor(blog): extract submitPost, fix blocks data-loss bug"
```

---

## Task 4: Split the single panel card into two cards

**Files:**
- Modify: `src/components/tripper/blog/BlogComposer.tsx` (JSX section, around line 270)

Currently the cover section and body editor share one `<div className="bg-white border border-gray-200 p-6 relative rounded-xl shadow-sm space-y-6">`. Split them into two separate cards.

- [ ] **Step 1: Split the card**

Replace the single wrapping div with two separate panel cards:

```tsx
{/* Cover card */}
<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="mb-2 text-lg font-semibold text-neutral-900">
    {copy.cover.title}
  </h3>
  <p className="mb-3 text-sm text-neutral-600">{copy.cover.hint}</p>
  <div className="flex flex-col gap-3">
    <input
      accept="image/*"
      className="hidden"
      onChange={handleCoverFileChange}
      ref={coverInputRef}
      type="file"
    />
    {post.coverUrl ? (
      <>
        <div className="border border-neutral-200 h-40 max-w-md mx-auto overflow-hidden relative rounded-lg w-full">
          <Img
            alt={copy.cover.previewAlt}
            className="h-full w-full object-cover"
            height={320}
            sizes="(max-width: 768px) 100vw, 448px"
            src={post.coverUrl}
            width={448}
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <Button
            disabled={coverUploading}
            onClick={() => coverInputRef.current?.click()}
            type="button"
            variant="secondary"
          >
            {coverUploading ? copy.cover.uploading : copy.cover.upload}
          </Button>
          <Button
            onClick={() => setPost((p) => ({ ...p, coverUrl: undefined }))}
            type="button"
            variant="ghost"
          >
            {copy.cover.remove}
          </Button>
        </div>
      </>
    ) : (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={coverUploading}
          onClick={() => coverInputRef.current?.click()}
          type="button"
          variant="secondary"
        >
          {coverUploading ? copy.cover.uploading : copy.cover.upload}
        </Button>
      </div>
    )}
  </div>
</div>

{/* Body card */}
<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
  <label
    className="mb-2 block text-sm font-medium text-neutral-500"
    htmlFor="blog-composer-body"
  >
    {copy.bodyLabel}
  </label>
  <BlogRichTextEditor
    aria-label={copy.bodyLabel}
    id="blog-composer-body"
    onChange={(html) => setPost({ ...post, content: html })}
    onUploadImage={handleUploadImage}
    placeholder={copy.bodyPlaceholder}
    value={contentHtml}
  />
</div>
```

- [ ] **Step 2: Verify typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tripper/blog/BlogComposer.tsx
git commit -m "refactor(blog): split cover and body into separate panel cards"
```

---

## Task 5: Add gallery image upload block

**Files:**
- Modify: `src/components/tripper/blog/BlogComposer.tsx`

Add state, handlers, and JSX for the gallery block. Gallery images are stored as `{ type: 'image', url, caption }` entries in `post.blocks`.

- [ ] **Step 1: Add imports**

Add `ImagePlus` to the lucide-react import at the top:

```ts
import { ImagePlus, Save, X } from "lucide-react";
```

- [ ] **Step 2: Add gallery state and ref**

After the existing `const coverInputRef = useRef<HTMLInputElement>(null);` line, add:

```ts
const galleryInputRef = useRef<HTMLInputElement>(null);
const [galleryUploading, setGalleryUploading] = useState(false);
```

- [ ] **Step 3: Add gallery handlers**

After `handleCoverFileChange`, add:

```ts
const handleGalleryFilesChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const files = Array.from(event.target.files ?? []);
  event.target.value = "";
  if (!files.length) return;
  setGalleryUploading(true);
  try {
    const urls = await Promise.all(files.map(uploadImageFile));
    setPost((p) => ({
      ...p,
      blocks: [
        ...(p.blocks ?? []),
        ...urls.map((url) => ({ type: "image" as const, url, caption: "" })),
      ],
    }));
  } catch {
    toast.error(copy.toasts.uploadError);
  } finally {
    setGalleryUploading(false);
  }
};

const removeGalleryImage = (blockIndex: number) => {
  setPost((p) => ({
    ...p,
    blocks: (p.blocks ?? []).filter((_, i) => i !== blockIndex),
  }));
};

const updateGalleryCaption = (blockIndex: number, caption: string) => {
  setPost((p) => ({
    ...p,
    blocks: (p.blocks ?? []).map((b, i) =>
      i === blockIndex ? { ...b, caption } : b,
    ),
  }));
};
```

- [ ] **Step 4: Compute gallery image list**

After `const contentHtml = ...` line, add:

```ts
const galleryImages = (post.blocks ?? [])
  .map((b, i) => ({ ...b, _index: i }))
  .filter(
    (b): b is { type: "image"; url: string; caption?: string; _index: number } =>
      b.type === "image",
  );
```

- [ ] **Step 5: Add gallery JSX below the body card**

After the body card closing `</div>`, add:

```tsx
{/* Gallery card */}
<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
  <h3 className="mb-2 text-lg font-semibold text-neutral-900">
    {copy.gallery.title}
  </h3>
  <p className="mb-4 text-sm text-neutral-600">{copy.gallery.hint}</p>

  <input
    accept="image/*"
    className="hidden"
    multiple
    onChange={handleGalleryFilesChange}
    ref={galleryInputRef}
    type="file"
  />

  <Button
    disabled={galleryUploading}
    onClick={() => galleryInputRef.current?.click()}
    type="button"
    variant="secondary"
  >
    <ImagePlus className="h-4 w-4" />
    {galleryUploading ? copy.gallery.uploading : copy.gallery.upload}
  </Button>

  {galleryImages.length > 0 && (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {galleryImages.map((img) => (
        <div className="flex flex-col gap-1" key={img._index}>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200">
            <Img
              alt={img.caption ?? ""}
              className="h-full w-full object-cover"
              height={200}
              src={img.url}
              width={200}
            />
            <button
              aria-label={copy.gallery.removeAria}
              className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-neutral-700 hover:bg-white hover:text-neutral-900"
              onClick={() => removeGalleryImage(img._index)}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <input
            className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onChange={(e) => updateGalleryCaption(img._index, e.target.value)}
            placeholder={copy.gallery.captionPlaceholder}
            type="text"
            value={img.caption ?? ""}
          />
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: Verify typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors, no raw `<img>` warnings.

- [ ] **Step 7: Commit**

```bash
git add src/components/tripper/blog/BlogComposer.tsx
git commit -m "feat(blog): add gallery image upload block"
```

---

## Task 6: Final verification

- [ ] **Step 1: Full typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 2: Manual smoke test**

1. Open `npm run dev` and navigate to Tripper OS → create a new blog post
2. Upload a cover image — verify preview appears
3. Upload 1–3 gallery images — verify thumbnails appear in the grid
4. Add a caption to one thumbnail
5. Remove one gallery image — verify it disappears from the grid
6. Save as draft — verify no console errors
7. Navigate to the saved post's public page (`/blog/[slug]`) — verify the `LightboxCarousel` shows cover + gallery images in order
