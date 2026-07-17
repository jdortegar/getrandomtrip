---
description: >-
  Component structure—one per file, no barrels, dashboard folder layout, copy
  props from dictionary slices.
alwaysApply: true
---

# Component Patterns

## Isolation

- One component per file, one clear responsibility per file
- No barrel `index.ts` files — import components directly by path
- Feature components live in `src/components/app/<feature>/`
- Sub-feature components get their own subfolder: `src/components/app/dashboard/tripper/`

## Dashboard Components

The client and tripper dashboards share the same structure pattern:

```
src/components/app/dashboard/<role>/
  <Role>StatsGrid.tsx        # Stat cards row
  <Role>Skeleton.tsx         # Loading skeleton
  RecentXxxList.tsx          # Main panel (col-span-2)
  <Role>QuickActions.tsx     # Sidebar panel
  <Role>KeyMetrics.tsx       # Sidebar panel
  <Role>XxxSummary.tsx       # Full-width bottom panel
```

Page files (`page.tsx`) are thin orchestrators: data fetching + layout only. No inline UI logic.

## Props Pattern

Each component receives:

- Typed data props (from `src/types/`)
- A `copy` prop sliced from the dictionary (`dict.sectionName` or an intersection `dict.a & dict.b`)

Never pass the full dictionary — slice it at the call site.

## Imports

Always use path aliases:

- `@/types/` for domain types
- `@/lib/types/dictionary` for `TripperDashboardDict` etc.
- `@/components/ui/Button` for the Button primitive
- `@/components/common/Img` instead of raw `<img>`

## Reuse Existing Primitives — Mandatory

Before writing any new form field, input, or interactive element, check for an existing match in this order:

1. `src/components/ui/` — generic primitives (`FormField`, `FormSelectField`, `MultiSelectInput`, `TextAreaInput`, `DaysInput`, `DurationInput`, `RichTextInput`, `Select`, `Button`, etc.)
2. Sibling step/section files in the same feature folder — copy the established local pattern (e.g. every field in `src/components/app/dashboard/tripper/experiences/steps/*.tsx` uses `FormField`/`FormSelectField`'s `bg-gray-100 rounded-xl` look, not the dashboard-table `Select` from `design-system.md`)
3. Only write new inline markup/styling if no primitive or local convention covers the case — and if so, consider promoting it to `src/components/ui/` instead of leaving it one-off

Never hand-roll a `<select>`, `<input>`, or labeled wrapper when a labeled primitive already exists — check `src/components/ui/FormField.tsx` for `FormSelectField` before reaching for the raw `Select` component. A form field that doesn't visually match its siblings in the same step/page is a sign the wrong primitive was used, not that a new one is needed.
