# Design: SEO Metadata & Structured Data

## Technical Approach

Extend Next.js Metadata API with `metadataBase` + per-page `generateMetadata`, introduce a zero-dependency `JsonLd` RSC component, and refactor the blog post page from a monolithic `"use client"` file into an RSC shell + client island to unlock server-side metadata generation.

---

## Architecture Decisions

| Decision | Choice | Alternatives Rejected | Rationale |
|---|---|---|---|
| `metadataBase` value source | `new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://getrandomtrip.com")` in `src/app/layout.tsx` | Hard-coded string only | Env var already exists in project; allows staging/preview URL override without code changes |
| JSON-LD delivery | RSC `JsonLd.tsx` component — `<script type="application/ld+json" dangerouslySetInnerHTML>` | `next-seo`, `schema-dts` lib | Zero new deps; RSC ensures the script renders on the server with no hydration overhead; inline object typed locally |
| Schema builder location | `src/lib/seo/schemas.ts` — pure TS functions, no framework coupling | Co-locate in components | Follows existing `lib/helpers/` pattern; easily testable in isolation; consumed by both pages and the `JsonLd` component |
| Blog RSC refactor strategy | Extract `BlogDetailContent` body → `BlogPostClient.tsx` island; page becomes bare RSC shell | Rewrite from scratch; use route-level `loader` pattern | Minimises diff — all hooks/state/`useEffect` move as-is, only the outer file loses `"use client"` |
| Tripper `heroImage` in metadata | `dbTripper.heroImage ?? dbTripper.avatarUrl ?? "/images/opengraph.jpg"` — no DB query change needed | Re-query with expanded select | `heroImage` is already selected at line 41 of `tripper-queries.ts`; only the metadata function needs updating |
| OG image fallback chain | per-page image → `/images/opengraph.jpg` | No fallback | `opengraph.jpg` (1200×630) is already in `public/`; guarantees rich cards on every page |
| Dictionary keys for home/journey | Add `meta: { title, description }` keys to `es.json` and `en.json` | Hardcode strings in page | Consistent with the `aboutUs.meta` and `xsedPage.meta` pattern used throughout the project |

---

## Data Flow

```
Build time / request time
──────────────────────────────────────────────────────
layout.tsx
  └── metadata: { metadataBase, openGraph.images[opengraph.jpg], twitter }
  └── <JsonLd schema={organizationSchema()} />
  └── <JsonLd schema={webSiteSchema()} />

[locale]/page.tsx (RSC)
  └── generateMetadata → dict.home.meta → { title, description, openGraph }

[locale]/journey/page.tsx (RSC)
  └── generateMetadata → dict.journey.meta → { title, description, openGraph }

[locale]/trippers/[tripper]/page.tsx (RSC)
  └── generateMetadata → getTripperBySlug → heroImage ?? avatarUrl ?? fallback
  └── <JsonLd schema={tripperPersonSchema(dbTripper)} />

[locale]/blog/[slug]/page.tsx  (RSC shell — NEW)
  └── generateMetadata → fetch /api/blogs/[slug] (server-side) → heroImage
  └── <JsonLd schema={blogPostingSchema(post)} />
  └── <Suspense><BlogPostClient slug locale /></Suspense>

[locale]/about-us/page.tsx (RSC)
  └── <JsonLd schema={faqPageSchema(faqItems)} />

[locale]/xsed/page.tsx (RSC)
  └── <JsonLd schema={faqPageSchema(faqItems)} />

lib/seo/schemas.ts  (pure functions — no rendering)
  organizationSchema() → WithContext<Organization>
  webSiteSchema()      → WithContext<WebSite>
  tripperPersonSchema(tripper) → WithContext<Person>
  blogPostingSchema(post)     → WithContext<BlogPosting>
  faqPageSchema(items)        → WithContext<FAQPage>

components/seo/JsonLd.tsx  (RSC, no "use client")
  props: { schema: Record<string, unknown> }
  renders: <script type="application/ld+json" dangerouslySetInnerHTML />
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/seo/schemas.ts` | **Create** | Pure builder functions for each schema.org type |
| `src/components/seo/JsonLd.tsx` | **Create** | RSC component that renders inline JSON-LD `<script>` tag |
| `src/app/layout.tsx` | **Modify** | Add `metadataBase`, default `openGraph` + `twitter`, render `<JsonLd>` for `Organization` + `WebSite` |
| `src/app/[locale]/page.tsx` | **Modify** | Add `generateMetadata` with `dict.home.meta` |
| `src/app/[locale]/journey/page.tsx` | **Modify** | Add `generateMetadata` with `dict.journey.meta` |
| `src/app/[locale]/trippers/[tripper]/page.tsx` | **Modify** | Switch OG image to `heroImage`, add `<JsonLd>` with `tripperPersonSchema` |
| `src/app/[locale]/blog/[slug]/page.tsx` | **Modify** | Remove `"use client"`, add `generateMetadata`, add `<JsonLd>`, render `<BlogPostClient>` island |
| `src/components/app/blog/BlogPostClient.tsx` | **Create** | Client island — contains all `useState`, `useEffect`, `useMemo`, `useParams` from original page |
| `src/app/[locale]/about-us/page.tsx` | **Modify** | Add `<JsonLd>` with `faqPageSchema` using existing `faqItems` array |
| `src/app/[locale]/xsed/page.tsx` | **Modify** | Add `<JsonLd>` with `faqPageSchema` using existing `faqItems` array |
| `src/dictionaries/es.json` | **Modify** | Add `home.meta` and `journey.meta` keys |
| `src/dictionaries/en.json` | **Modify** | Add `home.meta` and `journey.meta` keys |

