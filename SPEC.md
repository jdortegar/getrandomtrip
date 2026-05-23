# GetRandomTrip — Product Specification

**Last updated:** 2026-05-22  
**Stack:** Next.js 14 (App Router) · TypeScript 5 · Prisma 7 · PostgreSQL · Stripe · NextAuth 4  
**Deployed:** https://getrandomtrip.netlify.app/

---

## 1. Overview

GetRandomTrip is a mystery travel platform. Clients configure a trip budget, dates, and preferences but never choose the destination — trippers (travel experts) match and fulfill requests with curated experience packages. The destination is revealed 48 hours before departure.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| `CLIENT` | Books trips, manages bookings, receives destination reveal |
| `TRIPPER` | Creates and manages experience packages, earns commissions |
| `ADMIN` | Full system access — manages users, content, payments, and platform |

All roles are stored as an array on the `User` model, allowing multi-role assignments.

---

## 3. Core Features

### 3.1 Journey Builder

The primary booking flow. Clients build a trip request across four steps:

**Step 1 — Budget (required)**
- Select traveler type: `couple`, `solo`, `family`, `group`, `honeymoon`, `paws`
- Select experience level: `essenza`, `modo-explora`, `explora-plus`, `bivouac`, `atelier-getaway`
- Real-time base price calculated and displayed

**Step 2 — Excuse (optional, type-dependent)**
- Lifestyle/motivation refinement via carousel
- Narrows matching preferences without restricting destination pool
- Skipped for types that don't support it

**Step 3 — Details (required)**
- Origin country and city (Google Places autocomplete)
- Trip start date and number of nights (calendar picker)
- Traveler count (pax)
- Transport preference (plane, bus, train, ship)

**Step 4 — Preferences (optional, paid)**
- Accommodation type
- Climate preference
- Max travel time
- Departure and arrival time preferences
- Avoid destinations (up to N entries)
- Add-ons: cancellation insurance, travel insurance, seat selection, extra luggage, others

All changes update a live pricing summary in the sidebar.

---

### 3.2 Pricing Model

#### Base Price (USD per person)

| Level | Standard | Solo (+30%) | Paws (+40%) | Honeymoon |
|-------|----------|-------------|-------------|-----------|
| Essenza | $350 | $450 | $490 | — |
| Modo Explora | $550 | $650 | $700 | — |
| Explora+ | $850 | $1,100 | $1,190 | — |
| Bivouac | $1,200 | $1,550 | $1,680 | — |
| Atelier | $1,200 | $1,550 | $1,680 | $1,800 |
| XSED | $250 (flat) | — | — | — |

#### Filters
- $25 USD per filter selected
- Power Pack: 3 filters for $60 (vs $75 à la carte)
- Free inclusions by level:
  - First avoid-destination: always free
  - Transport selection: free at Modo Explora and above
  - Max travel time: free at Bivouac and above
  - Depart/arrive prefs: free at Explora+ and above

#### Add-ons
- Cancellation Insurance: 15% of subtotal (per trip)
- Travel Insurance: $35 per person
- Seat Selection: $18 per person
- Extra Luggage: variable pricing

#### Currency
- Checkout is in USD
- Payments stored in ARS with exchange rate at time of booking

---

### 3.3 Checkout & Payments

- Powered by **Stripe**
- PaymentIntent created server-side on checkout load (idempotent — reuses existing intent for same trip)
- Client confirms payment via Stripe Elements (card number, expiry, CVC)
- Promo code support (apply / remove)
- Traveler party names captured for family and group bookings
- Contact info captured: phone, address (street, city, state, zip, country)
- Payment status tracked via Stripe webhooks

**Post-checkout states:**
- `/checkout/success` — booking confirmed
- `/checkout/pending` — payment processing
- `/checkout/failure` — payment failed

---

### 3.4 Trip Lifecycle

