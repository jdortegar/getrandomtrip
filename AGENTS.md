# AGENTS.md — GetRandomtrip

> AI agent configuration for this repository. These instructions apply to all
> coding agents (Claude Code, Cursor, Codex, etc.).
> **User instructions always take precedence over this file.**

---

## Project Overview

**GetRandomtrip** is a mystery travel platform. Clients configure a trip budget
and preferences, then receive a surprise destination curated by a *Tripper*
(travel expert). Deployed on Netlify: <https://getrandomtrip.com>.

Existing docs to read before making significant changes — do **not** duplicate
their content here:

| Doc | What it covers |
|-----|----------------|
| `SPEC.md` | Product spec, feature definitions, role model |
| `docs/Guidelines.md` | Team engineering guidelines |
| `docs/TeamWorkflow.md` | PR/review workflow, branch strategy |
| `.claude/CLAUDE.md` | Claude-specific agent rules (behaviour + conciseness) |
| `.claude/rules/design-system.md` | Color tokens, typography, card/table patterns |
| `.claude/rules/component-patterns.md` | Component isolation, dashboard layout, props pattern |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), TypeScript strict |
| Database | PostgreSQL via Prisma 7 |
| Auth | NextAuth 4 — `getServerSession(authOptions)` |
| Payments | Stripe + MercadoPago |
| State | Zustand 5 (slice pattern) |
| UI | Shadcn UI + Radix UI + Tailwind CSS |
| Email | React Email + Resend |
| Testing | Vitest + happy-dom |
| Deployment | Netlify |
| i18n | `[locale]` dynamic segment (`es` default, `en`) |

---

## Repository Layout

```
src/
├── app/
│   ├── [locale]/           # All user-facing routes (locale-prefixed)
│   │   ├── (secure)/       # Auth-gated routes (dashboard, checkout, trips)
│   │   ├── (textpages)/    # Legal / static text pages (cookies, terms, faq…)
│   │   └── (marketing)/    # Public routes (landing, blog, experiences, trippers)
│   └── api/                # API routes — NOT locale-prefixed
├── components/
│   ├── app/                # Feature components grouped by domain
│   ├── ui/                 # Generic primitives (Shadcn + custom)
│   ├── common/             # Shared non-primitive components
│   ├── layout/             # Layout shells (Section, Container, etc.)
│   ├── navigation/         # Nav bars, breadcrumbs
│   └── providers/          # Context / provider wrappers
├── lib/
│   ├── constants/          # SNAKE_CASE.ts constant files
│   ├── helpers/            # camelCase.ts utility functions
│   ├── hooks/              # useCamelCase.ts React hooks
│   ├── types/              # PascalCase.ts manual type definitions
│   ├── validation/         # Zod schemas
│   ├── i18n/               # i18n config and dictionary loader
│   └── db/                 # Prisma query helpers (server-only)
├── store/
│   ├── slices/             # One file per Zustand feature slice
│   └── store.ts            # Composed store with devtools + persist
├── dictionaries/           # en.json / es.json translation files
├── emails/                 # React Email templates
├── prisma/                 # schema.prisma + migrations
└── middleware.ts           # Locale detection + auth middleware
```

---

## Naming Conventions

| File type | Convention | Example |
|-----------|-----------|---------|
| Component | `PascalCase.tsx` | `TripCard.tsx` |
| Helper / util | `camelCase.ts` | `formatCurrency.ts` |
| Hook | `useCamelCase.ts` | `useTripStatus.ts` |
| Constant | `SNAKE_CASE.ts` | `API_ENDPOINTS.ts` |
| Type definition | `PascalCase.ts` | `TripRequest.ts` |
| All folders | `kebab-case` | `trip-request/` |

---

## Code Conventions

### React / Next.js

Before changing Next.js code, read the relevant installed-version documentation in
`node_modules/next/dist/docs/`. Follow its API guidance and deprecation notices.

- **Server Components by default.** Add `"use client"` only for:
  - Interactive UI (buttons, modals, toggles, forms)
  - Web API access (`window`, `navigator`, `localStorage`)
  - Zustand reads or local `useState` / `useEffect`
  - Never for data fetching or static display components.
- **Page files are thin orchestrators** — data fetching + layout only, no inline UI logic.
- **No barrel `index.ts` files** — import components directly by path.
- **One component per file**, ≤ 300 lines per file.
- **No raw `<img>` tags** — always use `<Img>` from `@/components/common/Img`.
- **No dark mode** — theme is forced light; never add `dark:` Tailwind variants.
- All user-visible strings must use **i18n dictionary keys** — no hardcoded copy.
- **Async action buttons must visibly show loading** — disabling alone is not enough.
  Show a spinner and localized progress label, set `aria-busy`, prevent duplicate
  submissions, and reset pending state in `finally` so failures allow retry.
  See `.claude/rules/design-system.md` → Buttons / Links.

### Component File Order

```ts
// 'use client'  ← only if needed
// 1.  Imports
// 2.  Types / Interfaces
// 3.  Routing variables    (useParams, useSearchParams, useRouter)
// 4.  App state            (Zustand)
// 5.  Local state          (useState)
// 6.  Derived variables
// 7.  Memoized values      (useMemo, useCallback)
// 8.  Hook variables       (useX)
// 9.  Effects              (useEffect)
// 10. Action handlers      (handleX)
// 11. Refs / DOM / class logic
// 12. JSX return
```

### TypeScript

