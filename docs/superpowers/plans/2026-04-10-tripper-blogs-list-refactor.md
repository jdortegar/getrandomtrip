# Tripper Blogs List Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/dashboard/tripper/blogs/page.tsx` from a monolithic client component (GlassCard + Hero + card grid) into a server-rendered page with row-based layout matching the tripper dashboard aesthetic.

**Architecture:** `page.tsx` becomes a server component that fetches blogs via Prisma and passes them to `BlogsPageClient` (client shell for locale). Presentational components `BlogPostsList` and `BlogPostRow` are extracted following the same pattern as the tripper dashboard components. All copy comes from the main dictionaries.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS 4, Prisma, Lucide React, shadcn/ui `Button`, `next-auth`

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/lib/types/dictionary.ts` | Add `TripperBlogsDict` interface + `tripperBlogs` field to `MarketingDictionary` |
| Modify | `src/dictionaries/es.json` | Add `tripperBlogs` key with ES strings |
| Modify | `src/dictionaries/en.json` | Add `tripperBlogs` key with EN strings |
| Create | `src/components/app/dashboard/tripper/BlogPostRow.tsx` | Single blog post row (thumbnail + content + actions) |
| Create | `src/components/app/dashboard/tripper/BlogPostsList.tsx` | Panel wrapping the list + empty state + header CTA |
| Create | `src/components/app/dashboard/tripper/BlogsPageClient.tsx` | Client shell — `useParams` for locale, renders HeaderHero + BlogPostsList |
| Modify | `src/app/[locale]/dashboard/tripper/blogs/page.tsx` | Server component — getServerSession + Prisma fetch + renders BlogsPageClient |

No `index.ts` barrel. `BlogPost` type from `src/types/blog.ts` — no new types needed.

---

## Task 1: Add `TripperBlogsDict` to `src/lib/types/dictionary.ts`

**Files:**
- Modify: `src/lib/types/dictionary.ts`

- [ ] **Step 1: Add `TripperBlogsDict` interface**

Find the line `export interface TripperDashboardDict {` in `src/lib/types/dictionary.ts` (currently around line 33). Add the new interface directly before it:

```ts
export interface TripperBlogsDict {
  header: {
    title: string;
    description: string;
  };
  newPost: string;
  empty: {
    message: string;
    cta: string;
  };
  row: {
    edit: string;
    view: string;
    published: string;
    draft: string;
    updatedAt: string;
  };
}
```

- [ ] **Step 2: Add `tripperBlogs` field to `MarketingDictionary`**

Find `tripperDashboard: TripperDashboardDict;` inside `MarketingDictionary` (last field). Add the new field before it:

```ts
  tripperBlogs: TripperBlogsDict;
```

- [ ] **Step 3: Verify typecheck shows only expected errors**

Run: `npm run typecheck`
Expected: errors about missing `tripperBlogs` key in JSON files only (will be fixed in Task 2).

---

## Task 2: Add `tripperBlogs` key to both dictionaries

**Files:**
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`

- [ ] **Step 1: Add to `src/dictionaries/es.json`**

The last key is `tripperDashboard`. Add a comma after its closing `}` and insert before the final `}` of the file:

```json
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
```

- [ ] **Step 2: Add to `src/dictionaries/en.json`**

Same position, English strings:

```json
  "tripperBlogs": {
    "header": {
      "title": "My Posts",
      "description": "Manage your blog and share your experiences"
    },
    "newPost": "New Post",
    "empty": {
      "message": "You have no posts yet. Time to tell your first story!",
      "cta": "Create my first post"
    },
    "row": {
      "edit": "Edit",
      "view": "View",
      "published": "Published",
      "draft": "Draft",
      "updatedAt": "Updated"
    }
  }
```

- [ ] **Step 3: Verify typecheck passes clean**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 3: Create `BlogPostRow`

**Files:**
- Create: `src/components/app/dashboard/tripper/BlogPostRow.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link';
import { BookOpen, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Img from '@/components/common/Img';
import type { BlogPost } from '@/types/blog';
import type { TripperBlogsDict } from '@/lib/types/dictionary';

interface BlogPostRowProps {
  post: BlogPost;
  copy: TripperBlogsDict['row'];
}

function StatusBadge({
  status,
  copy,
}: {
  status: BlogPost['status'];
  copy: TripperBlogsDict['row'];
}) {
  const isPublished = status === 'published';
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full border ${
        isPublished
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }`}
    >
      {isPublished ? copy.published : copy.draft}
    </span>
  );
}