---

## Interfaces / Contracts

```ts
// src/lib/seo/schemas.ts — function signatures only

export function organizationSchema(): Record<string, unknown>
export function webSiteSchema(): Record<string, unknown>

interface TripperForSchema {
  name: string;
  slug: string;
  avatarUrl: string | null;
  heroImage: string | null;
  bio?: string | null;
}
export function tripperPersonSchema(tripper: TripperForSchema): Record<string, unknown>

interface BlogPostForSchema {
  title: string;
  slug: string;
  coverUrl: string | null;
  seo?: { description?: string } | null;
  publishedAt?: string | null;
  createdAt: string;
  author: { name: string; slug: string };
}
export function blogPostingSchema(post: BlogPostForSchema): Record<string, unknown>

interface FaqItem { question: string; answer: string }
export function faqPageSchema(items: FaqItem[]): Record<string, unknown>
```

```tsx
// src/components/seo/JsonLd.tsx
interface JsonLdProps {
  schema: Record<string, unknown>;
}
export default function JsonLd({ schema }: JsonLdProps) // RSC, no "use client"
```

```tsx
// src/app/[locale]/blog/[slug]/page.tsx — RSC shell sketch
export async function generateMetadata(props): Promise<Metadata> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/blogs/${slug}`)
  const { blog } = await res.json()
  return {
    title: blog?.seo?.title ?? blog?.title,
    description: blog?.seo?.description,
    openGraph: {
      images: [{ url: blog?.coverUrl ?? "/images/opengraph.jpg", width: 1200, height: 630 }],
    },
  }
}

export default async function BlogDetailPage(props) {
  const { locale, slug } = await props.params
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BlogPostClient locale={locale} slug={slug} />
    </Suspense>
  )
}
```

```tsx
// src/components/app/blog/BlogPostClient.tsx
"use client"
interface BlogPostClientProps { slug: string; locale: string }
export default function BlogPostClient({ slug, locale }: BlogPostClientProps)
// Contains all useState, useEffect, useMemo, useParams logic — no changes to logic
```

---

## Blog RSC Refactor — State/Hook Ownership

```
page.tsx (RSC — server)
  ├── generateMetadata      ← server only
  ├── <JsonLd>              ← server only
  └── <Suspense>
        └── <BlogPostClient>  ← "use client" boundary
              ├── useParams()          stays here
              ├── useState(blog)       stays here
              ├── useState(loading)    stays here
              ├── useState(error)      stays here
              ├── useState(authorPosts) stays here
              ├── useState(otherPosts)  stays here
              ├── useState(testimonials) stays here
              ├── useEffect (fetchBlog)  stays here
              ├── useEffect (fetchTestimonials) stays here
              ├── useEffect (fetchAuthorPosts)  stays here
              ├── useEffect (fetchOtherPosts)   stays here
              └── useMemo(carouselImages)        stays here
```

No state or hooks move to the server. The split is purely structural: the RSC outer file drops `"use client"` and wraps the existing component body in a named `BlogPostClient` export.

---

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | `schemas.ts` builders produce valid JSON-LD shapes | Jest: call each builder, assert `@type` and required fields are present |
| Visual | Blog post page renders identically after refactor | Manual smoke test: compare before/after in dev; check loading/error/content states |
| Integration | `generateMetadata` returns correct OG image URL per page | Next.js `metadata` export test or build output inspection |
| External | Structured data validity | Google Rich Results Test on staging after deploy |

---

## Migration / Rollout

No data migration required. Changes are additive (new files + metadata fields). The blog RSC refactor is the only structural change; it is independently reversible via `git revert` of `[slug]/page.tsx` + deletion of `BlogPostClient.tsx`.

Dictionary key additions (`home.meta`, `journey.meta`) must land before or alongside the `generateMetadata` additions to prevent `undefined` access.

---

## Open Questions

- [ ] Should `metadataBase` also cover the locale prefix (e.g. `/es/`) or point to the root domain? Current pattern in `about-us` uses relative OG paths — confirm root domain is correct.
- [ ] `generateMetadata` for the blog shell fetches `/api/blogs/[slug]` server-side — confirm `NEXT_PUBLIC_BASE_URL` is available at build time for static generation, or use direct Prisma call instead.
- [ ] For `BlogPosting.datePublished`: `publishedAt` may be null on draft posts — confirm fallback to `createdAt` is acceptable for schema output.
