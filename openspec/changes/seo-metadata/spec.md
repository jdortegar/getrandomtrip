# SEO Metadata & Structured Data — Specification

## Purpose

Site-wide metadata defaults, per-page OG images, and JSON-LD schemas. All capabilities are new.

---

## Capability: `seo-metadata-defaults`

### Requirement: MetadataBase URL

`src/app/layout.tsx` MUST export `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL)` so all relative OG paths resolve to absolute URLs.

#### Scenario: Relative OG path resolves to absolute

- GIVEN `layout.tsx` exports `metadataBase`
- WHEN a crawler reads `og:image`
- THEN the value is a fully-qualified `https://` URL

---

### Requirement: Site-Wide OG / Twitter Fallback

`layout.tsx` MUST define default `openGraph` and `twitter` blocks referencing `/images/opengraph.jpg` (1200×630). Per-page MAY override.

#### Scenario: Page without custom OG uses fallback

- GIVEN a page without `generateMetadata`
- WHEN a social crawler fetches it
- THEN `og:image` is `<metadataBase>/images/opengraph.jpg` and `twitter:card` is `summary_large_image`

---

### Requirement: Locale-Aware Layout Metadata

The `[locale]` layout MUST set `<html lang>` and `alternates.canonical` to the active locale.

#### Scenario: Spanish locale canonical

- GIVEN active locale `es`
- WHEN Google reads `<head>`
- THEN `<html lang="es">` and `<link rel="canonical">` with `/es/` are present

---

## Capability: `seo-per-page-metadata`

### Requirement: Home Page Metadata

`src/app/[locale]/page.tsx` MUST export `generateMetadata` with localized `title`, `description`, and `openGraph` using the site-wide OG fallback.

#### Scenario: Home page share card

- GIVEN the home page
- WHEN a platform reads Open Graph tags
- THEN `og:title` and `og:description` are non-empty localized strings

---

### Requirement: Journey Page — No-Index

`src/app/[locale]/journey/page.tsx` MUST export `generateMetadata` with `robots: { index: false, follow: false }`.

#### Scenario: Journey excluded from crawl

- GIVEN the journey page
- WHEN a crawler reads `<meta name="robots">`
- THEN content includes `noindex`

---

### Requirement: Tripper Profile — Hero Image OG

`generateMetadata` MUST use `heroImage` (NOT `avatarUrl`) as `og:image`, falling back to `/images/opengraph.jpg` when `heroImage` is null.

#### Scenario: heroImage set

- GIVEN a tripper with non-null `heroImage`
- WHEN `generateMetadata` runs
- THEN `og:image` equals the tripper's `heroImage` URL

#### Scenario: heroImage null — fallback

- GIVEN a tripper with null `heroImage`
- WHEN `generateMetadata` runs
- THEN `og:image` is `<metadataBase>/images/opengraph.jpg`

---

### Requirement: Blog Post Metadata (RSC)

`src/app/[locale]/blog/[slug]/page.tsx` MUST export `generateMetadata` with post `title`, excerpt-based `description`, and cover image as `og:image`. The component MUST NOT carry `"use client"`.

#### Scenario: Blog post share card

- GIVEN a published post with cover image
- WHEN a crawler reads OG tags
- THEN `og:title` matches the post title and `og:image` is the cover image URL

---

## Capability: `seo-json-ld`

### Requirement: JsonLd Component

`src/lib/seo/JsonLd.tsx` MUST export a server component rendering `<script type="application/ld+json">`. MUST NOT use `"use client"`.

#### Scenario: Renders valid script tag

- GIVEN a schema object passed as `schema` prop
- WHEN the component renders
- THEN a `<script type="application/ld+json">` tag with valid JSON is in the DOM

---

### Requirement: Schema Builders

`src/lib/seo/schemas.ts` MUST export: `buildOrganizationSchema`, `buildWebSiteSchema`, `buildPersonSchema`, `buildBlogPostingSchema`, `buildFAQPageSchema`. Each MUST return a plain object conforming to its schema.org type.

#### Scenario: BlogPosting schema shape

- GIVEN `buildBlogPostingSchema({ title, url, datePublished, description, imageUrl })`
- THEN result contains `"@type": "BlogPosting"`, `headline`, `url`, `datePublished`, `image`

---

### Requirement: Site-Level Schemas on Root Layout

`layout.tsx` MUST inject `<JsonLd>` with `Organization` and `WebSite` schemas.

#### Scenario: Organization detected on any page

- GIVEN any page
- WHEN a structured-data tool inspects it
- THEN an `Organization` entity with `name` and `url` is found

---

### Requirement: Per-Page Schema Injection

| Page | Required Schema |
|------|----------------|
| `trippers/[tripper]` | `Person` / `ProfilePage` |
| `blog/[slug]` | `BlogPosting` |
| `about-us` | `FAQPage` |
| `xsed` | `FAQPage` |

#### Scenario: Tripper emits Person JSON-LD

- GIVEN a tripper profile page
- WHEN a structured-data tool inspects it
- THEN a `Person` entity with `name` matching the tripper's display name is found

#### Scenario: FAQ pages emit FAQPage JSON-LD

- GIVEN either the `about-us` or `xsed` page
- WHEN a structured-data tool inspects it
- THEN a `FAQPage` entity with at least one `Question` is found
