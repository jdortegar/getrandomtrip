---
name: refactor-component
description: >-
  Refactors or restyles components—extract subcomponents, migrate copy to
  dictionaries, Hero to HeaderHero, GlassCard to white cards. Use when
  refactoring UI, dashboard pages, or tripper blog flows.
---

# Skill: Refactor an Existing Component

Follow this when refactoring or restyling any existing component.

## Before Touching Code

1. Read the component file fully
2. Read the page or parent that renders it to understand how it's used
3. Identify what's wrong: is it style, structure, types, copy, or all of the above?
4. If the component has inline copy (hardcoded strings), plan to move them to the main dictionaries
5. If the component is a monolith (large page file doing everything), plan to extract sections into focused component files

## Extraction Rules (monolith → components)

- Each extracted component gets its own file in `src/components/app/<feature>/`
- No `index.ts` barrel — caller imports directly by path
- The page file becomes a thin orchestrator: data fetching + layout only
- Types go to `src/types/`, not defined inline in the component

## Style Migration

When updating visual style to match the dashboard design system:
- Replace `GlassCard` with the white-card pattern (see `.claude/rules/design-system.md`)
- Replace `<Hero>` with `<HeaderHero>` for dashboard pages
- Replace `LoadingSpinner` with a proper skeleton component that matches the layout
- Replace raw styled `<Link>` blocks with `<Button asChild>`

## Copy Migration

When moving hardcoded strings to dictionaries:
1. Add the interface to `src/lib/types/dictionary.ts`
2. Add both ES and EN strings to `src/dictionaries/es.json` + `en.json`
3. Pass the dict slice as a `copy` prop — never the full dictionary

## Verification

After refactoring:
```bash
npm run typecheck   # must pass clean
npm run lint        # must pass clean
```

Also verify:
- The component still renders correctly with real data
- Empty/error states are handled
- The loading state matches the final layout
