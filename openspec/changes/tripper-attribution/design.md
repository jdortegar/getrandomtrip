# Design: Site-Wide Tripper Attribution

Implements proposal Approach 2 ("opaque signed cookie pointer + lazy validation"). ADR-1 (`onDelete`) is settled in `proposal.md`: `SetNull`, no snapshot/ledger.

## Technical Approach

Two-file module split under `src/lib/tripper/` (dir already exists: `commission.ts`). The split is the load-bearing decision — if one file imported Prisma, `proxy.ts` would drag Node deps and leave Edge.

| File | Runtime | Contents | Imports allowed |
|---|---|---|---|
| `src/lib/tripper/attribution.ts` | Edge + Node | `GRT_TRIPPER_COOKIE`, `COOKIE_MAX_AGE`, `signAttribution()`, `verifyAttribution()`, `resolveAttribution()` (pure decision fn), `attributionCookieOptions()`, `isAttributionEnabled()` | Web Crypto only. **Zero** `@/lib/prisma`, `node:crypto`, `next-auth` server bits |
| `src/lib/tripper/attribution-server.ts` | Node only | `readAttributionSlug()` (`cookies()` + verify), `resolveLiveAttribution()` → `getTripperJourneyContext`, `resolveReferrerId(slug)`, `stampReferral(userId, referrerId)` | Prisma, `next/headers` |

`accessInviteTokens.ts` uses `createHash` from `node:crypto` — **not reusable at the Edge**. New code uses `crypto.subtle` HMAC-SHA256 (async).

### Layer split (explicit)

| Layer | Does | Never does |
|---|---|---|
| `proxy.ts` (Edge) | `getToken()` for the JWT claim; read `?tripper=` / `/trippers/[slug]` path segment; verify + set/refresh/clear the cookie via `resolveAttribution()` | Any DB call, any liveness check, any role check |
| Node read sites (`journey/page.tsx`, `by-type/page.tsx`, `/api/trip-requests`, checkout/payment-intent, `/api/auth/register`, `signIn` Google-create) | `readAttributionSlug()` → `getTripperJourneyContext(slug)` → act only on `status === "ok"` | Trust the cookie as pricing truth |

Cookie is a **pointer, never an authority**. Every price/referral decision re-resolves.

## Architecture Decisions

### ADR-2 — Cookie name: `grt_tripper` (not `rt_tripper`)
Verified convention: `grt_tripper_invite`, `grt_traveler_invite`. `rt_tripper` breaks the namespace.

### ADR-3 — Signing secret: derived subkey, no new env var
| Option | Verdict |
|---|---|
| New `TRIPPER_ATTRIBUTION_SECRET` | Rejected — Netlify env churn, `env.example` drift, silently unsigned cookies in any env that forgets it |
| Raw `NEXTAUTH_SECRET` as HMAC key | Rejected — same key signs session JWTs; an attribution oracle becomes a session oracle |
| **Derive: `key = HMAC-SHA256(NEXTAUTH_SECRET, "grt_tripper.v1")`** | **Chosen** — zero new config, cryptographic domain separation, `v1` label gives free rotation |

Payload: `v1.<slug>.<expEpochSec>.<b64url sig>`, sig over `v1.<slug>.<exp>`. Embedding `exp` makes TTL a **server-enforced** invariant, not a browser courtesy.

Flags (invite-cookie convention + explicit `path`): `{ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: TTL }`. `sameSite: lax` is required — attribution arrives via cross-site inbound links.

### ADR-4 — Cookie TTL: 30 days (CONFIRMED)
| Window | Tradeoff |
|---|---|
| Session-only | Loses attribution on browser close — defeats the purpose |
| 7d | Safe, but short vs. real trip-consideration cycles |
| **30d** | **CHOSEN, confirmed by user** — standard referral-window default; comfortably covers a high-consideration travel purchase; bounded blast radius if a stale link is shared |
| 90d / 1y | Rejected — a forgotten cookie silently repricing a user months later is a support burden with no offsetting benefit, since the *permanent* referral is captured at signup anyway |

### ADR-5 — JWT claim carries the slug, not the id
The Edge proxy's only action is writing a cookie whose payload is a slug (`getTripperJourneyContext` is slug-keyed). An id at the Edge would be unusable without a DB join. DB column stays `referredByTripperId` (referential integrity); JWT claim is `referredByTripperSlug: string | null`.

