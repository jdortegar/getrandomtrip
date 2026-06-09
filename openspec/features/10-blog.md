# Blog

**Status**: Partial
**Priority**: Medium

## Purpose

A content channel where trippers publish travel articles that are visible to the public. Articles support rich formatting, image galleries, FAQs, and related posts. The blog drives organic discovery and builds tripper authority. A filtering and infinite-scroll listing makes content browsable without authentication.

## What's Implemented

- Public listing with infinite scroll, filterable by tripper, travel type, and excuse key
- Article page: hero, body, image lightbox, FAQ section, testimonials, and related posts
- Tripper authoring: list, create, edit, and preview in Tripper OS
- `GET /api/blogs` with pagination and filters; `GET /api/tripper/blogs` for the authoring view

## Gaps

- [ ] No admin moderation — trippers can publish directly without an approval step
- [ ] No scheduled publishing — posts go live immediately or stay as drafts with no future publish date
- [ ] Hardcoded `isSofia` logic in the blog detail component — platform-specific hack that must be removed
- [ ] Blog article page is client-side rendered — no server-side SEO meta tags (Open Graph, title, description)
- [ ] No auto-save in `BlogComposer` — unsaved content is lost on navigation
- [ ] Tag filtering is not exposed as a UI option on the public listing even though the API supports it

## Out of Scope

- Comment system on blog posts
- Content syndication or RSS feed
- Rich-text collaborative editing
