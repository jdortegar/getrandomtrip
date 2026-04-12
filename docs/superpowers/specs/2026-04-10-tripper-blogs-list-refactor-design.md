# Tripper Blogs List Page Refactor — Design Spec

**Date:** 2026-04-10
**Scope:** `/dashboard/tripper/blogs/page.tsx` — UI/UX refactor to match tripper dashboard aesthetic, server-side data fetching, component extraction

---

## Goal

Replace the current monolithic client-component page (GlassCard + Hero + grid of cards) with a server-rendered page that passes data to a thin client shell, using the same row-based layout as `UpcomingTripsPanel` in the client dashboard.

---

## Files Changed

### New files
```
src/components/app/dashboard/tripper/BlogPostRow.tsx
src/components/app/dashboard/tripper/BlogPostsList.tsx
src/components/app/dashboard/tripper/BlogsPageClient.tsx
```

### Modified files
```
src/app/[locale]/dashboard/tripper/blogs/page.tsx   # server component, auth + data
src/lib/types/dictionary.ts                          # add TripperBlogsDict
src/dictionaries/es.json                             # add tripperBlogs key
src/dictionaries/en.json                             # add tripperBlogs key
```

No `index.ts` barrel. Components imported directly by path. `BlogPost` type from `src/types/blog.ts` — no new types needed.

---

## Page Architecture

```
page.tsx (server component)
  └─ BlogsPageClient.tsx ("use client")
       └─ BlogPostsList.tsx
            └─ BlogPostRow.tsx (per post)
```

**`page.tsx`** — server component:
- `getServerSession(authOptions)` — redirect to `/login` if no session
- `hasRoleAccess(user.role, 'tripper')` — redirect if wrong role (use `src/lib/auth/roleAccess.ts`)
- `prisma.blogPost.findMany({ where: { authorId }, orderBy: { createdAt: 'desc' } })` — import `prisma` from `@/lib/prisma`
- Passes `posts: BlogPost[]` as prop to `<BlogsPageClient>`
- No `"use client"`, no `SecureRoute`, no `useEffect`

**`BlogsPageClient.tsx`** — client shell:
- `"use client"`
- `useParams()` for locale
- Imports dict statically, selects `tripperBlogs` slice by locale
- Renders `<HeaderHero>` + `<Section>` + `<BlogPostsList>`

---

## Visual Style

**Header:** `<HeaderHero>` with `copy.header.title` + `copy.header.description`, same video/fallback as rest of tripper dashboard.

**Panel:** `<BlogPostsList>` wraps a `bg-white p-6 rounded-xl border border-gray-200 shadow-sm` panel with:
- Header row: title left + `<Button asChild size="sm">` "Nuevo Post" right (links to `/dashboard/tripper/blogs/new`)
- List of `<BlogPostRow>` with `space-y-3`
- Empty state: `BookOpen` icon + message + CTA button

**Row (`BlogPostRow`):** Mirrors `UpcomingTripsPanel` rows exactly:

```
flex items-center rounded-xl border border-neutral-200 bg-white shadow-sm
transition-all duration-300 hover:shadow-md p-3
```

Layout left to right:
1. **Thumbnail** `w-[80px] h-[90px] rounded-lg overflow-hidden` — `<Img>` if `post.coverUrl`, else neutral placeholder `bg-gray-100` with `BookOpen` icon centered
2. **Content** `flex-1 px-4 py-3 space-y-1`:
   - Title: `font-bold text-base text-neutral-900`
   - Subtitle: `text-sm text-neutral-500 line-clamp-2` (if present)
   - Tags: up to 3, `px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600`
   - Date: `text-xs text-neutral-400` — `publishedAt` if published, `updatedAt` prefixed with copy
3. **Actions** `shrink-0 flex flex-col items-end gap-2 px-4 py-3`:
   - Status badge: `px-2 py-0.5 text-xs rounded-full border` — green for published, yellow for draft
   - `<Button asChild size="sm" variant="ghost">` Edit → `/dashboard/tripper/blogs/${post.id}`
   - `<Button asChild size="sm" variant="ghost">` Ver (published only) → `/blog/${post.slug ?? post.id}` with `target="_blank"`

---

## Dictionary Shape

Added to both `src/dictionaries/es.json` and `src/dictionaries/en.json` under key `tripperBlogs`:

```json
{
  "tripperBlogs": {
    "header": {
      "title": "Mis Posts",
      "description": "Gestiona tu blog y comparte tus experiencias"
    },
    "newPost": "Nuevo Post",
    "empty": {
      "message": "Aún no tienes posts. ¡Es hora de contar tu primera historia!",
      "cta": "Crear mi primer post"
    },
    "row": {
      "edit": "Editar",
      "view": "Ver",
      "published": "Publicado",
      "draft": "Borrador",
      "updatedAt": "Actualizado"
    }
  }
}
```

`TripperBlogsDict` interface added to `src/lib/types/dictionary.ts`, referenced as `tripperBlogs: TripperBlogsDict` in `MarketingDictionary`.

---

## Component Details

### `BlogPostRow`
- Props: `post: BlogPost`, `copy: TripperBlogsDict['row']`
- Named export
- Pure presentational — no state, no data fetching
- Uses `<Img>` for cover, `<Button asChild>` for actions

### `BlogPostsList`
- Props: `posts: BlogPost[]`, `copy: TripperBlogsDict`
- Named export
- Renders panel wrapper, header with CTA, empty state or list of `BlogPostRow`

### `BlogsPageClient`
- Props: `posts: BlogPost[]`
- `"use client"` — only client concern is `useParams()` for locale
- Renders `<HeaderHero>` + `<Section><div className="rt-container">` + `<BlogPostsList>`

### `page.tsx`
- Server component (no `"use client"`)
- Auth via `getServerSession` + `hasRoleAccess`
- Data via `prisma.blogPost.findMany`
- Renders `<BlogsPageClient posts={posts} />`

---

## Out of Scope

- No changes to `/dashboard/tripper/blogs/new` or `/dashboard/tripper/blogs/[id]`
- No pagination — full list, same as current
- No search or filter
- No delete action on this page
