# AGENTS.md — GetRandomTrip

> AI agent configuration for this repository. These instructions apply to all
> coding agents (Claude Code, Cursor, Codex, etc.).
> **User instructions always take precedence over this file.**

---

## Project Overview

**GetRandomTrip** is a mystery travel platform. Clients configure a trip budget
and preferences, then receive a surprise destination curated by a *Tripper*
(travel expert). Deployed on Netlify: <https://getrandomtrip.netlify.app/>.

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

## Design System (quick reference)

Full spec: `.claude/rules/design-system.md`

| Token | Tailwind | Use |
|-------|---------|-----|
| Ink | `gray-900` | Headings, primary text |
| Cyan | `text-light-blue` | Eyebrows, icons, links |
| Sun | `yellow-400` | KPI accent bar only |
| Surface | `white` | Card backgrounds |
| Ground | `gray-50` | Page background |
| Border | `gray-200` | Card borders, dividers |

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
