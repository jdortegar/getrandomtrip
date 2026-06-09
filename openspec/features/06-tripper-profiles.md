# Tripper Public Profiles

**Status**: Partial
**Priority**: Medium

## Purpose

Public-facing pages where prospective clients discover and evaluate individual trippers. Includes a tripper directory listing and a full profile page per tripper. Trippers can also edit their own profile. These pages are key trust-building surfaces before a client commits to a booking.

## What's Implemented

- `/trippers`: server-rendered directory listing of all trippers
- `/trippers/[tripper]`: full public profile with hero, planner by travel type, trips gallery, blog posts, and testimonials
- `/trippers/profile`: profile editing page for the logged-in tripper

## Gaps

- [ ] Testimonials on the public profile are static hardcoded data — not sourced from the Review model
- [ ] Blog posts fall back to `MOCK_BLOG_POSTS` when a tripper has no published posts — real empty state should be shown instead
- [ ] No real review listing on the public profile — reviews from the DB are not rendered
- [ ] Profile edit completeness is unclear — bio, location, slug, and commission editability have not been verified in the current implementation

## Out of Scope

- Tripper verification badge system
- Tripper availability calendar
- Direct contact form from profile page
