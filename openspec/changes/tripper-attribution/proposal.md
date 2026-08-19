# Proposal: Site-Wide Tripper Attribution

Supersedes the paused `tripper-referral-commission` exploration (originally captured in engram, obs #521 — kept there for historical reference, not duplicated here) by answering its open questions: attribution lives on `User.referredByTripperId`, policy is **first-touch permanent**, window is **account lifetime** (not time-boxed), duplicate-link exposure resolves first-write-wins (same precedent as `TripRequest.tripperId`). **Commission calculation (1%/2%/3% rates, RandomTrip-revenue modeling, ledger) stays OUT of scope** — this change only builds the attribution foundation that feature depends on.

## Intent

Two catalogs exist — the RandomTrip global marketplace and a tripper's curated/priced catalog — but there is no durable notion of "which catalog am I in." Active-tripper state is read client-side from `?tripper=` in `JourneyPageClient.tsx` and is lost the moment the user navigates away; `by-type` never had it. Consequences today: attribution-carrying links break on the very carousel meant to promote them, non-offered traveler types are silently dropped, and there is no user-level referral record for commissions to ever hang off.

## Scope

### In Scope

1. **`grt_tripper` pricing-session cookie** — signed/HMACed, `httpOnly`, `secure`, `sameSite: lax`, explicit `path: "/"` (convention from `src/app/api/tripper-invite/oauth-init/route.ts:25-30` + `path` from the locale cookie). Read/written in `src/proxy.ts` only — **no DB access, proxy stays Edge**.
2. **Anonymous attribution** — cookie set/refreshed from `?tripper=slug` on any route, or from the `/trippers/[tripper]` path segment.
3. **Authenticated attribution** — cookie force-derived from the NextAuth JWT `referredByTripperSlug` claim, **ignoring any `?tripper=` on that request**. The frozen account referral always beats today's clicked link (anti-poaching). Claim added in `src/lib/auth.ts` `jwt()`, refreshed at sign-in and via `trigger: "update"` at the register-modal write / "None" choice.
4. **Shared attribution helper** — because `proxy.ts`'s matcher excludes `/api`, force-derivation and validation live in a helper (`src/lib/tripper/attribution.ts` + `attribution-server.ts`) callable from both `proxy.ts` and API route handlers. Not "in middleware."
5. **`User.referredByTripperId`** — new self-referential FK, written **exactly once at signup**, never overwritten (follows the documented `tripperSince` / `siteAccessGrantedAt` "set once, never overwritten" convention in `model User`).
6. **Register-modal tripper picker** — plain `<select>` in `src/components/auth/AuthModal.tsx` using its existing `useState` + `<FormField>` pattern (**no react-hook-form**, no combobox — neither exists to reuse). Pre-filled from the active-tripper resolution when present. Includes an explicit **"None"** option so "no referrer" is a deliberate, validated choice rather than an empty state — mirrors the "not offered vs explicit zero" distinction already shipped in the price-override grid. "None" freezes the field to `null`, which per item 3 means the cookie force-clears on every future authenticated visit for that user.
7. **Carousel fixes (per-card, not a mode switch)** — `TravelerTypesCarousel.tsx:82-86` href must actually carry attribution for offered types (broken today even for available ones); `filterCarouselCards` (`src/lib/utils/traveler-card.ts:86-100`) stops dropping non-offered types and instead renders them with a distinct localized label ("Visit RandomTrip experiences") linking to plain `by-type/{slug}?catalog=randomtrip` **without** triggering account-level force-attribution for that one click — a reversible, per-query opt-out.
8. **Persistent mode banner + toggle** — shown when the active-tripper cookie doesn't match what's rendered; toggles `grt_tripper` only. Fully localized via `es.json`/`en.json` + `dictionary.ts` per `.claude/rules/i18n-and-types.md`. `TripperPreviewBanner.tsx` is a usable *shape* but is hardcoded Spanish — **do not copy its pattern**.
9. **Retire** the client-side `?tripper=` reading in `JourneyPageClient.tsx` (~144-173). It must not run alongside the new mechanism.
10. **Defensive invariants** (built in from the start, not bolted on):
    - Cookie is never trusted as pricing truth. Every read that affects price or referral re-validates via `getTripperJourneyContext` (`src/lib/db/tripper-queries.ts:449+`) at the sites that matter: trip-request creation, journey-context fetch, checkout/payment-intent, register submit. Not on every navigation.
    - Cookie value is signed/HMACed so it cannot be hand-edited to shop for another tripper's pricing.
    - **Self-referral guard** enforced server-side at the write path (`referredByTripperId === user.id` rejected), not merely omitted from the dropdown.
    - **Read-time liveness**: a demoted/deactivated tripper resolves as *no attribution* for both pricing and future referral credit.
    - **Charge-time re-derivation**: prices are always re-derived server-side at charge time via `resolveBasePricePerPerson` (already pure, already requires explicit `overrides`). Stated as an explicit invariant because attribution can now legitimately change between page view and charge (cookie toggle, mid-flow login).

### Out of Scope

- Referral **commission calculation and payouts** (the 1%/2%/3% tier rates, "RandomTrip revenue" modeling, `ReferralCommission` ledger, payout UI) — deferred to a follow-up change that consumes this foundation.
- Changes to `resolveBasePricePerPerson` — already satisfies its invariant.
- Migrating `TripRequest.tripperId` semantics — untouched; per-request attribution stays as-is.
- Retro-attributing existing users (`referredByTripperId` backfills as `null`).
- Fixing `TripperPreviewBanner.tsx`'s own i18n violation (noted, not this change's job).

