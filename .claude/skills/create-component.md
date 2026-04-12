---
name: create-component
description: >-
  Creates new React components following GetRandomTrip conventions—dictionary
  copy, Img, server/client page split. Use when scaffolding components, new
  pages, or UI under src/components.
---

# Skill: Create a New Component

Follow this when creating any new component in this codebase.

## Before Writing Code

1. Read similar existing components to understand the established pattern for that area
2. Identify where the component lives (`src/components/app/`, `src/components/ui/`, etc.)
3. Check `src/types/` — does a type already exist for the data this component needs?
4. Check the main dictionaries — is there already a copy section, or does one need to be added?

## Structure Rules

- One component per file
- Named export (not default export) for feature components
- No `index.ts` barrel file — caller imports by direct path
- Props interface defined at the top of the file
- Data types from `src/types/`, copy types from `src/lib/types/dictionary.ts`

## Copy / Strings

- All user-visible strings come from the dictionary (`copy` prop)
- Never hardcode Spanish or English strings inside components
- If a new dictionary section is needed: add to `src/dictionaries/es.json` + `en.json`, add the interface to `src/lib/types/dictionary.ts`, run typecheck to verify

## Styling

- Follow `.claude/rules/design-system.md` for card styles, typography, colors, and layout
- No raw `<img>` tags — use `<Img>` from `@/components/common/Img`
- No dark mode variants
- Buttons that navigate: `<Button asChild><Link href="...">` — not raw styled links

## Page Architecture

When creating a new page (`page.tsx`) that needs data:

**Server component by default.** Pages fetch data server-side, not in `useEffect`.

```
page.tsx (server)              # getServerSession + Prisma, no "use client"
  └─ XxxPageClient.tsx         # "use client" — useParams for locale, renders UI
       └─ XxxComponent.tsx     # presentational components
```

- `page.tsx` uses `getServerSession(authOptions)` for auth — redirect to `/login` if no session, return 403/redirect if wrong role
- `page.tsx` queries Prisma directly and passes data as props to the client shell
- `XxxPageClient.tsx` receives typed data props + handles locale via `useParams()`
- `SecureRoute` is NOT used on server pages — auth is handled server-side
- No `useEffect` data fetching, no loading skeleton needed — data arrives with the page

Only use a client component page when the page itself has no data requirements and is entirely interactive (e.g. a form-only page that POSTs on submit).

## Verification

After creating:
```bash
npm run typecheck   # must pass clean
npm run lint        # must pass clean
```