```
DRAFT → SAVED → PENDING_PAYMENT → CONFIRMED → REVEALED → COMPLETED
                                                        ↘ CANCELLED
```

| Status | Description |
|--------|-------------|
| `DRAFT` | Journey builder in progress, not yet submitted |
| `SAVED` | Submitted, awaiting payment |
| `PENDING_PAYMENT` | Payment initiated but not confirmed |
| `CONFIRMED` | Payment successful, trip booked |
| `REVEALED` | Destination revealed (48h before departure) |
| `COMPLETED` | Trip completed; customer rating/feedback collected |
| `CANCELLED` | Booking cancelled |

---

### 3.5 Destination Reveal

- Reveal is unlocked 48 hours before trip `startDate`
- Reveal page shows countdown timer until unlock
- Post-unlock content: destination, full itinerary, packing hints, weather, accessibility notes, safety notes
- Pre-reveal and post-reveal copy are customizable per experience
- WhatsApp message template available for tripper communication

---

### 3.6 XSED (Sunday Drops)

Weekly surprise trips at a flat rate of $250 per person.

- New drops published each Sunday
- Drop cards show a countdown to reveal date
- Each drop has: hero image, teaser, accessibility notes, packing hints, itinerary
- Booking is simplified (no filter step)
- Users can sign up for email notifications of new drops
- Admin manages drop notification subscriber list
- Drops use the `XSED` experience type and have a `slug`, `tripDate`, `revealAt`, `maxSpots`, `minSpots`

---

### 3.7 Experience Marketplace

Tripper-created packages discoverable before booking:

- Browse all experiences (`/experiences`)
- Filter by traveler type (`/experiences/by-type/[type]`)
- Filter by tripper (`/experiences/by-tripper/[tripper]`)
- Like/bookmark experiences (stored in `ExperienceLike`)
- Experience cards show: title, destination, level, price, hero image

**Experience statuses:** `DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`

---

### 3.8 Tripper OS (Creator Platform)

Full management suite for tripper users:

**Dashboard**
- KPI overview: total earnings, bookings, reviews, likes
- Revenue chart (earnings over time)
- Recent activity feed

**Experience Management**
- Create/edit experience packages with:
  - Title, teaser, description, hero image
  - Destination (country, city)
  - Pricing (base price, currency)
  - Experience level and traveler type(s)
  - Capacity (min/max pax, min/max nights)
  - Transport, accommodation, climate, time preferences
  - Hotels (JSON), activities (JSON), itinerary (JSON)
  - Inclusions and exclusions
  - Tags and highlights
  - Cancellation policy, weather policy
  - Accessibility and safety notes
  - Reveal/pre-reveal copy, packing hints
  - Admin and supplier notes (internal only)
- Set status (draft / active / inactive)

**Blog / Content Publishing**
- Rich HTML editor (TinyMCE)
- Support for formats: `ARTICLE`, `PHOTO`, `VIDEO`, `MIXED`
- Tags, travel type, excuse key
- SEO metadata (title, description, keywords)
- FAQ section
- Preview mode before publishing

**Earnings**
- Revenue breakdown and history
- Commission rate set by admin

**Reviews**
- View customer reviews and ratings for their experiences

**Profile**
- Bio, hero image, motto, location
- Specialization, tier level
- Visited destinations (shown on map)
- Available traveler types
- Slug (used in public URL `/trippers/[slug]`)

---

### 3.9 Tripper Public Profile

Public-facing page at `/trippers/[slug]`:

- Hero banner with name, bio, specialization
- Visited destinations map
- Experience portfolio gallery
- Specialization tags
- Blog posts
- Customer testimonials/reviews
- Tier level badge

---

### 3.10 Client Dashboard

Authenticated clients at `/dashboard` or `/(secure)/account`:

| Tab | Content |
|-----|---------|
| Summary | Recent bookings, high-level stats |
| Personal | Name, email, phone, address |
| Preferences | Traveler type, interests, dislikes |
| Payments | Payment history and card details |
| Documents | Billing records |
| Security | Change password |

