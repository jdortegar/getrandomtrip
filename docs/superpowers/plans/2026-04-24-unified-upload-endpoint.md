# Unified Upload Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace two separate upload routes (`/api/user/avatar` and `/api/tripper/blog-media`) and a dead stub (`/api/upload`) with a single unified `POST /api/upload` endpoint that stores files in one Netlify Blobs store using the key pattern `{userId}/{feature}/{uuid}.{ext}`.

**Architecture:** A single route at `src/app/api/upload/route.ts` handles both upload (`POST`) and serving (`GET`). All uploads land in one blob store named `user-media`. Callers pass a `feature` string in FormData; the route builds the key and returns a URL pointing back to the same `GET` handler. Avatar URL persistence moves to the existing `/api/user/update` PATCH route.

**Tech Stack:** Next.js App Router API routes, `@netlify/blobs`, NextAuth, Prisma, TypeScript

---

## File Map

| Action | File |
|--------|------|
| **Create** | `src/app/api/upload/route.ts` |
| **Modify** | `src/app/api/user/update/route.ts` |
| **Delete** | `src/app/api/user/avatar/route.ts` |
| **Delete** | `src/app/api/tripper/blog-media/route.ts` |
| **Modify** | `src/app/[locale]/(secure)/profile/page.tsx` |
| **Modify** | `src/components/tripper/blog/BlogComposer.tsx` |
| **Modify** | `src/components/app/tripper/tripper-profile/TripperProfileClient.tsx` |

---

## Task 1: Create the unified upload route

**Files:**
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORE_NAME = "user-media";

function getBlobStore() {
  return getStore(STORE_NAME, {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN }
      : {}),
  });
}

