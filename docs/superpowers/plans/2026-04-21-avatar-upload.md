# Avatar Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users upload a profile avatar from the profile page via a hover overlay on the `UserAvatar` component, persisted to Netlify Blobs and the DB.

**Architecture:** `UserAvatar` gains an `onAvatarChange` callback prop that renders a camera-icon hover overlay; upload logic lives in the profile page. A new `POST /api/user/avatar` route handles blob storage and DB write. Auth session and `/api/user/me` are patched to expose `avatarUrl` so the avatar survives page refreshes.

**Tech Stack:** Next.js 14 App Router, Netlify Blobs (`@netlify/blobs`), Prisma, NextAuth, Zustand, lucide-react, Tailwind CSS 4, Sonner toasts.

---

## File Map

| File | Action |
|------|--------|
| `src/lib/types/UserProfileMe.ts` | Add `avatarUrl?: string \| null` |
| `src/dictionaries/es.json` | Add `profile.toasts.avatarUploadError` + `avatarUploadSuccess` |
| `src/dictionaries/en.json` | Same, in English |
| `src/app/api/user/avatar/route.ts` | Create — GET serve + POST upload |
| `src/lib/auth.ts` | Add `avatarUrl` to session DB select; set `session.user.image` |
| `src/app/api/user/me/route.ts` | Add `avatarUrl` to select + response |
| `src/components/ui/UserAvatar.tsx` | Add `onAvatarChange` prop + hover overlay |
| `src/app/[locale]/(secure)/profile/page.tsx` | Add upload handler + wire to `UserAvatar` |

---

## Task 1: Extend `UserProfileMe` type and i18n strings

**Files:**
- Modify: `src/lib/types/UserProfileMe.ts`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`

- [ ] **Step 1: Add `avatarUrl` to `UserProfileMe`**

Open `src/lib/types/UserProfileMe.ts` and add the field:

```ts
import type { UserProfileAddress } from '@/lib/types/UserProfileAddress';

export interface UserProfileMe {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: UserProfileAddress | null;
  createdAt: string;
  travelerType: string | null;
  interests: string[];
  dislikes: string[];
  role: string;
  avatarUrl?: string | null;
}
```

- [ ] **Step 2: Add avatar toast keys to `es.json`**

In `src/dictionaries/es.json`, find `"profile"` → `"toasts"` (around line 2289). The current closing brace of `toasts` looks like:

```json
      "profileUpdated": "Perfil actualizado correctamente"
    }
```

Replace it with:

```json
      "profileUpdated": "Perfil actualizado correctamente",
      "avatarUploadError": "No se pudo subir la foto de perfil.",
      "avatarUploadSuccess": "Foto de perfil actualizada."
    }
```

- [ ] **Step 3: Add avatar toast keys to `en.json`**

In `src/dictionaries/en.json`, same location:

```json
      "profileUpdated": "Profile updated successfully",
      "avatarUploadError": "Could not upload profile photo.",
      "avatarUploadSuccess": "Profile photo updated."
    }
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/UserProfileMe.ts src/dictionaries/es.json src/dictionaries/en.json
git commit -m "feat: add avatarUrl to UserProfileMe type and i18n avatar toast strings"
```

---

## Task 2: Create `POST /api/user/avatar` and `GET /api/user/avatar` route

**Files:**
- Create: `src/app/api/user/avatar/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/user/avatar/route.ts
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBlobStore() {
  return getStore("user-avatars", {
    consistency: "strong",
    ...(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN
      ? {
          siteID: process.env.NETLIFY_SITE_ID,
          token: process.env.NETLIFY_AUTH_TOKEN,
        }
      : {}),
  });
}

