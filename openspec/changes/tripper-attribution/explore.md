# Exploration: Site-Wide Tripper Attribution (Pricing Session + Referral Credit)

**Note**: This is not a standard file in this project's archived-change convention (exploration normally isn't persisted as a file), but is included here at the user's explicit request for visibility. Originally written to engram (obs #537) before the artifact store was switched mid-flight to file-based openspec — see `state.yaml`.

Supersedes/completes the paused `tripper-referral-commission` exploration (engram obs #521 — kept there for historical reference) — that exploration flagged a missing invite mechanism plus open attribution-window/first-vs-last-touch questions; this change resolves those (first-touch, permanent, cookie+account model) and should be treated as its successor, not a duplicate.

## Current State (verified against real code)

- **No `src/middleware.ts` exists.** Next.js 16 renamed the convention: the actual entry point is `src/proxy.ts`, exporting `proxy(req)` (not `middleware(req)`), which calls `handleI18n()` from `src/lib/i18n/middleware.ts` plus a canonical-slug redirect. Confirmed via glob (no `middleware.ts` anywhere outside `node_modules`) and cross-referenced in `docs/i18n-plan.md` / an archived openspec task.
- **`proxy.ts`'s matcher excludes `/api` entirely**: `export const config = { matcher: ["/((?!_next|api|favicon\\.png|.*\\..*).*)"] }`. Any cookie-refresh/force-write logic placed only in `proxy.ts` will never run for `/api/trip-requests`, `/api/trippers/[slug]/journey-context`, Stripe/MercadoPago routes, etc. This doesn't block reading the cookie in API routes (browsers send cookies on every request regardless of middleware), but it does mean the "force-write from `User.referredByTripperId`, ignoring `?tripper=`" validation/refresh logic cannot live only in the proxy — it needs a shared helper callable from both `proxy.ts` (page routes) and each relevant API route handler.
- **Prisma is not Edge-compatible in this repo**: `src/lib/prisma.ts` uses `@prisma/adapter-pg` + raw `pg.Pool` (TCP), which requires Node.js runtime, not Edge. `proxy.ts` declares no `runtime` export (defaults to Edge) and currently does zero DB access. Doing a per-request Postgres lookup of `User.referredByTripperId` inside `proxy.ts` for every authenticated page view would require either switching the proxy to Node runtime (perf cost: one DB round-trip per navigation for every logged-in user) or — better — embedding `referredByTripperId` in the NextAuth JWT payload. NextAuth already uses `session: { strategy: "jwt" }` — `getToken()` from `next-auth/jwt` is Edge-compatible and DB-free. This is the direction recommended: refresh the claim at sign-in / via `trigger: "update"`, not on every request.
- **`filterCarouselCards` bug confirmed exactly**: `src/lib/utils/traveler-card.ts:86-100` (re-exported through the barrel `src/lib/utils/experiencesData.ts`) drops any type not in `availableTypes` when `tripperContext` is true — no fallback card is rendered.
- **Card href bug confirmed exactly**: `src/components/landing/exploration/TravelerTypesCarousel.tsx:82-86` — `href` is unconditionally `/experiences/by-type/${slugify(type.key)}`, no tripper param, for every card, even when `tripperSlug`/`tripperBadge` props are populated on that same component.
- **`by-type/[type]/page.tsx` confirmed to have zero tripper-param handling** — only reference to "tripper" in that file is an unrelated import (`getReviewsForTripType`).
- **`TripRequest.tripperId` resolution confirmed** at `src/app/api/trip-requests/route.ts:394-425`: resolves `?tripper=slug` via `prisma.user.findFirst({ tripperSlug, roles: has TRIPPER, isActive: true })`, write-once. This already re-validates liveness (`isActive: true`) at write time — good precedent, but it's the only current attribution signal and it's per-`TripRequest`, not per-user/session.
- **`getTripperJourneyContext`** (`src/lib/db/tripper-queries.ts:449+`) is a well-tested, reusable "resolve + validate" function returning a 3-way discriminated result (`not_found | inactive | ok`) including branding, `allowedTypes`/`allowedLevelsByType`, and `priceOverrides`. Natural function to reuse for server-side cookie validation rather than writing new validation logic from scratch.
- **`resolveBasePricePerPerson`** is confirmed pure, synchronous, and explicitly requires `overrides` to be passed in (no implicit default) — already satisfies the "charge-time price always re-derived server-side" invariant. Not in scope to change.
- **No `User.referredByTripperId` field exists yet** — confirmed via full read of `model User` in `prisma/schema.prisma:20-110`. The model already has a documented "write-once, never overwritten" convention for two other fields (`tripperSince`, `siteAccessGrantedAt`), which is the exact pattern to follow for the new field. No existing self-referential `User -> User` FK in the schema — `referredByTripperId` would be the first one.
- **Cookie-setting convention found**: `src/app/api/tripper-invite/oauth-init/route.ts:25-30` sets `ACCESS_INVITE_COOKIE` with `{ httpOnly: true, maxAge: 600, sameSite: "lax", secure: true }` (no explicit `path`). `src/lib/i18n/middleware.ts` sets `COOKIE_LOCALE` with `{ path: "/", maxAge: 1yr, sameSite: "lax" }` (no `httpOnly`/`secure`). For the new attribution cookie, the closer analog is the invite cookie (httpOnly + secure, server-trust-only, signed/HMACed) but WITH explicit `path: "/"` like the locale cookie, since it must apply site-wide.
- **`TravelerTypesCarousel` already has the `tripperSlug`/`tripperBadge` props plumbed through** — the fix needed is scoped to the `href` construction and `filterCarouselCards`, not new prop plumbing.
- **No reusable tripper-picker/combobox/autocomplete component exists anywhere** in `src/components/ui/` or `src/components/app/admin/`. The register-modal dropdown needs a plain `<select>`-based picker, populated from a new/existing tripper-list endpoint — not an autocomplete widget.
- **Register form does NOT use react-hook-form.** The actual register modal, `src/components/auth/AuthModal.tsx`, uses plain `useState` + `<FormField>` controlled inputs. `react-hook-form` is a dependency in `package.json` but only used in 2 unrelated xsed files.
- **`TripperPreviewBanner.tsx`** is an existing precedent for a persistent top banner with a toggle-style link — but it is hardcoded Spanish-only with no dictionary usage at all. This is itself a pre-existing i18n-rule violation; if reused/extended as a pattern, the new banner MUST pull from `es.json`/`en.json` — do not copy the hardcoded-string pattern.

## Affected Areas

- `src/proxy.ts` — the real middleware entry (not `src/middleware.ts`); matcher currently excludes `/api`
- `src/lib/i18n/middleware.ts` — `handleI18n`, cookie-setting convention reference
- `src/app/[locale]/journey/JourneyPageClient.tsx` — client-side `?tripper=` reading (lines ~144-173) to retire
- `src/components/landing/exploration/TravelerTypesCarousel.tsx` — href bug (82-86), filter bug via `traveler-card.ts`
- `src/lib/utils/traveler-card.ts` (barrel: `src/lib/utils/experiencesData.ts`) — `filterCarouselCards` (86-100)
- `src/app/[locale]/experiences/by-type/[type]/page.tsx` — zero attribution handling today
- `src/app/api/trip-requests/route.ts` (394-425) — current write-once `tripperId` resolution
- `src/app/api/trippers/[slug]/journey-context/route.ts` + `src/lib/db/tripper-queries.ts` (`getTripperJourneyContext`) — reusable validation primitive
- `src/lib/pricing/resolve-base-price.ts` — unaffected, already satisfies server-side re-derivation invariant
- `prisma/schema.prisma` `model User` (20-110) — needs `referredByTripperId` self-referential FK
- `src/lib/auth.ts` (NextAuth JWT strategy) — candidate place to embed referral claim to avoid per-request DB hit in Edge proxy
- `src/components/auth/AuthModal.tsx` — register modal, plain useState pattern, no RHF
- `src/components/tripper/TripperPreviewBanner.tsx` — banner precedent, currently unlocalized (bug to avoid repeating)
- `src/app/api/tripper-invite/oauth-init/route.ts` — cookie-setting convention

## Approaches Considered

1. **Cookie value embeds validated tripper directly (proxy resolves + validates on every request)** — Pros: single source of truth per request. Cons: requires Node runtime + Postgres in `proxy.ts` for every page view of every authenticated user; breaks Edge-compatibility. Effort: Medium, ongoing infra cost.
2. **Cookie is opaque/signed pointer only; validation happens lazily where it matters; authenticated-user force-write sourced from NextAuth JWT claim, not a live DB call** (recommended, adopted) — Pros: keeps `proxy.ts` Edge-compatible and cheap; reuses the already-tested `getTripperJourneyContext`; JWT claim refresh piggybacks on NextAuth's existing flow. Cons: attribution can be a few requests "stale" between JWT refresh and an account-level referral change (acceptable — referral is permanent/first-touch anyway). Effort: Medium.
3. **No middleware/cookie at all — keep per-page query-param threading, just extend to `by-type`** — Pros: zero infra change. Cons: does not fix the core problem (attribution lost on any navigation away from a param-carrying URL). Not viable.

## Recommendation

Approach 2, with corrections folded in: use `src/proxy.ts` not `src/middleware.ts`; keep it Edge/DB-free by sourcing authenticated attribution from a NextAuth JWT claim; reuse `getTripperJourneyContext` for liveness validation; register-modal dropdown is plain `<select>`/`useState`, not react-hook-form.

## Risks Identified

- Self-referential FK (`User.referredByTripperId -> User.id`) needs explicit `onDelete` behavior decided at design time — no existing precedent in this schema to copy. (Resolved in proposal: `SetNull`.)
- Embedding a claim in the JWT means any change to `referredByTripperId` needs an explicit session-refresh trigger (`trigger: "update"`) — must be wired at the exact moment the register flow / "None" choice writes the field.
- `TripperPreviewBanner.tsx` is hardcoded-Spanish; reusing its visual pattern without localizing would introduce a second unlocalized banner into the codebase.
- `filterCarouselCards`/`TravelerTypesCarousel` fix touches a shared, `use client` component rendered on multiple pages — needs locale-aware labels, both es/en.
- No existing tripper-picker UI component — building the register-modal dropdown is net-new UI work.

## Ready for Proposal

Yes — with the above corrections folded in as settled facts, not open questions.