function isSafeKey(key: string): boolean {
  if (key.length > 512 || key.length < 8) return false;
  if (key.includes("..") || key.includes("//")) return false;
  // {userId}/{feature}/{uuid}.{ext}
  return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(key);
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isSafeKey(key)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    const store = getBlobStore();
    const result = await store.getWithMetadata(key, { type: "blob" });
    if (!result) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const contentType =
      typeof result.metadata.contentType === "string"
        ? result.metadata.contentType
        : "application/octet-stream";

    return new NextResponse(result.data, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("[upload] GET", error);
    return new NextResponse("Blob store unavailable", { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const rawFeature = formData.get("feature");
    if (typeof rawFeature !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(rawFeature)) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop() ?? "bin";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
    const key = `${session.user.id}/${rawFeature}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";

    const store = getBlobStore();
    await store.set(key, arrayBuffer, { metadata: { contentType } });

    const url = `${request.nextUrl.origin}/api/upload?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] POST", error);
    return NextResponse.json({ error: "Blob storage unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 2: Run typecheck to verify no errors**

```bash
npm run typecheck
```

Expected: no errors in `src/app/api/upload/route.ts`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "feat: add unified /api/upload route (GET + POST, user-media blob store)"
```

---

## Task 2: Add `avatarUrl` to `/api/user/update`

**Files:**
- Modify: `src/app/api/user/update/route.ts`

- [ ] **Step 1: Update the PATCH body type and data builder**

In `src/app/api/user/update/route.ts`, find the PATCH handler. Update the body destructure and `data` builder to include `avatarUrl`:

```typescript
// Replace this block (around line 59–68):
const body = await request.json();
const { address, email, name, phone } = body as {
  address?: unknown;
  email?: string;
  name?: string;
  phone?: string | null;
};

const data: Prisma.UserUpdateInput = {};
```

With:

```typescript
const body = await request.json();
const { address, avatarUrl, email, name, phone } = body as {
  address?: unknown;
  avatarUrl?: string;
  email?: string;
  name?: string;
  phone?: string | null;
};

const data: Prisma.UserUpdateInput = {};
```

- [ ] **Step 2: Add `avatarUrl` handling after the `data` object is declared**

Add this block immediately after `const data: Prisma.UserUpdateInput = {};`:

```typescript
if (typeof avatarUrl === "string" && avatarUrl.trim()) {
  data.avatarUrl = avatarUrl.trim();
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors. If Prisma reports `avatarUrl` doesn't exist on `UserUpdateInput`, verify the field name in `prisma/schema.prisma` — look for the avatar URL field on the `User` model and use that exact name.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/update/route.ts
git commit -m "feat: accept avatarUrl in PATCH /api/user/update"
```

---

## Task 3: Migrate avatar upload in profile page

**Files:**
- Modify: `src/app/[locale]/(secure)/profile/page.tsx`

- [ ] **Step 1: Update `handleAvatarChange` to use the unified endpoint**

Find `handleAvatarChange` (around line 343). Replace the entire function body with:

```typescript
const handleAvatarChange = async (file: File) => {
  if (!dict) return;
  const t = dict.profile.toasts;
  setAvatarUploading(true);
  try {
    // 1. Upload file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("feature", "avatar");
    const uploadRes = await fetch("/api/upload", {
      body: formData,
      method: "POST",
    });
    if (!uploadRes.ok) {
      toast.error(t.avatarUploadError);
      return;
    }
    const { url } = (await uploadRes.json()) as { url?: string };
    if (!url) {
      toast.error(t.avatarUploadError);
      return;
    }

    // 2. Persist to DB
    const updateRes = await fetch("/api/user/update", {
      body: JSON.stringify({ avatarUrl: url }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (!updateRes.ok) {
      toast.error(t.avatarUploadError);
      return;
    }

    // 3. Update session + store
    await updateSession({
      ...session,
      user: { ...session?.user, image: url },
    });
    useUserStore.setState((s) => ({
      user: s.user ? { ...s.user, avatar: url } : s.user,
    }));
    toast.success(t.avatarUploadSuccess);
  } catch {
    toast.error(t.avatarUploadError);
  } finally {
    setAvatarUploading(false);
  }
};
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(secure)/profile/page.tsx
git commit -m "feat: migrate avatar upload to /api/upload"
```

---

## Task 4: Migrate blog image upload in BlogComposer

**Files:**
- Modify: `src/components/tripper/blog/BlogComposer.tsx`

- [ ] **Step 1: Update `uploadImageFile` to use the unified endpoint**

Find `uploadImageFile` (around line 33). Replace the entire function with:

```typescript
async function uploadImageFile(file: File, feature: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("feature", feature);
  const response = await fetch("/api/upload", {
    body: formData,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("upload failed");
  }
  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error("no url");
  }
  return data.url;
}
```

- [ ] **Step 2: Update all call sites of `uploadImageFile`**

Search the file for every call to `uploadImageFile`. The old signature was `uploadImageFile(file, postId?)` where `postId` was used for key namespacing. The new signature is `uploadImageFile(file, feature)`.

Replace calls with the appropriate feature string:
- Cover image uploads → `uploadImageFile(file, "blog-cover")`
- Gallery/inline image uploads → `uploadImageFile(file, "blog-gallery")`

If you're unsure which is which, look for the context — cover images come from `coverInputRef`, gallery images from `galleryInputRef` or the rich text editor's image handler.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/tripper/blog/BlogComposer.tsx
git commit -m "feat: migrate blog image upload to /api/upload"
```

---

## Task 5: Migrate tripper hero image upload

**Files:**
- Modify: `src/components/app/tripper/tripper-profile/TripperProfileClient.tsx`

- [ ] **Step 1: Update `handleUploadHeroImage`**

Find `handleUploadHeroImage` (around line 268). Replace the fetch call inside the try block:

```typescript
// Replace this:
const upload = new FormData();
upload.append("file", file);
const response = await fetch("/api/tripper/blog-media", {
  body: upload,
  method: "POST",
});
if (!response.ok) throw new Error("upload failed");
const data = (await response.json()) as { location?: string };
if (!data.location) throw new Error("missing url");
setFormData((prev) => ({ ...prev, heroImage: data.location as string }));
setProfile((prev) => ({ ...prev, heroImage: data.location as string }));

// With this:
const upload = new FormData();
upload.append("file", file);
upload.append("feature", "tripper-hero");
const response = await fetch("/api/upload", {
  body: upload,
  method: "POST",
});
if (!response.ok) throw new Error("upload failed");
const data = (await response.json()) as { url?: string };
if (!data.url) throw new Error("missing url");
setFormData((prev) => ({ ...prev, heroImage: data.url as string }));
setProfile((prev) => ({ ...prev, heroImage: data.url as string }));
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/app/tripper/tripper-profile/TripperProfileClient.tsx
git commit -m "feat: migrate tripper hero image upload to /api/upload"
```

---

## Task 6: Delete old upload routes

**Files:**
- Delete: `src/app/api/user/avatar/route.ts`
- Delete: `src/app/api/tripper/blog-media/route.ts`
- Delete: (old stub) — already replaced by new `src/app/api/upload/route.ts`

- [ ] **Step 1: Delete the old routes**

```bash
rm src/app/api/user/avatar/route.ts
rm src/app/api/tripper/blog-media/route.ts
```

- [ ] **Step 2: Run typecheck and lint to confirm nothing imports these routes**

```bash
npm run typecheck && npm run lint
```

Expected: no errors. These are API routes — they are not imported by other modules, only called via `fetch`. If errors appear, they are unrelated to the deletion.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old avatar and blog-media upload routes"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 2: Lint check**

```bash
npm run lint
```

Expected: zero errors or warnings introduced by this change.

- [ ] **Step 3: Manual smoke test — avatar upload**

1. Start dev server: `npm run dev`
2. Log in and go to `/profile`
3. Click the avatar change button and upload an image
4. Verify the avatar updates in the UI immediately
5. Refresh — verify the avatar persists (DB write succeeded)
6. Check the URL of the avatar image — it should start with `/api/upload?key=`
7. The key should match pattern `{userId}/avatar/{uuid}.{ext}`

- [ ] **Step 4: Manual smoke test — blog image upload**

1. Go to `/dashboard/tripper` → Blog → New post
2. Upload a cover image
3. Verify it appears in the preview
4. Check the URL — should be `/api/upload?key={userId}/blog-cover/{uuid}.{ext}`

- [ ] **Step 5: Manual smoke test — tripper hero image**

1. Go to tripper profile edit
2. Upload a hero/cover image
3. Verify it displays
4. Check the URL — should be `/api/upload?key={userId}/tripper-hero/{uuid}.{ext}`

- [ ] **Step 6: Verify public access**

Open one of the image URLs in an incognito window (no session). It should load the image without redirecting to login.
