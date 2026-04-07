# CLAUDE.md — GetRandomTrip (frontend)

## Project Overview

**GetRandomTrip** is a mystery travel platform built with Next.js 14 (App Router). Clients configure a trip and receive a surprise destination. Trippers (travel experts) create and manage packages. Deployed on Netlify at https://getrandomtrip.netlify.app/.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (`src/store/`) |
| ORM | Prisma 7 (PostgreSQL) |
| Auth | NextAuth 4 (Prisma adapter + Google OAuth) |
| Payments | MercadoPago (primary), Stripe (secondary) |
| UI Primitives | Radix UI, shadcn/ui (`components.json`) |
| Forms | react-hook-form |
| Maps | React Leaflet, Google Maps/Places |
| Toasts | Sonner, react-toastify |
| Animation | Framer Motion |

---

## Commands

```bash
npm run dev           # Start dev server on port 3010
npm run build         # Production build
npm run build:clean   # Clean .next then build
npm run typecheck     # tsc --noEmit (run before committing)
npm run lint          # ESLint
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier write
npm run format:check  # Prettier check

# Database
npm run db:generate   # prisma generate
npm run db:push       # Push schema (no migration file)
npm run db:migrate    # prisma migrate dev
npm run db:studio     # Prisma Studio
npm run db:seed       # Seed database
```

---

## Architecture

### Routing

All user-facing routes live under `src/app/[locale]/` (i18n prefix: `es` or `en`). Key routes:

| Path | Description |
|---|---|
| `/` | Landing page |
| `/login` | Auth modal with role-aware redirect |
| `/dashboard` | Client dashboard |
| `/tripper` | Tripper OS (protected by `TripperGuard`) |
| `/profile` / `/profile/edit` | User profile view / edit |
| `/u/[handle]` | Public tripper profile |
| `/journey/*` | Trip booking flow |
| `/packages/*` | Package discovery |
| `/blog` | Blog listing / articles |

API routes live under `src/app/api/` and are not locale-prefixed.

### i18n

- Locales: `es` (default), `en`
- Dictionary files: `src/i18n/es.json`, `src/i18n/en.json`
- Middleware handles locale detection and injection: `src/middleware.ts`
- Config in `src/lib/i18n/`

### State Management (Zustand)

- Store: `src/store/store.ts`, slices in `src/store/slices/`
- Types: `src/store/types.ts`
- Key state: `isAuthed`, `user`, `updateAccount`, `upsertPrefs`

### Auth & Roles

- Roles: `CLIENT`, `TRIPPER`, `ADMIN` (enum in Prisma schema)
- Role routing util: `src/lib/roles.ts` → `dashboardPathFromRole(role)`
- Server-side auth guard: `src/lib/requireAuth.ts`
- Tripper features gated by `TripperGuard` component

### Database (Prisma)

Schema at `prisma/schema.prisma`. Core models:

- **User** — all roles; Trippers have `tripperSlug`, `commission`, `destinations`, etc.
- **TripRequest** — client trip with `status` flow: `DRAFT → SAVED → PENDING_PAYMENT → CONFIRMED → REVEALED → COMPLETED`
- **Package** — tripper-created content matched to TripRequests
- **Payment** — MercadoPago/Stripe payment records
- **BlogPost** — tripper-authored content
- **Review**, **PackageLike**, **WaitlistEntry**

### Components

`src/components/` is organized by feature area:

```
app/         auth/        common/      forms/
journey/     navigation/  profile/     tripper/
ui/          user/        ...
```

**Important conventions:**
- Use `<Img>` (`src/components/common/Img.tsx` or `SafeImage.tsx`) instead of raw `<img>` tags — ESLint enforces this
- Use `<Image>` from `next/image` via the wrapper only

### Env Variables

Copy `env.example` to `.env.local`. Required for local dev:

```
DATABASE_URL              # PostgreSQL connection string (default: localhost:5432/getrandomtrip)
NEXTAUTH_URL              # http://localhost:3010
NEXTAUTH_SECRET           # Any random secret
GOOGLE_CLIENT_ID/SECRET   # Google OAuth
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
MERCADOPAGO_TEST_ACCESS_TOKEN / TEST_PUBLIC_KEY
```

---

## Coding Conventions

- **No raw `<img>` tags** — always use the `<Img>` wrapper component
- **Theme is forced light** — `<body class="bg-neutral-50 text-neutral-900">`, no dark mode variants needed
- **Images**: all remote image hostnames must be added to `next.config.js` `remotePatterns`
- **TypeScript**: strict mode — run `npm run typecheck` before committing
- **Localization**: all user-visible strings should use i18n dictionary keys, not hardcoded text
- **API routes**: use `src/lib/db/` Prisma client (`src/lib/prisma.ts`) for DB access

---

## Quality Checklist (before merging)

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes (no raw `<img>` tags, no TS errors)
- [ ] Manual QA of affected flows
- [ ] Responsive at ≥360px (mobile) and ≥1280px (desktop)
- [ ] Accessibility: contrast AA compliant
- [ ] Empty/error states handled with microcopy