Rollout-safe: `undefined` (pre-deploy token) ≠ `null` (explicit "no referrer"). `undefined` → leave the anonymous cookie alone; `null` → force-clear.

### ADR-6 — SECURITY: harden the `trigger: "update"` branch (blocking)
`src/lib/auth.ts:219-221` currently does `return { ...token, ...clientSession }` — a **blanket client-controlled token spread**. Adding an attribution claim to that token makes it client-forgeable: `update({ referredByTripperSlug: "rival" })` would mint another tripper's pricing. Required change:

```ts
if (trigger === "update") {
  const { referredByTripperSlug: _drop, ...safe } = (clientSession ?? {}) as Record<string, unknown>;
  return { ...token, ...safe, referredByTripperSlug: await getReferralClaim(token.id as string) };
}
```

**Finding that contradicts the original brief**: `trigger: "update"` is *not* the primary correctness path. `referredByTripperId` is write-once at account creation, and credentials-register cannot yield a live session (`EMAIL_NOT_VERIFIED` gate, `auth.ts:79-113`). The Google-create branch (`auth.ts:140-179`) stamps the referral *before* `jwt()` runs, so the claim is already fresh. `update()` is wired as a cheap safety net (`AuthModal` calls `await update({ refreshedAt: Date.now() })` after any register that did produce a session); the guarantee comes from computing the claim in `jwt()` on every sign-in.

Claim set in `jwt()` when `user` is present — one `findUnique({ select: { referredByTripperId, referredBy: { select: { tripperSlug, isActive, roles } } } })`, once per sign-in. Slug emitted only if the referrer is still `isActive` + `has TRIPPER`.

**STATUS: implemented and verified in PR1** (see `apply-progress.md`).

### ADR-7 — Prisma field
`@db.VarChar` is **not** used anywhere in this schema for ids — only `@db.Text` for long text (`schema.prisma:226, 288-322`). Ids are bare `String`. Exact syntax, following the `tripperSince` / `siteAccessGrantedAt` doc-comment convention (`schema.prisma:47-48`) and the `TripRequest.tripper` precedent (`:180`):

```prisma
  referredByTripperId String? // Set once at account creation (register or Google create) — never overwritten. Null = no referrer, or referrer account deleted.

  // Relations
  referredBy        User?  @relation("ReferredBy", fields: [referredByTripperId], references: [id], onDelete: SetNull)
  referredTravelers User[] @relation("ReferredBy")
```

Additive + nullable → no down-migration needed on rollback. **STATUS: implemented in PR1.**

### ADR-8 — `by-type` hrefs: keep `?tripper=` on available cards
| Option | Verdict |
|---|---|
| Cookie only, bare href | Rejected — copied URLs carry no attribution; no self-heal if the cookie was cleared/expired |
| **`?tripper={slug}` when `tripperSlug` prop set** | **Chosen** — proxy re-affirms the *same* value (idempotent, not a second source of truth); links stay shareable |

Unavailable-type fallback card: `/experiences/by-type/{slug}?catalog=randomtrip`. The `catalog` flag is read **by the page, not the proxy** — a per-request opt-out that renders base pricing while leaving the cookie untouched (reversible).

### ADR-9 — Mode banner: build fresh, leave `TripperPreviewBanner` alone
`TripperPreviewBanner.tsx` is hardcoded Spanish and client-side via `getUserRole()` reading `localStorage`. Extending it would need a full rewrite anyway and would entangle two unrelated banners. **Chosen**: new `src/components/tripper/AttributionModeBanner.tsx`, server component, copy from `dict.tripperAttribution` (new section in `es.json`/`en.json` + `dictionary.ts`). Fixing the preview banner's own i18n stays out of scope.

**Mount**: `src/app/[locale]/layout.tsx` (already `export const dynamic = "force-dynamic"`, so a `cookies()` read costs nothing new). Placed just inside `GateAwareChrome`.

**Toggle**: `POST /api/attribution/mode` route handler (`{ mode: "tripper" | "randomtrip" }`) — not a Server Action (this codebase has zero `"use server"` files; route handlers with colocated `__tests__/route.test.ts` are the established, testable convention). The route only rewrites/clears the cookie; it never touches `referredByTripperId`.

## Data Flow