## Capabilities

### New Capabilities
- `tripper-attribution`: pricing-session cookie lifecycle, anonymous vs authenticated resolution precedence, permanent user-level referral capture, validation invariants.

### Modified Capabilities
- `tripper`: public tripper surfaces must carry attribution across navigation; carousel renders non-offered types as RandomTrip fallbacks instead of dropping them.
- `tripper-price-override`: overrides now apply from a persisted session cookie, not only from a `?tripper=`-carrying URL; adds the read-time liveness + charge-time re-derivation invariants.
- `auth-verification`: registration captures a validated referring tripper (or explicit None) exactly once.

## Approach

Opaque signed cookie pointer + lazy validation where it matters.

`proxy.ts` stays Edge and DB-free: it reads `getToken()` (Edge-compatible, DB-free) for the `referredByTripperSlug` claim and writes/clears/refreshes the signed `grt_tripper` cookie. Zero Prisma in the proxy — `src/lib/prisma.ts` uses `@prisma/adapter-pg` over a raw `pg.Pool` and is Node-only; a live lookup would force the proxy to Node with a DB round-trip per page view for every logged-in user. Real role/liveness validation happens lazily at the handful of read sites where a price or referral decision is actually made, reusing the already-tested `getTripperJourneyContext` rather than new validation code. The write path reuses the existing write-once pattern from `src/app/api/trip-requests/route.ts:394-425` (`findFirst` on `tripperSlug` + TRIPPER role + `isActive: true`).

## ADR-1: `onDelete` for `User.referredByTripperId` (self-referential FK) — RESOLVED

First self-referential FK in this schema — no in-schema precedent for *self*-relations, but there is a direct precedent for *attribution-to-a-tripper*: `TripRequest.tripper` (`prisma/schema.prisma:180`) uses `onDelete: SetNull`.

| Option | Behavior on referrer deletion | Verdict |
|---|---|---|
| `Cascade` | Deletes the referred traveler's account | Unacceptable — catastrophic data loss |
| `Restrict` | Blocks deleting any tripper who ever referred someone | Rejected — makes tripper account deletion impossible |
| **`SetNull`** | Traveler survives; referral becomes `null` (= no attribution) | **CHOSEN** — matches `TripRequest.tripper:180` |
| Soft-delete + keep FK | Preserves historical credit for future commission audits | Deferred — belongs to the commission ledger change |

