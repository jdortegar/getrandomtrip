# Tasks: Site-Wide Tripper Attribution

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 900-1300 (19+ files: schema, auth.ts, 2 new lib modules, proxy.ts, 3 API routes, AuthModal, carousel+util, by-type/journey pages+client, types, banner, layout, 2 dicts + dictionary.ts, ~10 test files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 Foundation+Security -> PR2 Server wiring+APIs -> PR3 UI/Carousel/Banner |
| Delivery strategy | ask-on-risk |
| Chain strategy | **feature-branch-chain** (confirmed by user) |

Decision needed before apply: RESOLVED — feature-branch-chain, PR1 = Phase 1 only.

### Suggested Work Units

| Unit | Goal | PR | Notes |
|---|---|---|---|
| 1 | Schema + Edge-safe attribution.ts + Edge-purity guard + auth.ts ADR-6 hardening + jwt() claim + ATTRIBUTION_ENABLED flag | PR1 | Security-critical, must merge/land first; blocks 2 and 3 — **DONE, branch `feature/tripper-attribution-pr1-foundation-security`** |
| 2 | attribution-server.ts + proxy.ts wiring + register/trippers-active/mode routes + AuthModal picker | PR2 | Depends on PR1's module + claim — **DONE, branch `feature/tripper-attribution-pr2-server-wiring`** |
| 3 | Carousel flagging + by-type/journey wiring + AttributionModeBanner + i18n | PR3 | Depends on PR2's read APIs — NOT STARTED |

## Phase 1: Foundation + Security (blocking, must land first) — COMPLETE (9/9)

- [x] 1.1 Schema: add `referredByTripperId String?` + `referredBy`/`referredTravelers` relations (ADR-7, `onDelete: SetNull`); additive migration. (This project uses `prisma db push`, not `prisma migrate` — no migration file exists in `prisma/migrations/`, only `.gitkeep`; schema edit alone is the additive change. `npx prisma validate` + `npx prisma generate` both pass.)
- [x] 1.2 [SECURITY-BLOCKING] `src/lib/auth.ts` — strip `referredByTripperSlug` from `clientSession` before the spread in the `trigger === "update"` branch; recompute claim from DB in that branch (ADR-6). Covered by `src/lib/__tests__/auth.jwt.test.ts` ("trigger:'update' hardening" describe block, 3 tests).
- [x] 1.3 Created `src/lib/tripper/attribution.ts`: `GRT_TRIPPER_COOKIE`, `COOKIE_MAX_AGE` (30d), `attributionCookieOptions()`, `isAttributionEnabled()`, `resolveAttribution()` (pure), `signAttribution`/`verifyAttribution` (Web Crypto HMAC-SHA256 only — zero `node:crypto`/`@/lib/prisma`).
- [x] 1.4 [RED] `attribution.test.ts`: precedence table (5 rows) + sign/verify round-trip, tamper, expiry, wrong-key, malformed/undefined input, plus cookie-constant and `isAttributionEnabled` tests (16 tests total). Confirmed RED before implementation existed (import-resolution failure).
- [x] 1.5 [GREEN] Implemented 1.3 to pass 1.4 — all 16 tests green.
- [x] 1.6 Edge-purity regression guard: `attribution.purity.test.ts` — static-source regex assertions that `attribution.ts` never imports `node:crypto`/bare `crypto`/`require("crypto")`, `@/lib/prisma`, or `next-auth`/`next/headers`. 3 tests, green.
- [x] 1.7 Added `getReferralClaim(userId)` (Node, private helper in `auth.ts`, mirrors ADR-6 snippet) + wired into `jwt()`'s `user`-present branch. Slug emitted only if referrer `isActive` + has `TRIPPER` role.
- [x] 1.8 [RED/GREEN, mocked prisma] `getReferralClaim` behavior covered by `auth.jwt.test.ts` ("referredByTripperSlug claim" describe block, 4 tests): active tripper -> slug; deactivated referrer -> null; demoted (non-TRIPPER) referrer -> null; no referrer -> null.
- [x] 1.9 Wired `ATTRIBUTION_ENABLED`: `isAttributionEnabled()` primitive added to `attribution.ts` (tested, 2 tests) + documented in `env.example` with the "off = never write/trust the cookie, base RandomTrip catalog only" contract. Scope note: the actual gating call-sites (proxy.ts cookie-write skip, Node read-site fallback) do not exist yet — that's PR2/PR3 scope, consuming `isAttributionEnabled()` at their respective gate points.

## Phase 2: Server Wiring + APIs — COMPLETE (11/11, PR2, branch `feature/tripper-attribution-pr2-server-wiring`)

- [x] 2.1 Create `src/lib/tripper/attribution-server.ts`: `readAttributionSlug`, `resolveLiveAttribution` (-> `getTripperJourneyContext`), `resolveReferrerId`, `stampReferral` (write-once + self-referral no-op, `updateMany`).
- [x] 2.2 [RED/GREEN, mocked prisma] `stampReferral`: no-op if already set, no-op if `referrerId===userId`. `resolveReferrerId`: inactive/non-tripper/missing->null. Covered by `src/lib/tripper/__tests__/attribution-server.test.ts` (7 tests).
- [x] 2.3 Modify `src/proxy.ts`: after i18n/canon, `getToken()` + read `?tripper=`/`/trippers/[slug]` + verify cookie -> `resolveAttribution()` -> Set-Cookie `grt_tripper`; gate under `ATTRIBUTION_ENABLED`. Applied uniformly to whichever response (i18n redirect / canon redirect / next()) is returned, not just the pass-through case.
- [x] 2.4 Manual-verification only (no middleware harness exists, none built): QA steps documented in `apply-progress.md` PR2 section for all 5 precedence rows.
- [x] 2.5 Create `src/app/api/trippers/active/route.ts`: GET -> `{trippers, current}` (`current` from httpOnly cookie, server-side, only surfaced if it still matches an active tripper in the same response).
- [x] 2.6 [Route test] `/api/trippers/active` happy path + empty list + stale-cookie-not-in-list case. `src/app/api/trippers/active/__tests__/route.test.ts` (3 tests).
- [x] 2.7 Modify `src/app/api/auth/register/route.ts`: accept `referredByTripperSlug` (`undefined`->cookie fallback, `null`->None), validate ACTIVE tripper via `resolveReferrerId`, call `stampReferral`.
- [x] 2.8 [Route test] register: valid/inactive/None/omitted-cookie-fallback/self-referral cases. Extended `src/app/api/auth/register/__tests__/route.test.ts` (+5 tests, 12 total).
- [x] 2.9 Create `src/app/api/attribution/mode/route.ts`: POST toggles cookie only, never touches `referredByTripperId` (no Prisma import in the file at all).
- [x] 2.10 [Route test] mode route cookie-only behavior. `src/app/api/attribution/mode/__tests__/route.test.ts` (4 tests).
- [x] 2.11 Modify `AuthModal.tsx`: register `<select>` via `FormSelectField` (reuse, no hand-roll), fetch `/api/trippers/active`, `""`->`null` sentinel. New `auth.referredByLabel`/`auth.referredByNoneOption` dictionary keys added to both `es.json`/`en.json` + `dictionary.ts`.

## Phase 3: Carousel + Page Wiring + Banner — NOT STARTED (separate PR, PR3)

- [ ] 3.1 Modify `src/lib/utils/traveler-card.ts`: `filterCarouselCards` returns flagged cards (`availableFromTripper`), never drops.
- [ ] 3.2 Add `CarouselCard` interface to `src/types/tripper.ts` (not local to component).
- [ ] 3.3 [RED/GREEN unit] `filterCarouselCards`: non-tripper all-true; tripper+empty types all-false; mixed flags.
- [ ] 3.4 Modify `TravelerTypesCarousel.tsx`: per-card href (comingSoon/available+slug/available/unavailable->`catalog=randomtrip`), fallback label, suppress badge; remove early-return/hide guards.
- [ ] 3.5 Modify `by-type/[type]/page.tsx`: read attribution (respect `catalog=randomtrip`), resolve via `getTripperJourneyContext`, pass `priceOverrides`.
- [ ] 3.6 Modify `journey/page.tsx`: resolve attribution server-side, pass `tripperState` prop.
- [ ] 3.7 Modify `JourneyPageClient.tsx`: delete `useEffect` fetch (:144-173) + `tripperState` state (:101-103).
- [ ] 3.8 Move `TripperContextState` type to `src/types/tripper.ts`.
- [ ] 3.9 Create `AttributionModeBanner.tsx` (server component, reads cookie vs displayed mode, posts to mode route); mount in `layout.tsx` inside `GateAwareChrome`.
- [ ] 3.10 Add all new copy (register picker/None, fallback CTA, banner) to `es.json`+`en.json`+`dictionary.ts` under `tripperAttribution`.
- [ ] 3.11 Manual: verify `jwt()` DB-dependent branches + Google-create stamp-before-jwt ordering (integration, no unit harness).
- [ ] 3.12 `npm run typecheck` + `npm run test`; confirm dictionary parity both locales.