```
inbound request ──> proxy.ts (Edge)
    getToken() ──> claim slug | null | undefined
    ?tripper= / /trippers/[slug]     resolveAttribution()  ──> keep | set | clear
                                              └──> Set-Cookie grt_tripper (signed)
                                                        │
   ┌────────────────────────────────────────────────────┘
   ▼
Node read site ──> readAttributionSlug() ──> getTripperJourneyContext(slug)
                        not_found/inactive ──> base RandomTrip catalog
                        ok ──> priceOverrides / allowedTypes / branding
                                     └──> charge time: resolveBasePricePerPerson(overrides) re-derived
```

Precedence in `resolveAttribution()` (pure, table-testable):

| Claim | `?tripper=` present | Cookie | Result |
|---|---|---|---|
| `string` | any | any | force-set to claim (anti-poaching — frozen referral beats today's link) |
| `null` | any | any | clear |
| `undefined` (anon / legacy token) | yes | any | set to param |
| `undefined` | no | valid | keep (refresh `exp`) |
| `undefined` | no | invalid/forged/expired | clear |

## File Changes

| File | Action | What | PR |
|---|---|---|---|
| `src/lib/tripper/attribution.ts` | Create | Edge-safe sign/verify/resolve + cookie constants | PR1 ✅ |
| `src/lib/auth.ts` | Modify | `jwt()` claim + ADR-6 hardening | PR1 ✅ |
| `prisma/schema.prisma` | Modify | ADR-7 field + relations + additive migration | PR1 ✅ |
| `src/lib/tripper/attribution-server.ts` | Create | `readAttributionSlug`, `resolveLiveAttribution`, `resolveReferrerId`, `stampReferral` | PR2 |
| `src/proxy.ts` | Modify | After i18n + canon redirect, apply attribution to the outgoing response; matcher unchanged | PR2 |
| `src/app/api/auth/register/route.ts` | Modify | Accept `referredByTripperSlug?: string \| null`; `undefined` → fall back to cookie, `null` → explicit None; `stampReferral` after create | PR2 |
| `src/app/api/trippers/active/route.ts` | Create | `GET` → `{ trippers: [{slug, name}], current: slug \| null }`; `current` derived server-side (cookie is `httpOnly`, modal can't read it) | PR2 |
| `src/app/api/attribution/mode/route.ts` | Create | POST cookie toggle | PR2 |
| `src/components/auth/AuthModal.tsx` | Modify | Register-mode `<select>` via `FormSelectField`; `useState<string>` with `""` = None sentinel → serialized as `null` | PR2 |
| `src/lib/utils/traveler-card.ts` | Modify | `filterCarouselCards` returns flags, not a filtered list | PR3 |
| `src/components/landing/exploration/TravelerTypesCarousel.tsx` | Modify | Per-card href + fallback state | PR3 |
| `src/app/[locale]/experiences/by-type/[type]/page.tsx` | Modify | Read attribution, pass `priceOverrides` | PR3 |
| `src/app/[locale]/journey/page.tsx` | Modify | Resolve server-side, pass `tripperState` prop | PR3 |
| `src/app/[locale]/journey/JourneyPageClient.tsx` | Modify | Delete `useEffect` fetch + `tripperState` `useState` | PR3 |
| `src/types/tripper.ts` | Modify | Move `TripperContextState`/`CarouselCard` types out of client files | PR3 |
| `src/components/tripper/AttributionModeBanner.tsx` | Create | Localized banner + toggle | PR3 |
| `src/app/[locale]/layout.tsx` | Modify | Mount banner | PR3 |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modify | `tripperAttribution` section | PR3 |

## Interfaces

```ts
// attribution.ts — pure, no I/O
export type AttributionClaim = string | null | undefined;
export type AttributionAction =
  | { kind: "keep" } | { kind: "set"; slug: string } | { kind: "clear" };
export function resolveAttribution(input: {
  claimSlug: AttributionClaim;
  paramSlug: string | null;
  cookieSlug: string | null; // already HMAC-verified & unexpired, else null
}): AttributionAction;

export async function signAttribution(slug: string, secret: string, ttlSec: number): Promise<string>;
export async function verifyAttribution(raw: string | undefined, secret: string): Promise<string | null>;
```

```ts
// traveler-card.ts — flag, do not drop
export interface CarouselCard extends TravelerTypeCardData { availableFromTripper: boolean }
export function filterCarouselCards(
  cards: TravelerTypeCardData[],
  options: { availableTypes?: string[]; tripperContext: boolean },
): CarouselCard[];
```
Non-tripper context → every card `availableFromTripper: true` (identity behaviour preserved). Tripper context with empty `availableTypes` → all cards flagged `false` (the old `return []` and the `if (typesToShow.length === 0) return null` guard both go away — the carousel now always renders).

Carousel href (replacing the old unconditional href):
```
comingSoon                    -> undefined
available && tripperSlug      -> /experiences/by-type/{slug}?tripper={tripperSlug}
available && !tripperSlug     -> /experiences/by-type/{slug}
!available (tripper context)  -> /experiences/by-type/{slug}?catalog=randomtrip
```
Unavailable cards render `dict.tripperAttribution.visitRandomTripExperiences` as the CTA label and suppress `tripperBadge` (it is not that tripper's offer).

### Self-referral guard
Single choke point: `stampReferral(userId, referrerId)` in `attribution-server.ts`, mirroring `stampSiteAccess` (`accessInviteTokens.ts:139-144`):

```ts
export async function stampReferral(userId: string, referrerId: string | null) {
  if (!referrerId || referrerId === userId) return; // self-referral rejected here
  await prisma.user.updateMany({
    where: { id: userId, referredByTripperId: null }, // write-once
    data: { referredByTripperId: referrerId },
  });
}
```
`updateMany`, not `update` — `update`'s `where` only accepts unique fields, so the `referredByTripperId: null` write-once guard is illegal there (same gotcha already documented on `stampSiteAccess`). Called from `/api/auth/register` and the Google-create branch of `signIn`.

### `by-type` wiring
`getPlannerContentForType(type, locale, overrides?)` (`src/lib/utils/levels.ts:225-238`) **already accepts overrides** — the page just never passed them. The change is small:

```ts
const slug = searchParams.catalog === "randomtrip" ? null : await readAttributionSlug();
const ctx = slug ? await getTripperJourneyContext(slug) : null;
const active = ctx?.status === "ok" && ctx.context.allowedTypes.includes(typeData.meta.slug)
  ? ctx.context : null;
// ...
<TypePlanner content={getPlannerContentForType(typeData.meta.slug, locale, active?.priceOverrides ?? null)} … />
```
The parent layout is already `force-dynamic`, so this does not newly opt the page out of static rendering. Type resolved but not offered by the tripper → base catalog + banner note (never a 404).

## Testing Strategy (Strict TDD sequencing)

| Layer | Target | Notes |
|---|---|---|
| **Unit (pure — write first)** | `resolveAttribution()` precedence table; `signAttribution`/`verifyAttribution` round-trip, tamper-rejection, expiry-rejection, wrong-key rejection; `filterCarouselCards` flagging; register-body normalization | vitest, no mocks |
| **Unit (mocked prisma)** | `resolveReferrerId` (inactive/non-tripper/missing → null); `stampReferral` (write-once no-op, self-referral no-op) | Follow `src/lib/auth/__tests__/verificationTokens.test.ts` |
| **Route (mocked prisma)** | `/api/auth/register` referral capture; `/api/trippers/active`; `/api/attribution/mode` cookie flags | Colocated `__tests__/route.test.ts` |
| **Integration/manual** | `proxy.ts` itself (Edge cookie round-trip), `auth.ts` `jwt()` claim, banner mount | No middleware test harness exists; verify manually + typecheck. Do NOT invent one for this change |
| **Component** | Carousel fallback rendering (es + en) | happy-dom, only if a sibling precedent exists |

Regression guard: an import-lint assertion that `attribution.ts` has no `node:crypto` / `@/lib/prisma` import — the single easiest way to silently break Edge. **STATUS: implemented in PR1** (`attribution.purity.test.ts`).

## Migration / Rollout

Additive nullable column; backfills as `null`. Feature-flag the proxy block via `ATTRIBUTION_ENABLED` — off = no cookie written = base RandomTrip catalog, never a wrong price. Migration ships before the register picker. Rollback leaves the column in place.

## Open Questions — RESOLVED

- ~~ADR-4 cookie TTL~~ — **30 days, confirmed.**
- ~~Should `/trippers/[slug]` browsing set attribution, or only an explicit `?tripper=` link?~~ — **Yes, intended, confirmed.** The banner+toggle is what makes it visible/reversible.
- `/api/trippers/active` returns every active tripper — fine at current scale; needs search/pagination past ~200 (not blocking, note for future).