---

### 3.11 Admin Dashboard

Full platform management at `/(secure)/dashboard/admin/`:

**Trip Requests**
- List all bookings with search/filter
- Detailed modal: trip details, payment status, customer feedback, status timeline
- Update trip status, assign experiences, manage reveals

**Payments**
- Full payment history across all users
- Payment details: provider, amount, method, card, status, refunds, chargebacks

**Users**
- User directory with role indicators
- Role assignment modal (CLIENT → TRIPPER or ADMIN)
- View user profile details

**Experiences**
- Manage all tripper experiences
- Feature, activate, archive experiences

**Reviews**
- Approve and publish customer reviews
- Moderate review content

**Blogs**
- Manage all blog posts across trippers

**XSED Notifications**
- Manage drop notification subscriber list
- Send/manage email notifications

**Waitlist**
- Early access signup management

---

## 4. Content & Blog System

- Blog posts authored by trippers
- Accessible at `/blog` and `/blog/[slug]`
- Rich HTML content with support for images, videos, galleries
- Tags and travel type categorization
- SEO metadata per post
- FAQ capability per post
- Publish/draft status

---

## 5. Authentication & Authorization

- **Google OAuth** — one-click sign-in via Google accounts
- **Credentials** — email and bcrypt-hashed password
- **NextAuth v4** — session management with JWT strategy
- Role-based access:
  - `CLIENT` routes guarded by session check
  - `TRIPPER` routes additionally guarded by `TripperGuard` component
  - `ADMIN` routes guarded by admin role check
- `dashboardPathFromRole(role)` routes users to correct dashboard after login

---

## 6. Internationalization (i18n)

- **Locales:** `es` (default), `en`
- **Routing:** `src/app/[locale]/` — all user-facing routes are locale-prefixed
- **Middleware:** `src/middleware.ts` handles locale detection and injection
- **Dictionaries:** `src/dictionaries/es.json` and `src/dictionaries/en.json`
- **Types:** `src/lib/types/dictionary.ts` — typed interfaces per section

All user-visible strings must use dictionary keys. No hardcoded copy in components.

---

## 7. Third-Party Integrations

| Integration | Purpose |
|------------|---------|
| **Stripe** | Payment processing, webhooks, promo codes |
| **NextAuth** | Authentication sessions |
| **Google OAuth** | Social sign-in |
| **Google Places API** | Address and city autocomplete |
| **Google Maps** | Destination map display |
| **Leaflet** | Interactive map with clustering |
| **Resend** | Transactional email (contact form, confirmations) |
| **Netlify Blobs** | File/image upload and storage |
| **TinyMCE** | Rich HTML editor for blogs and experience descriptions |
| **Discord.js** | Internal notifications (admin scripts) |
| **Prisma** | ORM for PostgreSQL |
| **Framer Motion** | Page and component animations |

---

## 8. Key Pages Reference

| Route | Auth | Role | Description |
|-------|------|------|-------------|
| `/` | No | Any | Landing page |
| `/about-us` | No | Any | About page |
| `/blog` | No | Any | Blog listing |
| `/blog/[slug]` | No | Any | Blog post |
| `/contact` | No | Any | Contact form |
| `/trippers` | No | Any | Tripper directory |
| `/trippers/[slug]` | No | Any | Tripper public profile |
| `/experiences` | No | Any | Experience marketplace |
| `/xsed` | No | Any | XSED landing |
| `/xsed/drops` | No | Any | XSED drop listing |
| `/xsed/drops/[slug]` | No | Any | XSED drop detail |
| `/journey` | No | Any | Trip builder |
| `/(secure)/checkout` | Yes | CLIENT | Checkout |
| `/(secure)/reveal-destination` | Yes | CLIENT | Destination reveal |
| `/(secure)/account` | Yes | CLIENT | Account dashboard |
| `/(secure)/dashboard/tripper/*` | Yes | TRIPPER | Tripper OS |
| `/(secure)/dashboard/admin/*` | Yes | ADMIN | Admin dashboard |
| `/login` | No | — | Auth modal |

