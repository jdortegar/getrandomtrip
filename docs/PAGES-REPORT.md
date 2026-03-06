# Pages Report — Randomtrip

Report of all app routes (pages) and API routes. Use this to see what exists and what may need work.

**Base path:** `/[locale]` (e.g. `/es`, `/en`)

---

## 1. Marketing & public

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|----------------|
| `/` | Home | Public | Full: Hero, How it works, Exploration, Testimonials, Blog, Waitlist. |
| `/blog` | Blog listing | Public | Listing page. |
| `/blog/[slug]` | Blog post | Public | Dynamic post; uses blog data. |
| `/nosotros` | About us | Public | Content page. |
| `/trippers` | Trippers listing | Public | Grid of trippers. |
| `/trippers/[tripper]` | Tripper profile (public) | Public | Redirects to `/trippers` if no slug; 404 if tripper not found. |
| `/packages` | Packages hub | Public | Redirects to `/packages/by-type/group`. |
| `/packages/by-type/[type]` | Packages by traveler type | Public | Dynamic type (solo, couple, family, etc.); 404 if invalid type. |
| `/packages/by-tripper/[tripper]` | Packages by tripper | Public | Redirect/404 if tripper missing. |
| `/packages/[tripper]/[packageId]/basic-config` | Package basic config start | Public | Entry to package flow. |

---

## 2. Journey (trip builder)

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|----------------|
| `/journey` | Journey start | Public | Entry. |
| `/journey/summary` | Summary | Public | Trip summary. |

---

## 3. Package detail & checkout (by tripper/package)

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|---------------|
| `/packages/[tripper]/[packageId]/addons` | Add-ons for package | Public | Add-ons selection. |
| `/packages/[tripper]/[packageId]/filters` | Filters for package | Public | Filters step. |
| `/packages/[tripper]/[packageId]/checkout` | Package checkout | Public | Checkout. |
| `/packages/[tripper]/[packageId]/reveal-destination` | Reveal for package | Public | Reveal. |
| `/packages/[tripper]/[packageId]/post-purchase` | Post-purchase | Public | Thank you / next steps. |

---

## 4. Auth & account

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|---------------|
| `/login` | Login | Public | Redirects if already authenticated. |
| `/unauthorized` | Unauthorized | Public | Shown when role check fails. |
| `/profile/edit` | Edit profile (legacy?) | Public | Profile edit form; consider aligning with (secure) profile. |
| `/(secure)/profile` | User profile (dashboard) | **Secure** | Uses `SecureRoute`; personal, preferences, security tabs. |
| `/(secure)/dashboard` | User dashboard | **Secure** | Uses `SecureRoute`; redirects trippers to tripper dashboard. |
| `/(secure)/tripper` | Tripper dashboard entry | **Secure** | Tripper role; uses `SecureRoute`. |

---

## 5. Tripper (creator) — public-facing

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|---------------|
| `/tripper` | Tripper area entry | Public | Landing for tripper flows. |
| `/tripper/profile` | Tripper public profile | Public | Profile page. |
| `/tripper/blogs` | Tripper blogs list | Public | List of blogs. |
| `/tripper/blogs/new` | New blog | Public | Uses BlogComposer (create). |
| `/tripper/blogs/[id]/edit` | Edit blog | Public | Uses BlogComposer (edit). |
| `/tripper/blogs/[id]/preview` | Preview blog | Public | 404 if post not found. |
| `/tripper/routes` | Routes list | Public | Tripper routes. |
| `/tripper/routes/[id]` | Route detail | Public | Single route. |
| `/tripper/media` | Media | Public | Media management. |
| `/tripper/settings` | Tripper settings | Public | Settings. |
| `/tripper/earnings` | Earnings | Public | Earnings view. |
| `/tripper/reviews` | Reviews | Public | Reviews. |

---

## 6. Dashboard — tripper (authenticated)

All under `/(secure)` or use `SecureRoute`; tripper role.

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|---------------|
| `/dashboard/tripper` | Tripper OS dashboard | **Secure (tripper)** | Main tripper dashboard. |
| `/dashboard/tripper/packages` | Packages list | **Secure (tripper)** | CRUD packages. |
| `/dashboard/tripper/packages/new` | New package | **Secure (tripper)** | Create package. |
| `/dashboard/tripper/packages/[id]` | Edit package | **Secure (tripper)** | Edit package. |
| `/dashboard/tripper/blogs` | Blogs list | **Secure (tripper)** | List blogs. |
| `/dashboard/tripper/blogs/new` | New blog | **Secure (tripper)** | BlogComposer create. |
| `/dashboard/tripper/blogs/[id]` | Edit blog | **Secure (tripper)** | BlogComposer edit. |
| `/dashboard/tripper/reviews` | Reviews | **Secure (tripper)** | Reviews. |
| `/dashboard/tripper/earnings` | Earnings | **Secure (tripper)** | Earnings. |