- Strict mode — run `npm run typecheck` before committing.
- Manual types live in `src/lib/types/` — **never** import from `@prisma/client` in UI code.
- Use Prisma types only in server/DB logic (`src/lib/db/`, `src/app/api/`).
- Prefer `interface` over `type` aliases. Avoid enums — use const maps instead.

### JSX Props — alphabetical order (always)

```tsx
// ✅
<Button aria-label="Submit" disabled={isLoading} onClick={handleSubmit} size="lg" />

// ✗
<Button size="lg" disabled={isLoading} onClick={handleSubmit} aria-label="Submit" />
```

### Tailwind CSS

- Classes within a group are **alphabetical**.
- Responsive (`sm:`, `md:`, `lg:`) and state (`hover:`, `focus:`) prefixes go in
  **separate `cn()` strings**.

```tsx
// ✅
className={cn(
  'absolute flex gap-4 items-center rounded-xl',
  'sm:flex-col md:flex-row',
  'hover:bg-gray-50 focus:ring-2'
)}
```

### Zustand State

- One file per slice in `src/store/slices/`
- Each slice has its own typed `interface`
- Composed in `src/store/store.ts` with `devtools` + `persist`
- Action naming: `setX` / `clearX` / `updateX`

### Auth Pattern (server-side)

```ts
const session = await getServerSession(authOptions);
if (!session) redirect('/login');
if (!hasRoleAccess(session.user.role, ['ADMIN'])) return forbidden();
```

### API Routes

- Use `NextRequest` / `NextResponse`
- Add `export const dynamic = 'force-dynamic'` for personalized or auth-gated routes
- DB access only through `src/lib/prisma.ts`

---

## Design System

Brand values and component treatments: `.claude/rules/design-system.md`.
Keep Randomtrip's branding, dictionary-based copy, and light-only appearance.

### Layers

- **Foundations:** `src/app/globals.css` owns shared semantic tokens for color,
  typography, spacing, and responsive values. Extend the shared foundation when a
  new treatment is needed; do not scatter one-off design values or breakpoint
  overrides across components.
- **UI primitives:** `src/components/ui` contains reusable low-level controls.
- **Composed components:** `src/components/composed` combines primitives into
  reusable UI without coupling it to a route or content source.
- **Content blocks:** `src/components/content-blocks` contains editor-configurable
  page sections assembled from shared components.
- **Pages and feature containers:** `src/app` and existing feature containers
  handle routing, data loading, localization, and composition.
- **Gallery:** `src/components/app/design-system` demonstrates the actual shared
  components, not separately styled copies.

These are the boundaries for new design-system work. Create new layer directories
only when needed. Leave existing components in their current locations until a
scoped migration is approved; reuse them instead of creating parallel versions.

### Composition and verification

- Keep reusable components independent of routes, databases, CMS integrations,
  and other content sources. Pass localized content, state, and callbacks through
  props; load data in pages or feature containers. Keep gallery fixtures local
  and separate from production data sources.
- Reuse existing components, typography, brand assets, and semantic tokens. Treat
  `src/app/globals.css` and the full design-system spec as the sources of truth for
  current values and usage; do not duplicate palette values in agent guidance.
- Keep `/design-system` (Spanish) and `/en/design-system` (English) useful as
  interactive component galleries. Update their demos when shared components or
  behavior change.
- Preserve native semantics, keyboard interaction, visible focus, readable
  contrast, usable touch targets, and reduced-motion support.
- Verify visual changes at mobile and desktop sizes. Encode important layout and
  interaction requirements in implementation and focused checks, not only agent
  guidance.

- `GlassCard` is marketing-only — never use in dashboard pages.
- Status badges always render through `<StatusIndicatorBadge>`.
- Icons from `lucide-react`, size `h-4 w-4` inline / `h-9 w-9` for KPI pucks.

---

## Development Scripts

```bash
npm run dev             # Start local dev server (port 3010)
npm run build           # Production build
npm run typecheck       # TypeScript type check — run before committing
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix
npm run test            # Run Vitest test suite
npm run format          # Prettier format
npm run format:check    # Check formatting without writing

npm run db:generate     # Regenerate Prisma client
npm run db:push         # Push schema to DB (dev)
npm run db:migrate      # Run migrations (production)
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database
```

---

## Testing

- **Framework:** Vitest + happy-dom
- Test files live in `__tests__/` subdirectories next to the source they test
- File naming: `ComponentName.test.tsx` / `helperName.test.ts`
- Run: `npm run test`
- Do not commit code that breaks existing tests

---

## Git Conventions

- **Conventional commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- No AI tool attribution in commit messages or PR descriptions
- Branch names: `feat/short-description`, `fix/short-description`
- PRs must pass `typecheck` + `lint` + `test` before merge

---

## Quality Gate (before every PR)

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors / warnings
- [ ] `npm run test` — all tests pass
- [ ] Responsive at ≥ 360 px (mobile) and ≥ 1280 px (desktop)
- [ ] All new user-visible strings added to both `en.json` and `es.json`
- [ ] Accessibility: contrast AA compliant
- [ ] Empty and error states handled with microcopy

---

## Project Skills

- **PR:** For PR creation, updates, or prompt history, read
  [`.agents/skills/pr/SKILL.md`](.agents/skills/pr/SKILL.md). Use its description
  format and respect the explicitly requested head/base branches.

- **Merge:** For an explicit `$merge` workflow or an ordinary merge request, read
  [`.agents/skills/merge/SKILL.md`](.agents/skills/merge/SKILL.md). Respect its
  authorization boundaries for verified linked-issue cleanup and Randomtrip Slack
  announcements; authoring or reviewing the skill never executes it.