**Decision (confirmed by user)**: `onDelete: SetNull`, no historical snapshot. If a referring tripper's account is deleted, every traveler they referred permanently loses that attribution with no surviving record — RandomTrip keeps the full amount on any of that traveler's future bookings. This is deliberate: no commission is owed to a deleted account, and there is no obligation to preserve historical referral records. A future commission-ledger change would snapshot `referrerId` + rate per payment row independently, if ever needed — not this change's job.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/proxy.ts` | Modified | Cookie read/write/clear; stays Edge, no DB |
| `src/lib/auth.ts` | Modified | `referredByTripperSlug` JWT claim + `trigger: "update"` refresh + security hardening (ADR-6) |
| `prisma/schema.prisma` `model User` | Modified | New self-referential FK + back-relation + migration |
| `src/components/auth/AuthModal.tsx` | Modified | Tripper `<select>` + explicit "None" |
| `src/app/api/auth/register` path | Modified | Write-once, self-referral guard, active-tripper validation |
| `src/lib/tripper/attribution.ts` | New | Sign/verify cookie, resolve precedence; shared by proxy + API |
| `src/app/api/trippers/active/route.ts` | New | Feeds the register dropdown |
| `src/lib/utils/traveler-card.ts` | Modified | Fallback cards instead of silent drop |
| `src/components/landing/exploration/TravelerTypesCarousel.tsx` | Modified | Attribution-carrying href per card |
| `src/app/[locale]/experiences/by-type/[type]/page.tsx` | Modified | Honor cookie attribution |
| `src/app/[locale]/journey/JourneyPageClient.tsx` | Modified (removal) | Retire client-side `?tripper=` reading |
| `src/components/tripper/AttributionModeBanner.tsx` | New | Localized banner + cookie toggle |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | Banner + fallback-card copy |
| `src/lib/db/tripper-queries.ts` (`getTripperJourneyContext`) | Reused | Liveness validation primitive |
| `src/lib/pricing/resolve-base-price.ts` | Unchanged | Already satisfies re-derivation invariant |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Stale JWT claim after register/"None" write | High | Wire `trigger: "update"` at the exact write moment; validate at read sites anyway |
| Forged cookie to obtain better pricing | Med | HMAC-sign the cookie; re-validate + re-derive price server-side at charge |
| Proxy accidentally pulled to Node runtime | Med | Hard rule: no Prisma import reachable from `proxy.ts`; Edge-purity regression guard |
| `/api` excluded from matcher → force-attribution skipped | High | Shared helper invoked explicitly by each relevant API route |
| Carousel is `use client`, rendered on home + tripper pages | Med | Per-card change only; needs es/en keys, verify both surfaces |
| Cookie/JWT precedence confusion → user sees wrong catalog | Med | Reversible banner toggle makes state visible and correctable |
| Scope creep into commission payouts | Med | Explicit out-of-scope statement; commission is a separate change |
| `auth.ts`'s `trigger: "update"` branch spreads client session unfiltered | High (until fixed) | ADR-6 (design phase): strip the claim from `clientSession` before spreading, recompute from DB |

## Rollback Plan

1. Feature-flag the proxy cookie logic (`ATTRIBUTION_ENABLED`); disabling reverts to no-attribution (base RandomTrip catalog) — the safest default, never a wrong price.
2. Revert commits for carousel/`by-type`/banner independently — they are behaviorally additive.
3. The Prisma migration is additive and nullable: leave the column in place on rollback (no down-migration needed); drop the JWT claim and the dropdown, and the field simply goes unread.
4. `JourneyPageClient.tsx` retirement is the only removal — restore in the same revert if the cookie path is rolled back.

## Dependencies

- Signing secret for the cookie HMAC — resolved in design (ADR-3): derived subkey from `NEXTAUTH_SECRET`, no new env var.
- Prisma migration applied before the register dropdown ships.
- ~~User sign-off on ADR-1 `onDelete` if commission-after-referrer-deletion is a real product requirement~~ — RESOLVED, see ADR-1 above.

## Success Criteria

- [ ] Active tripper survives navigation across `/journey`, `/experiences/by-type/*`, `/trippers/*` and page reloads.
- [ ] A signed-in user with a frozen referral sees that referral's pricing even when arriving via a different tripper's `?tripper=` link.
- [ ] `referredByTripperId` is set exactly once at signup, is never mutated by banner toggles, and rejects self-referral server-side.
- [ ] Non-offered traveler types render a localized RandomTrip fallback card (es + en) instead of disappearing; offered types link with attribution intact.
- [ ] A hand-edited/forged `grt_tripper` cookie yields base RandomTrip pricing, never another tripper's overrides.
- [ ] A deactivated or role-demoted tripper resolves as "no attribution" at read time.
- [ ] `proxy.ts` performs zero DB queries and remains on the Edge runtime.
- [ ] `npm run typecheck` and `npm run test` pass; no hardcoded user-visible strings introduced.

## Resolved Decisions

| # | Decision |
|---|---|
| 1 | ADR-1: `onDelete: SetNull`, no historical snapshot — deleted tripper's referrals silently lose attribution, RandomTrip keeps full future earn. |
| 2 | Cookie TTL: 30 days (design ADR-4, confirmed). |
| 3 | `/trippers/[slug]` browsing itself sets pricing attribution — intended, not a bug (confirmed). The banner+toggle is what makes it visible/reversible. |
| 4 | Delivery: chained PRs, `feature-branch-chain` strategy (confirmed) — PR1 Foundation+Security, PR2 Server wiring+APIs, PR3 Carousel/page wiring+Banner. |
| 5 | Commission rate calculation/payout logic is explicitly out of scope for this change. |

## Open Questions

**None outstanding at proposal time.** Design phase surfaced and resolved cookie name (`grt_tripper`, not `rt_tripper`), signing-secret source (derived subkey), and a blocking security finding in `auth.ts` (ADR-6) — see `design.md`.
