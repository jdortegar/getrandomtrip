# Avatar Upload — Design Spec

**Date:** 2026-04-21
**Scope:** Profile page only. Camera-icon overlay on the `UserAvatar` component triggers a file upload that persists the avatar to Netlify Blobs and the DB.

---

## Problem

`User.avatarUrl` exists in the DB and Prisma schema, and `UserAvatar` can render it, but:

- The session callback in `auth.ts` never selects `avatarUrl`, so it never reaches the session or Zustand store after login.
- `/api/user/me` omits `avatarUrl` from its query and response.
- `UserProfileMe` type has no `avatarUrl` field.
- There is no upload surface in the UI.

---

## Architecture

### 1. `UserAvatar` component — `src/components/ui/UserAvatar.tsx`

Add one optional prop:

```ts
onAvatarChange?: (file: File) => void
```

Behaviour when the prop is present:
- Wrap the avatar content in a `<button type="button">` that triggers a hidden `<input type="file" accept="image/*">`.
- On hover, render a dark semi-transparent circular overlay with a `Camera` icon (lucide-react, `h-5 w-5`, white) centered over the avatar.
- Add `cursor-pointer` to the button.
- The component does **not** own any upload state, fetch logic, or toasts — it only calls `onAvatarChange(file)` and lets the caller handle the rest.

### 2. New API route — `src/app/api/user/avatar/route.ts`

`POST /api/user/avatar`

- Auth-gated (session required, any role).
- Accepts `multipart/form-data` with a `file` field.
- Validates: file must be a `File` instance; rejects if missing.
- Blob key: `avatars/{userId}/{uuid}.{ext}` — user-scoped, one upload per call.
- Uses the same `getStore` / Netlify Blobs pattern as `blog-media`.
- Writes `avatarUrl` to `User` via `prisma.user.update`.
- Returns `{ avatarUrl: string }` — the full URL via `GET /api/user/avatar?key=…`.

`GET /api/user/avatar?key=…`

- No auth required (avatar images are public once you have the key).
- Validates key with `isSafeBlobKey` (prefix `avatars/`, same safety rules as blog-media).
- Streams blob bytes with correct `Content-Type` and long-lived cache headers.

### 3. Fix session callback — `src/lib/auth.ts`

In the `session` callback's DB select, add `avatarUrl: true`. Map it onto `session.user.avatarUrl` and `session.user.image` (NextAuth's conventional field) so `UserAvatar` gets it on page load without needing `/api/user/me`.

### 4. Fix `/api/user/me` — `src/app/api/user/me/route.ts`

Add `avatarUrl: true` to the Prisma select. Include `avatarUrl` in the returned `UserProfileMe` object.

### 5. Fix `UserProfileMe` type — `src/lib/types/UserProfileMe.ts`

Add `avatarUrl?: string | null`.

### 6. Profile page — `src/app/[locale]/(secure)/profile/page.tsx`

- Add `avatarUploading` state (`boolean`).
- Pass `onAvatarChange={handleAvatarChange}` to `<UserAvatar>`.
- `handleAvatarChange(file)`:
  1. Set `avatarUploading = true`.
  2. `POST /api/user/avatar` with the file as FormData.
  3. On success: call `updateSession({ ...session, user: { ...session.user, image: avatarUrl, avatarUrl } })`, then patch the Zustand store directly via `useUserStore.setState((s) => ({ user: s.user ? { ...s.user, avatar: avatarUrl } : s.user }))` — `updateAccount` only accepts name/email so direct setState is the right path here.
  4. On error: `toast.error(...)`.
  5. Always: `setAvatarUploading(false)`.
- While uploading, pass a loading indicator or disable the avatar button (overlay shows a spinner instead of the camera icon — optional, keep simple).

---

## Data Flow

```
User clicks avatar → file picker opens → file selected
  → handleAvatarChange(file) in profile page
  → POST /api/user/avatar (FormData)
    → Netlify Blobs: avatars/{userId}/{uuid}.ext
    → prisma.user.update({ avatarUrl })
    → returns { avatarUrl }
  → updateSession({ image: avatarUrl })   ← JWT/session refreshed
  → userStore.updateAccount({ avatar: avatarUrl })  ← store updated
  → UserAvatar re-renders with new image
```

---

## Error Handling

- No file selected: early return (no-op).
- Upload fails (non-OK response): `toast.error` with i18n key.
- Blob store unavailable: API returns 503, surface same toast.
- Invalid file type: browser `accept="image/*"` is first line of defence; no server-side MIME validation needed beyond what the file extension provides (same as blog-media).

---

## i18n

Add to `src/dictionaries/es.json` and `src/dictionaries/en.json` under `profile`:

```json
"avatar": {
  "uploadError": "No se pudo subir la foto de perfil.",
  "uploadSuccess": "Foto de perfil actualizada."
}
```

```json
"avatar": {
  "uploadError": "Could not upload profile photo.",
  "uploadSuccess": "Profile photo updated."
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/UserAvatar.tsx` | Add `onAvatarChange` prop + hover overlay |
| `src/app/api/user/avatar/route.ts` | New — POST upload + GET serve |
| `src/lib/auth.ts` | Add `avatarUrl` to session DB select |
| `src/app/api/user/me/route.ts` | Add `avatarUrl` to select + response |
| `src/lib/types/UserProfileMe.ts` | Add `avatarUrl?: string \| null` |
| `src/app/[locale]/(secure)/profile/page.tsx` | Wire up upload handler + pass prop |
| `src/dictionaries/es.json` | Add avatar toast strings |
| `src/dictionaries/en.json` | Add avatar toast strings |

---

## Out of Scope

- Crop/resize UI before upload.
- Avatar on tripper profile or public pages (separate task).
- Deleting / removing the avatar.
- File size validation beyond browser defaults.