---

## 7. Other / utility

| Route | Purpose | Auth | Notes / Needs |
|-------|---------|------|---------------|
| `/experience` | Experience level (standalone) | Public | Reuses experience step UI; back button is placeholder. |
| `/experiencias` | Experiencias | Public | Content. |
| `/add-ons` | Add-ons (standalone?) | Public | May overlap with journey add-ons. |
| `/checkout` | Checkout (standalone?) | Public | May overlap with journey/package checkout. |
| `/reveal-destination` | Reveal (standalone) | Public | Client component for reveal. |
| `/post-purchase` | Post-purchase (standalone) | Public | Thank you. |
| `/filters-premium` | Premium filters (standalone?) | Public | May overlap with journey premium filters. |
| `/configuration/basic` | Basic configuration | Public | Config step. |

---

## 8. API routes

| Method + path | Purpose |
|---------------|---------|
| `POST /api/auth/[...nextauth]` | NextAuth handler |
| `POST /api/auth/register` | Register |
| `POST /api/auth/signup` | Signup |
| `GET/POST /api/experience` | *(Removed — was AI experience stub)* |
| `GET/POST /api/gemini` | *(Removed — was Gemini chat)* |
| `GET /api/blogs` | List blogs |
| `GET/PUT/DELETE /api/blogs/[id]` | Blog CRUD |
| `GET /api/packages` | List packages |
| `GET/POST /api/tripper/packages` | Tripper packages |
| `GET/PUT/DELETE /api/tripper/packages/[id]` | Tripper package by id |
| `GET/POST /api/tripper/blogs` | Tripper blogs |
| `GET/PUT/DELETE /api/tripper/blogs/[id]` | Tripper blog by id |
| `GET /api/tripper/dashboard` | Tripper dashboard data |
| `GET /api/tripper/earnings` | Tripper earnings |
| `GET /api/tripper/reviews` | Tripper reviews |
| `GET /api/trippers` | List trippers |
| `GET/POST /api/user/tripper` | User tripper profile |
| `GET/POST /api/user/update` | User update |
| `GET/POST /api/user/preferences` | User preferences |
| `POST /api/user/password` | Password change |
| `GET /api/trips` | List trips |
| `GET/POST/PUT/DELETE /api/trips/[id]` | Trip by id |
| `POST /api/trip-requests` | Trip request |
| `GET/POST /api/bookings` | Bookings |
| `GET/POST /api/payments` | Payments |
| `POST /api/payments/confirm` | Payment confirmation |
| `POST /api/mercadopago/preference` | MercadoPago preference |
| `POST /api/mercadopago/webhook` | MercadoPago webhook |
| `POST /api/upload` | File upload (mock URL) |
| `POST /api/newsletter` | Newsletter |
| `POST /api/waitlist` | Waitlist |

---

## 9. Layouts

| Path | Role |
|------|------|
| `app/layout.tsx` | Root layout, metadata |
| `app/[locale]/layout.tsx` | Locale: SessionProvider, GateAwareChrome, i18n |
| `app/[locale]/(secure)/layout.tsx` | Secure: title/description only |
| `app/[locale]/(secure)/tripper/layout.tsx` | Secure tripper section |
| `app/[locale]/blog/layout.tsx` | Blog section |
| `app/[locale]/tripper/layout.tsx` | Tripper section |
| `app/[locale]/dashboard/tripper/layout.tsx` | Dashboard tripper section |

---

## 10. What is needed (summary)

- **Experience page (`/experience`):** Back button is a placeholder; consider linking to journey or a clear entry.
- **Redirects:** `/packages` → `/packages/by-type/group`. Confirm if desired.
- **MercadoPago back_urls:** Success → `/post-purchase`, failure/pending → `/checkout` (top-level routes).
- **Duplicate/overlap:** Standalone `/checkout`, `/add-ons`, `/reveal-destination`, `/post-purchase`, `/filters-premium`, `/configuration/basic` vs. journey or package flows — decide single source of truth and redirect or remove duplicates.
- **Profile:** `/profile/edit` vs. `/(secure)/profile` — unify or document when to use each.
- **Tripper public vs dashboard:** Public tripper routes (`/tripper/*`) vs dashboard tripper (`/dashboard/tripper/*`) — ensure consistent auth (e.g. edit only when authenticated).
- **API:** `/api/upload` returns a mock URL; replace with real storage (e.g. S3/Cloudinary) when needed.
- **Metadata/SEO:** Many pages could use `generateMetadata` for title/description; add where missing.
- **Error handling:** `app/error.tsx` exists; add `not-found.tsx` under `[locale]` if you want a custom 404.

---

*Generated from the codebase. Update this report when adding or removing routes.*