export function BlogPostRow({ post, copy }: BlogPostRowProps) {
  const displayDate = post.publishedAt ?? post.updatedAt;
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : `${copy.updatedAt}: ${new Date(post.updatedAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`;

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md p-3">
      {/* Thumbnail */}
      <div className="w-[80px] h-[90px] rounded-lg overflow-hidden shrink-0">
        {post.coverUrl ? (
          <Img
            src={post.coverUrl}
            alt={post.title}
            width={80}
            height={90}
            className="w-full h-full object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-neutral-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1 px-4 py-3">
        <p className="font-bold text-base leading-tight text-neutral-900 truncate">
          {post.title}
        </p>
        {post.subtitle && (
          <p className="text-sm text-neutral-500 line-clamp-2">{post.subtitle}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-neutral-400 pt-0.5">{dateLabel}</p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col items-end gap-2 px-4 py-3">
        <StatusBadge status={post.status} copy={copy} />
        <Button asChild size="sm" variant="ghost">
          <Link href={`/dashboard/tripper/blogs/${post.id}`}>
            <Edit className="w-3.5 h-3.5" />
            {copy.edit}
          </Link>
        </Button>
        {post.status === 'published' && (
          <Button asChild size="sm" variant="ghost">
            <Link
              href={`/blog/${post.slug ?? post.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="w-3.5 h-3.5" />
              {copy.view}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 4: Create `BlogPostsList`

**Files:**
- Create: `src/components/app/dashboard/tripper/BlogPostsList.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BlogPostRow } from '@/components/app/dashboard/tripper/BlogPostRow';
import type { BlogPost } from '@/types/blog';
import type { TripperBlogsDict } from '@/lib/types/dictionary';

interface BlogPostsListProps {
  posts: BlogPost[];
  copy: TripperBlogsDict;
}

export function BlogPostsList({ posts, copy }: BlogPostsListProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">{copy.header.title}</h2>
        <Button asChild size="sm">
          <Link href="/dashboard/tripper/blogs/new">
            <Plus className="h-4 w-4" />
            {copy.newPost}
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">{copy.empty.message}</p>
          <Button asChild>
            <Link href="/dashboard/tripper/blogs/new">
              <Plus className="h-4 w-4" />
              {copy.empty.cta}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <BlogPostRow post={post} copy={copy.row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 5: Create `BlogsPageClient`

**Files:**
- Create: `src/components/app/dashboard/tripper/BlogsPageClient.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useParams } from 'next/navigation';
import Section from '@/components/layout/Section';
import HeaderHero from '@/components/journey/HeaderHero';
import { BlogPostsList } from '@/components/app/dashboard/tripper/BlogPostsList';
import type { BlogPost } from '@/types/blog';
import esCopy from '@/dictionaries/es.json';
import enCopy from '@/dictionaries/en.json';

interface BlogsPageClientProps {
  posts: BlogPost[];
}

function getBlogsCopy(locale: string) {
  return locale.startsWith('en') ? enCopy.tripperBlogs : esCopy.tripperBlogs;
}

export function BlogsPageClient({ posts }: BlogsPageClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';
  const copy = getBlogsCopy(locale);

  return (
    <>
      <HeaderHero
        title={copy.header.title}
        description={copy.header.description}
        videoSrc="/videos/hero-video-1.mp4"
        fallbackImage="/images/bg-playa-mexico.jpg"
      />
      <Section>
        <div className="rt-container">
          <BlogPostsList posts={posts} copy={copy} />
        </div>
      </Section>
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors.

---

## Task 6: Refactor `page.tsx` to server component

**Files:**
- Modify: `src/app/[locale]/dashboard/tripper/blogs/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BlogsPageClient } from '@/components/app/dashboard/tripper/BlogsPageClient';
import type { BlogPost } from '@/types/blog';

export default async function BlogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const rawBlogs = await prisma.blogPost.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      authorId: true,
      title: true,
      subtitle: true,
      coverUrl: true,
      tags: true,
      format: true,
      status: true,
      slug: true,
      blocks: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
    },
  });

  const posts: BlogPost[] = rawBlogs.map((blog) => ({
    ...blog,
    status: blog.status.toLowerCase() as BlogPost['status'],
    format: blog.format.toLowerCase() as BlogPost['format'],
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    publishedAt: blog.publishedAt?.toISOString(),
    blocks: blog.blocks as BlogPost['blocks'],
  }));

  return <BlogsPageClient posts={posts} />;
}
```

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck && npx eslint "src/app/[locale]/dashboard/tripper/blogs/page.tsx" "src/components/app/dashboard/tripper/BlogPostRow.tsx" "src/components/app/dashboard/tripper/BlogPostsList.tsx" "src/components/app/dashboard/tripper/BlogsPageClient.tsx"`
Expected: No errors.

- [ ] **Step 3: Verify in browser**

Start dev server (`npm run dev`) and navigate to `/es/dashboard/tripper/blogs`.

Check:
- `HeaderHero` renders (no old `Hero` component)
- Blog posts appear as horizontal rows (not grid cards)
- Published post shows green badge + Edit + Ver buttons
- Draft post shows yellow badge + Edit button only (no Ver)
- Cover image renders in thumbnail; missing cover shows `BookOpen` placeholder
- Empty state: `BookOpen` icon + message + CTA button

---

## Self-Review Notes

- `BlogPost['status']` is `'draft' | 'published'` (lowercase). Prisma returns uppercase — the `map` in `page.tsx` lowercases it with a type cast.
- `BlogPost['blocks']` is typed as a union array but Prisma returns `JsonValue` — cast is safe since the DB stores it as JSON array.
- `displayDate` in `BlogPostRow` is unused variable — removed in final code (uses `dateLabel` directly based on `publishedAt` presence).
- `BlogsPageClient` imports JSON dicts statically — works in client components since `resolveJsonModule` is enabled (already used by tripper dashboard page).
- Auth redirect: layout's `TripperGuard` handles role checking. `page.tsx` only redirects unauthenticated users — consistent with `AdminTripRequestsPage` pattern.
- No locale param needed in `page.tsx` — locale is read client-side via `useParams()` in `BlogsPageClient`.