---

## 9. API Surface Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth routes |
| `/api/auth/register` | POST | Create account |
| `/api/trip-requests` | GET/POST | Client trips CRUD |
| `/api/stripe/payment-intent` | POST | Create PaymentIntent |
| `/api/stripe/confirm-payment` | POST | Confirm payment |
| `/api/stripe/webhook` | POST | Stripe webhook handler |
| `/api/stripe/apply-promo` | POST | Apply promo code |
| `/api/stripe/remove-promo` | POST | Remove promo code |
| `/api/experiences` | GET | Public experience listing |
| `/api/tripper/experiences` | GET/POST | Tripper experience CRUD |
| `/api/tripper/experiences/[id]` | PUT/DELETE | Edit/delete experience |
| `/api/tripper/dashboard` | GET | Tripper KPIs |
| `/api/tripper/earnings` | GET | Earnings data |
| `/api/tripper/reviews` | GET | Tripper reviews |
| `/api/tripper/blogs` | GET/POST | Blog CRUD |
| `/api/trippers` | GET | Public tripper listing |
| `/api/xsed/drops` | GET | Paginated drops list |
| `/api/xsed/notifications` | POST | Subscribe to drop notifications |
| `/api/user/me` | GET | Current user profile |
| `/api/user/update` | POST | Update profile |
| `/api/user/preferences` | POST | Update traveler preferences |
| `/api/user/password` | POST | Change password |
| `/api/user/tripper` | POST | Configure tripper profile |
| `/api/blogs` | GET/POST | Blog listing/create |
| `/api/upload` | POST | File upload |
| `/api/contact` | GET | Contact form handler |
| `/api/admin/*` | various | Admin management endpoints |

---

## 10. Data Model Summary

| Model | Key Fields |
|-------|-----------|
| `User` | id, email, roles[], tripperSlug, commission, travelerType, interests[], prefs |
| `TripRequest` | id, userId, status, type, level, startDate, nights, pax, filters, addons, actualDestination |
| `Experience` | id, ownerId, status, type, level, basePrice, destination, hotels, activities, itinerary |
| `Payment` | id, userId, tripRequestId, provider, amount, status, cardLast4 |
| `Review` | id, userId, rating, title, content, isApproved |
| `BlogPost` | id, authorId, status, format, title, slug, content, tags[] |
| `ExperienceLike` | experienceId, userId |
| `WaitlistEntry` | email, createdAt |
| `XsedNotificationSignup` | email, createdAt |

---

## 11. Environment Variables

```
DATABASE_URL                          # PostgreSQL connection string
NEXTAUTH_URL                          # e.g. http://localhost:3010
NEXTAUTH_SECRET                       # Random secret for session signing
GOOGLE_CLIENT_ID                      # Google OAuth client ID
GOOGLE_CLIENT_SECRET                  # Google OAuth client secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY       # Google Maps/Places for location pickers
STRIPE_SECRET_KEY                     # Stripe server-side key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # Stripe client-side key
STRIPE_WEBHOOK_SECRET                 # Stripe webhook signature verification
RESEND_API_KEY                        # Transactional email
NEXT_PUBLIC_TINYMCE_API_KEY           # Rich text editor
BLOB_READ_WRITE_TOKEN                 # Netlify Blobs storage
```

---

## 12. Quality Standards

- TypeScript strict mode — `npm run typecheck` must pass before merging
- No raw `<img>` tags — always use `<Img>` wrapper component
- All user-facing strings via i18n dictionaries
- Responsive: ≥360px (mobile) and ≥1280px (desktop)
- Accessibility: WCAG AA contrast compliance
- Empty and error states must have microcopy
- Light mode only — no `dark:` Tailwind variants
