# Experience Discovery (Public)

**Status**: Partial
**Priority**: Medium

## Purpose

Marketing and inspiration surface that shows clients the *types* of experiences available — by traveler profile and by tripper — without revealing specific destinations or packages. Experiences themselves are hidden by design: clients configure a trip via the journey wizard and receive a randomly assigned experience after purchase. There is no public catalog, no detail page, and no direct booking from this surface.

## What's Implemented

- `/experiences`: traveler-type carousel and TypePlanner component
- `/experiences/by-type/[type]`: hero, story, planner, blog posts, and testimonials (static-data driven)
- `/experiences/by-tripper/[tripper]`: fetches tripper and experiences from DB; renders mystery-overlay cards (destination intentionally hidden)

## Gaps

- [ ] Rating displayed on the by-tripper page is hardcoded to 4.9/5 — not sourced from real Review data
- [ ] by-type pages are fully static-data driven — no DB connection for real experience counts or availability

## Out of Scope

- Public experience detail pages — intentionally hidden (mystery product)
- Booking CTA from the catalog — clients book via the journey wizard, not the discovery pages
- Global browse/search endpoint — not needed given the mystery model
- Price or destination filtering — would break the surprise mechanic