function isSafeAvatarKey(key: string): boolean {
  if (key.length > 256 || key.length < 8) return false;
  if (!key.startsWith("avatars/")) return false;
  if (key.includes("..") || key.includes("//")) return false;
  return /^avatars\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(key);
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !isSafeAvatarKey(key)) {
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
    console.error("[user-avatar] GET", error);
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

    const rawExt = file.name.split(".").pop() ?? "bin";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
    const key = `avatars/${session.user.id}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";

    const store = getBlobStore();
    await store.set(key, arrayBuffer, { metadata: { contentType } });

    const avatarUrl = `${request.nextUrl.origin}/api/user/avatar?key=${encodeURIComponent(key)}`;

    await prisma.user.update({
      data: { avatarUrl },
      where: { id: session.user.id },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("[user-avatar] POST", error);
    return NextResponse.json(
      { error: "Blob storage unavailable" },
      { status: 503 },
    );
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/avatar/route.ts
git commit -m "feat: add POST/GET /api/user/avatar route for avatar blob upload"
```

---

## Task 3: Fix session callback to expose `avatarUrl`

**Files:**
- Modify: `src/lib/auth.ts` (around lines 134–165)

- [ ] **Step 1: Add `avatarUrl` to the session DB select**

In the `session` callback, the `findUnique` select currently ends with `dislikes: true`. Add `avatarUrl`:

```ts
const dbUser = await prisma.user.findUnique({
  where: { id: token.id as string },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    address: true,
    phone: true,
    createdAt: true,
    travelerType: true,
    interests: true,
    dislikes: true,
    avatarUrl: true,
  },
});
```

- [ ] **Step 2: Map `avatarUrl` onto the session**

After the existing assignments (`session.user.dislikes = dbUser.dislikes` etc.), add:

```ts
// Use uploaded avatar if present; otherwise keep OAuth image (e.g. Google photo)
if (dbUser.avatarUrl) {
  session.user.image = dbUser.avatarUrl;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts
git commit -m "fix: expose avatarUrl in NextAuth session callback"
```

---

## Task 4: Fix `/api/user/me` to return `avatarUrl`

**Files:**
- Modify: `src/app/api/user/me/route.ts`

- [ ] **Step 1: Add `avatarUrl` to the Prisma select**

In the `GET` handler, the `findUnique` select currently ends with `dislikes: true`. Add:

```ts
const u = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: {
    id: true,
    name: true,
    email: true,
    phone: true,
    address: true,
    createdAt: true,
    travelerType: true,
    interests: true,
    dislikes: true,
    role: true,
    avatarUrl: true,
  },
});
```

- [ ] **Step 2: Include `avatarUrl` in the returned object**

The `user` object constructed from `u` currently ends with `role: u.role`. Add:

```ts
const user: UserProfileMe = {
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  address: toAddress(u.address),
  createdAt: u.createdAt.toISOString(),
  travelerType: u.travelerType,
  interests: u.interests,
  dislikes: u.dislikes,
  role: u.role,
  avatarUrl: u.avatarUrl,
};
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/me/route.ts
git commit -m "fix: include avatarUrl in /api/user/me response"
```

---

## Task 5: Add hover overlay to `UserAvatar`

**Files:**
- Modify: `src/components/ui/UserAvatar.tsx`

- [ ] **Step 1: Rewrite `UserAvatar` with the new prop and overlay**

```tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useUserStore } from "@/store/slices/userStore";

interface UserAvatarProps {
  height: number;
  onAvatarChange?: (file: File) => void;
  showStatus?: boolean;
  width: number;
}

export function UserAvatar({
  height,
  onAvatarChange,
  showStatus = false,
  width,
}: UserAvatarProps) {
  const { user } = useUserStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const name = user?.name;
  const imageUrl = user?.avatar;
  const initial = name?.charAt(0)?.toUpperCase() || "U";
  const fontSize = Math.max(12, Math.round(Math.min(height, width) * 0.4));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAvatarChange?.(file);
  };

  const avatarContent = (
    <>
      {imageUrl ? (
        <div className="h-full w-full overflow-hidden rounded-full ring-1 ring-gray-200">
          <Image
            alt={name || "User avatar"}
            className="h-full w-full object-cover"
            height={height}
            src={imageUrl}
            width={width}
          />
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white"
          style={{ fontSize }}
        >
          {initial}
        </div>
      )}

      {onAvatarChange && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      )}
    </>
  );

  return (
    <div className="relative" style={{ height, width }}>
      {onAvatarChange ? (
        <>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />
          <button
            className="group relative block h-full w-full cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {avatarContent}
          </button>
        </>
      ) : (
        avatarContent
      )}

      {showStatus && (
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-4 border-white bg-green-500" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/UserAvatar.tsx
git commit -m "feat: add onAvatarChange prop with camera hover overlay to UserAvatar"
```

---

## Task 6: Wire up avatar upload in the profile page

**Files:**
- Modify: `src/app/[locale]/(secure)/profile/page.tsx`

- [ ] **Step 1: Add `avatarUploading` state and `handleAvatarChange` handler**

In `ProfileContent`, after the existing state declarations (around line 84), add:

```ts
const [avatarUploading, setAvatarUploading] = useState(false);
```

Then add the handler after `handleCancelDetailsEdit` (around line 339):

```ts
const handleAvatarChange = async (file: File) => {
  if (!dict) return;
  const t = dict.profile.toasts;
  setAvatarUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/user/avatar", {
      body: formData,
      method: "POST",
    });
    if (!res.ok) {
      toast.error(t.avatarUploadError);
      return;
    }
    const data = (await res.json()) as { avatarUrl?: string };
    if (!data.avatarUrl) {
      toast.error(t.avatarUploadError);
      return;
    }
    await updateSession({
      ...session,
      user: { ...session?.user, image: data.avatarUrl },
    });
    useUserStore.setState((s) => ({
      user: s.user ? { ...s.user, avatar: data.avatarUrl } : s.user,
    }));
    toast.success(t.avatarUploadSuccess);
  } catch {
    toast.error(t.avatarUploadError);
  } finally {
    setAvatarUploading(false);
  }
};
```

- [ ] **Step 2: Pass the handler to `UserAvatar`**

Find the `<UserAvatar height={96} showStatus width={96} />` usage (around line 450) and update it:

```tsx
<UserAvatar
  height={96}
  onAvatarChange={avatarUploading ? undefined : handleAvatarChange}
  showStatus
  width={96}
/>
```

Passing `undefined` when uploading prevents double-submission without adding extra UI state to the component.

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Verify lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/\(secure\)/profile/page.tsx
git commit -m "feat: wire avatar upload handler into profile page"
```

---

## Self-Review Checklist

- [x] `UserProfileMe.avatarUrl` added — Task 1
- [x] i18n toast keys added to both dictionaries — Task 1
- [x] `POST /api/user/avatar` uploads to blobs + writes DB — Task 2
- [x] `GET /api/user/avatar` serves blob bytes — Task 2
- [x] Session callback selects and exposes `avatarUrl` — Task 3
- [x] `/api/user/me` returns `avatarUrl` — Task 4
- [x] `UserAvatar` hover overlay + camera icon — Task 5
- [x] Profile page wires handler + disables during upload — Task 6
- [x] No placeholder text or TBDs in any task
- [x] `useUserStore.setState` used consistently (not `updateAccount` which only accepts name/email)
- [x] `onAvatarChange` prop is additive — no existing `UserAvatar` usages break
