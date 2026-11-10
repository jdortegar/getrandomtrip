# Components gallery missing UI

Expand `/[locale]/design-system/components` with the shared UI the kit still omits. Branch `feature/brand-design-system`. Delivery: ask-on-risk. Runner: `npx vitest run src/components/app/design-system`.

## Specs

S1. Add to the components gallery "all missing ui elements like section titles, tabs, heroes, different cards, carousels, icons, journey elements, avatar, etc."
S2. Demos use the actual shared components, not separately styled copies.
S3. Gallery fixtures stay local; all new user-visible strings in `en.json` and `es.json`.
S4. Named elements are required sections: section titles, tabs, heroes, cards, carousels, icons, journey elements, avatar. "etc." means remaining shared primitives in `src/components/ui` and `src/components/layout` that are not already in buttons, controls, badges, layout, or tables.
S5. GlassCard stays labeled marketing-only. Journey demos use real `src/components/journey` pieces, not a restyled kit.

## Tasks

- [x] **T1** S1-S3 Headings (`PageHeading`, `SectionHeading`). Route: inline. Commit: uncommitted
- [x] **T2** S1-S3 Tabs (`TabSelector`). Route: inline. Commit: uncommitted
- [ ] **T3** S1-S3 Heroes (real `Hero` / `HeaderHero` / `TravelHero`). Route: inline. Commit:
- [x] **T4** S1-S3,S5 Cards (`Card`, `GlassCard`, `TravelCard`). Route: inline. Commit: uncommitted
- [ ] **T5** S1-S3 Carousels (`carousel`). Route: inline. Commit:
- [x] **T6** S1-S3 Icons (lucide sizes from the design system). Route: inline. Commit: uncommitted
- [x] **T7** S1-S3 Avatar (`AvatarWithFallback`). Route: inline. Commit: uncommitted
- [x] **T8** S1-S3,S5 Journey elements (`JourneyProgressSidebar`, `JourneyDropdown`, `RemovableTag`, `ExcuseCard`, `JourneySectionCard`). Route: inline. Commit: uncommitted
- [ ] **T9** S4 Remaining shared primitives (accordion, pagination, skeleton, modal). Route: inline. Commit:
- [x] **T10** S1-S3 Dashboard elements (traveler/tripper/admin nav, KPI grids, admin status strip). Route: inline. Commit: uncommitted

## Log

L1. i like to add to the components gallery all missing ui elements like section titles, tabs, heroes, different cards, carousels, icons, journey elements, avatar, etc.
L2. T1 GREEN: headings section uses PageHeading and SectionHeading. `npx vitest run src/components/app/design-system/__tests__/GalleryShell.test.tsx src/components/app/design-system/__tests__/DesignSystemPage.test.tsx` — 14 passed. Risk: none.
L3. T2, T6, T7 GREEN: tabs (`TabSelector` inline + marketing), icons (h-4 / KPI puck), avatar (`AvatarWithFallback`). Full `src/components/app/design-system` suite 36 passed. Risk: none.
L4. T4 GREEN: cards section demos Card, GlassCard (marketing note), TravelCard. Suite 37 passed. Risk: none.
L5. SectionHeading was ignoring brand type: `font-display` and `tracking-tightish` are not in the theme, so gallery titles rendered as body Barlow. Now Barlow Condensed 700, uppercase, ink, teal eyebrow. RED then GREEN `SectionHeading.test.tsx`. Suite 38 passed. Risk: none.
L6. Cards gallery now demos composed product cards: ExperienceCard, LevelCard, TravelCard (default+elevated), TripperCard, TravelerTypeCard, TripperCarouselCard, PackageCard, TripCard, BlogCard, DropCard. GalleryShell 10 passed. Risk: none.
L7. T8 GREEN: journey section demos JourneyProgressSidebar, JourneyDropdown, RemovableTag pills, ExcuseCard, JourneySectionCard. `npx vitest run src/components/app/design-system` — 38 passed. Risk: none.
L8. T10 GREEN: dashboard section demos traveler/tripper/admin DashboardNavTabs, DashboardStatsGrid, TripperStatsGrid, TripRequestsKPIStrip, CampaignKpiCard, SectionHead. Suite 39 passed. Risk: none.
L9. Dashboard gallery no longer repeats traveler/tripper/admin views. One shared nav, one KPI grid, plus TripperViewToggle. Suite 39 passed. Risk: none.
L10. Components gallery order is now headings → icons → avatar → buttons → controls → badges → tabs → cards → tables → layout → journey → dashboard. Specimens share GalleryPanel + 2-col grids; cards stay 300px. Risk: none.
L11. Blog specimen title was hidden beside the tall Experience card; Experience is now its own row. Dashboard tabs were all inactive on the gallery URL; gallery passes activeHref so Mi panel uses the teal selected state. Risk: none.
