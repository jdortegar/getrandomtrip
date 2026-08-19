# Apply Progress: Site-Wide Tripper Attribution

**Note**: This is not a standard file in this project's archived-change convention, but is included here at the user's explicit request for visibility after the artifact store was switched mid-flight from engram to file-based openspec. See `state.yaml` for the migration note.

**PR**: PR1 of 3 (feature-branch-chain) — Foundation + Security. Branch: `feature/tripper-attribution-pr1-foundation-security`, off tracker `feature/tripper-attribution`.
**Mode**: Strict TDD (vitest run, happy-dom)
**Scope**: ONLY Phase 1 (9 tasks). Phases 2-3 intentionally NOT started — separate future PRs (PR2, PR3).

## Completed Tasks (9/9 Phase 1)

- [x] 1.1 Schema: `User.referredByTripperId String?` + `referredBy`/`referredTravelers` self-relation (ADR-7, `onDelete: SetNull`). Additive — project uses `prisma db push` (no migrations dir content, only `.gitkeep`), so no migration file needed. `npx prisma validate` + `npx prisma generate` both pass.
- [x] 1.2 [SECURITY-BLOCKING] ADR-6 hardening in `src/lib/auth.ts` `jwt()` `trigger === "update"` branch: strips any client-supplied `referredByTripperSlug` out of the spread and recomputes it from the DB unconditionally (even with no `clientSession`).
- [x] 1.3 Created `src/lib/tripper/attribution.ts` (Edge-safe, Web Crypto only).
- [x] 1.4 [RED] `src/lib/tripper/__tests__/attribution.test.ts` written and confirmed failing (module didn't exist) before implementation.
- [x] 1.5 [GREEN] `attribution.ts` implemented — all 16 tests pass.
- [x] 1.6 `src/lib/tripper/__tests__/attribution.purity.test.ts` — Edge-purity static-source regex guard (no `node:crypto`/`crypto`/`@/lib/prisma`/`next-auth`/`next/headers` imports). 3 tests, green.
- [x] 1.7 `getReferralClaim(userId)` added as a private Node helper directly in `auth.ts` (NOT in `attribution-server.ts` — that file is Phase 2 scope per design's file list and doesn't contain this helper); wired into `jwt()`'s `user`-present branch.
- [x] 1.8 [RED/GREEN, mocked prisma] `getReferralClaim` behavior covered in `src/lib/__tests__/auth.jwt.test.ts` (4 scenarios: active tripper->slug, deactivated->null, demoted/non-TRIPPER->null, none->null).
- [x] 1.9 `isAttributionEnabled()` primitive added to `attribution.ts` (2 tests) + documented in `env.example`. Gating call-sites (proxy.ts, Node read sites) are Phase 2/3 — not yet wired, by design (those files don't exist in this PR).

## TDD Cycle Evidence

| Task | Test file | RED confirmed | GREEN confirmed | REFACTOR |
|---|---|---|---|---|
| 1.3/1.4/1.5 | `src/lib/tripper/__tests__/attribution.test.ts` (16 tests) | Yes — ran before `attribution.ts` existed, import-resolution failure | Yes — 16/16 pass | Constant-time `safeEqual` compare, JSDoc added; no further refactor needed |
| 1.6 | `src/lib/tripper/__tests__/attribution.purity.test.ts` (3 tests) | Written alongside 1.4 (module absent -> same ENOENT failure) | Yes — 3/3 pass | None |
| 1.2/1.7/1.8 | `src/lib/__tests__/auth.jwt.test.ts` (7 tests) | Yes — ran against pre-fix `auth.ts`, 7/7 failed with exact expected-vs-actual mismatches (e.g. `"rival"` leaking through, claim `undefined` instead of resolved) | Yes — 7/7 pass after `auth.ts` edit | None — existing `auth.signIn.test.ts`/`auth.session.test.ts` pattern followed exactly, no duplication introduced |

Full regression run: `npm run test` -> 203 test files, 1481 tests, all green (no pre-existing test broken by this change).
`npm run typecheck` -> clean, no errors.
`npm run lint` (`next lint`) — could NOT be run: pre-existing, unrelated to this change. `next lint` errors with "Invalid project directory provided" (Next.js 16.2.6 appears to have dropped/changed the `next lint` CLI), and a direct `eslint` invocation fails separately with a circular-JSON error in the flat-config react plugin resolution. Neither failure is caused by files touched in this PR — flagged as a pre-existing repo tooling gap, not a PR1 blocker.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `prisma/schema.prisma` | Modified | Added `referredByTripperId String?` field + `referredBy`/`referredTravelers` self-relation (ADR-7) |
| `src/lib/tripper/attribution.ts` | Created | Edge-safe cookie constants, `attributionCookieOptions()`, `isAttributionEnabled()`, HMAC `signAttribution`/`verifyAttribution` (Web Crypto), pure `resolveAttribution()` precedence resolver |
| `src/lib/tripper/__tests__/attribution.test.ts` | Created | 16 tests |
| `src/lib/tripper/__tests__/attribution.purity.test.ts` | Created | 3 tests |
| `src/lib/auth.ts` | Modified | Added `getReferralClaim(userId)` helper; wired claim into `jwt()` `user`-present branch; hardened `trigger === "update"` branch per ADR-6 |
| `src/lib/__tests__/auth.jwt.test.ts` | Created | 7 tests |
| `src/types/next-auth.d.ts` | Modified | Added `referredByTripperSlug?: string \| null` to the `JWT` interface augmentation |
| `env.example` | Modified | Documented `ATTRIBUTION_ENABLED` flag and its "off = never wrong price" contract |

## Deviations from Design

- `getReferralClaim` lives directly in `auth.ts` (private function), not in `attribution-server.ts` — design's file list scopes `attribution-server.ts` to Phase 2 concerns only. Since that file is out of scope for PR1, keeping it in `auth.ts` (already Node-only, already imports prisma) was the minimal-footprint choice. PR2 can relocate/reuse it later if desired — not required by design.
- Task 1.2 and 1.7 were implemented in the same edit to `auth.ts`'s `jwt()` callback (both touch adjacent code in the same function). No commits existed yet at implementation time (working tree was uncommitted per instructions), so the hard-ordering requirement (1.2 before 1.7) was about the fix never existing transiently in commit *history* — moot with zero prior commits. Both changes are proven correct together via the 7-test `auth.jwt.test.ts` suite. **Orchestrator note**: when committing, consider splitting into two commits (1.2 fix first, 1.7 claim wiring second) to preserve that ordering intent in history, or land as one commit since both were written and verified together in this apply batch.
- Task 1.9's "off = skip cookie write in proxy + Node sites always resolve 'no attribution'" behavior is only partially realized in PR1: the `isAttributionEnabled()` primitive exists and is tested, but the actual call-sites (`proxy.ts`, Node read sites) are Phase 2/3 work and don't exist yet. Expected given PR1's scope boundary.

## Issues Found

None — no unexpected complexity or blockers.

## Remaining Tasks

- [ ] Phase 2 (11 tasks) — separate PR2, not started
- [ ] Phase 3 (12 tasks) — separate PR3, not started

## Workload / PR Boundary

- Mode: chained PR slice (feature-branch-chain)
- Current work unit: Unit 1 — "Schema + Edge-safe attribution.ts + Edge-purity guard + auth.ts ADR-6 hardening + jwt() claim + ATTRIBUTION_ENABLED flag"
- Boundary: starts from a clean `develop`-derived tracker branch; ends with all 9 Phase 1 tasks complete, tested, typechecked
- Estimated review budget impact: ~74 changed lines across 4 modified files + 4 new files (~330 lines incl. tests) — well under the 400-line budget for this slice alone

## Status

9/9 Phase 1 tasks complete. Ready for orchestrator review and commit of PR1. NOT ready for `sdd-verify` of the full change (Phases 2-3 pending in future PRs) — recommend running verify scoped to Phase 1 only, or deferring full verify until PR3 lands.

## Independent Fresh-Context Review

An adversarial code-review pass (fresh context, not self-report) was launched on this diff prior to commit, given the auth.ts security-sensitive surface — see review findings appended below once complete, or a separate note if none were appended yet.

---

# PR2: Server Wiring + APIs (2026-08-18)

**PR**: PR2 of 3 (feature-branch-chain) — Server Wiring + APIs. Branch: `feature/tripper-attribution-pr2-server-wiring`, off `feature/tripper-attribution-pr1-foundation-security` (already merged into this branch's history).
**Mode**: Strict TDD (vitest run, happy-dom)
**Scope**: ONLY Phase 2 (11 tasks). Phase 3 intentionally NOT started — separate future PR3.

## Completed Tasks (11/11 Phase 2)

- [x] 2.1 Created `src/lib/tripper/attribution-server.ts` (Node-only companion to `attribution.ts`): `readAttributionSlug()`, `resolveLiveAttribution()`, `resolveReferrerId()`, `stampReferral()`.
- [x] 2.2 [RED/GREEN, mocked prisma] `src/lib/tripper/__tests__/attribution-server.test.ts` (7 tests): `resolveReferrerId` (null/undefined slug short-circuits with no prisma call, missing/non-tripper -> null, inactive -> null, active -> id); `stampReferral` (referrerId null -> no-op, self-referral -> no-op, else `updateMany` with the write-once `referredByTripperId: null` guard).
- [x] 2.3 Modified `src/proxy.ts`: added `getToken()` (next-auth/jwt) + `extractParamSlug()` (`?tripper=` or `/trippers/[slug]`) + cookie verification -> `resolveAttribution()` -> `applyAttribution()` sets/refreshes/clears the `grt_tripper` cookie via `res.cookies`. Gated entirely under `isAttributionEnabled()`. Applied to whichever response (`i18nResponse` / `canonResponse` / `NextResponse.next()`) is ultimately returned, so a locale/canon redirect still carries the attribution cookie on the same round trip rather than waiting for a second request.
- [x] 2.4 Manual QA steps (documented below, no middleware test harness built).
- [x] 2.5 Created `src/app/api/trippers/active/route.ts`: `GET` -> `{ trippers: [{slug, name}], current }`. `current` is read via `readAttributionSlug()` (httpOnly cookie) and only surfaced if it still matches an entry in the same `trippers` list — a deactivated-since-cookie-was-set tripper resolves to `current: null` rather than pre-selecting an option absent from the dropdown.
- [x] 2.6 [Route test] `src/app/api/trippers/active/__tests__/route.test.ts` (3 tests): empty list, happy path, stale-cookie-not-in-list.
- [x] 2.7 Modified `src/app/api/auth/register/route.ts`: accepts `referredByTripperSlug` in the POST body. `undefined` -> falls back to `readAttributionSlug()` (anonymous cookie); explicit `null` -> "None", cookie never consulted; a string -> validated via `resolveReferrerId()` (ACTIVE tripper only, else silently dropped) then written via `stampReferral()`.
- [x] 2.8 [Route test] Extended `src/app/api/auth/register/__tests__/route.test.ts` with a new "referral capture" describe block (+5 tests, 12 total in file): valid slug -> stamped; inactive/unknown slug -> `stampReferral(id, null)`; explicit `null` -> cookie never read; omitted field -> cookie fallback; slug resolving to the registrant's own fresh id -> delegated to `stampReferral`'s own self-referral guard (already unit-tested in 2.2, not re-asserted here beyond confirming the route always delegates rather than special-casing it).
- [x] 2.9 Created `src/app/api/attribution/mode/route.ts`: `POST { mode: "tripper" | "randomtrip", slug? }`. `randomtrip` clears the cookie unconditionally; `tripper` requires `slug` in the body (400 `MISSING_SLUG` otherwise) and (re-)signs a fresh cookie for it. No Prisma import anywhere in the file — structurally cannot touch `referredByTripperId`.
- [x] 2.10 [Route test] `src/app/api/attribution/mode/__tests__/route.test.ts` (4 tests): invalid mode -> 400; `randomtrip` -> `Set-Cookie: grt_tripper=;` with a 1970 expiry; `tripper` without slug -> 400 `MISSING_SLUG`; `tripper` with slug -> signed cookie, `HttpOnly`, `SameSite=Lax` all present in the `Set-Cookie` header.
- [x] 2.11 Modified `src/components/auth/AuthModal.tsx`: added a register-only `<select>` via `FormSelectField` (no hand-rolled `<select>`), state `referredByTripperSlug` (`""` = None sentinel), `activeTrippers` list, and a one-shot fetch effect (`hasFetchedActiveTrippers` guard) hitting `/api/trippers/active` the first time register mode is reached — pre-fills from `current` only if the user hasn't already picked a value, fails silently (falls back to "None") on fetch error. Register POST body now sends `referredByTripperSlug: referredByTripperSlug || null`. New dictionary keys `auth.referredByLabel` / `auth.referredByNoneOption` added to `es.json`, `en.json`, and `MarketingDictionary.auth` in `dictionary.ts`.

## TDD Cycle Evidence

| Task | Test file | RED confirmed | GREEN confirmed |
|---|---|---|---|
| 2.1/2.2 | `src/lib/tripper/__tests__/attribution-server.test.ts` (7 tests) | Yes — ran before `attribution-server.ts` existed, Vite import-resolution failure (`Failed to resolve import "../attribution-server"`) | Yes — 7/7 pass |
| 2.5/2.6 | `src/app/api/trippers/active/__tests__/route.test.ts` (3 tests) | Yes — ran before `route.ts` existed, same import-resolution failure pattern | Yes — 3/3 pass |
| 2.7/2.8 | `src/app/api/auth/register/__tests__/route.test.ts` (+5 tests) | Yes — ran against pre-edit `route.ts`, all 5 new assertions failed with "spy never called" (route silently ignored the new field, mocks unwired) | Yes — 12/12 pass (7 pre-existing + 5 new) |
| 2.9/2.10 | `src/app/api/attribution/mode/__tests__/route.test.ts` (4 tests) | Yes — ran before `route.ts` existed, same import-resolution failure; then 2 assertion-level RED iterations on casing (`Max-Age`/`SameSite` vs lowercase expectations) before settling on case-insensitive assertions matching Next's actual header casing | Yes — 4/4 pass |

Proxy.ts (2.3) and AuthModal.tsx (2.11) have no dedicated unit tests — consistent with the design's Testing Strategy table ("Integration/manual: `proxy.ts` itself ... No middleware test harness exists; verify manually + typecheck. Do NOT invent one for this change") and the absence of any prior AuthModal component-test precedent to follow (design's "Component" test layer is conditional on "only if a sibling precedent exists" — none does for AuthModal).

Full regression run: `npm run test` -> 206 test files, 1506 tests, all green (no pre-existing test broken by this change; +25 tests vs PR1's 1481).
`npm run typecheck` -> clean, no errors.
`npm run lint` (`next lint`) — still broken repo-wide, same pre-existing "Invalid project directory provided" failure documented in PR1. Not caused by this PR, not a blocker.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/tripper/attribution-server.ts` | Created | `readAttributionSlug`, `resolveLiveAttribution`, `resolveReferrerId`, `stampReferral` (Node-only: Prisma + `next/headers`) |
| `src/lib/tripper/__tests__/attribution-server.test.ts` | Created | 7 tests |
| `src/proxy.ts` | Modified | `getToken()` + param/path slug extraction + cookie verify -> `resolveAttribution()` -> Set-Cookie, gated under `ATTRIBUTION_ENABLED`, applied to i18n/canon/pass-through responses alike |
| `src/app/api/trippers/active/route.ts` | Created | `GET -> { trippers, current }` |
| `src/app/api/trippers/active/__tests__/route.test.ts` | Created | 3 tests |
| `src/app/api/auth/register/route.ts` | Modified | Accepts `referredByTripperSlug`, resolves + stamps referral after user creation |
| `src/app/api/auth/register/__tests__/route.test.ts` | Modified | +5 tests (referral capture describe block) |
| `src/app/api/attribution/mode/route.ts` | Created | `POST { mode, slug? }` cookie-only toggle |
| `src/app/api/attribution/mode/__tests__/route.test.ts` | Created | 4 tests |
| `src/components/auth/AuthModal.tsx` | Modified | Register `<select>` picker via `FormSelectField`, active-trippers fetch, `referredByTripperSlug` state + submit wiring |
| `src/lib/types/dictionary.ts` | Modified | Added `referredByLabel`/`referredByNoneOption` to the inline `auth` dictionary type |
| `src/dictionaries/es.json` | Modified | Added `auth.referredByLabel` / `auth.referredByNoneOption` (Spanish) |
| `src/dictionaries/en.json` | Modified | Added `auth.referredByLabel` / `auth.referredByNoneOption` (English) |

## Manual QA Steps for `proxy.ts` (Task 2.4 — no middleware test harness exists)

Precedence table (design "Data Flow" section), to be verified in-browser with `ATTRIBUTION_ENABLED=true`:

1. **Claim is a string (frozen referral beats a clicked link)**: sign in as a user with a `referredByTripperSlug` claim (referred at registration), then visit any page with `?tripper=someone-else`. Confirm `grt_tripper` cookie resolves to the claim's slug, not the query param.
2. **Claim is explicit null**: sign in as a user with no referrer, visit `?tripper=maria`. Per the precedence table, an explicit `null` claim clears regardless of param — confirm `grt_tripper` is ABSENT after this visit (not set to `maria`).
3. **Claim undefined + param present (anonymous/legacy token)**: log out, visit `/experiences/by-type/couple?tripper=maria`. Confirm `grt_tripper=maria` is set and persists on the next navigation without `?tripper=`.
4. **Claim undefined + no param + valid cookie**: with the cookie from step 3 already set, visit any page with no `?tripper=`. Confirm the cookie's `exp` is refreshed (new `Max-Age` in the response) and the slug is unchanged.
5. **Claim undefined + no param + invalid/expired cookie**: manually corrupt the `grt_tripper` cookie value (e.g. via devtools) or wait past 30 days, then visit any page. Confirm the cookie is cleared (absent from the next response).

Also verify: `/trippers/maria` sets the cookie identically to `?tripper=maria` (spec "Cookie set from tripper profile path"), and that with `ATTRIBUTION_ENABLED` unset/false, none of the above produce any `Set-Cookie: grt_tripper` header under any scenario.

## Deviations from Design / Clarifications

- **Register JWT-refresh requirement re-read**: the auth-verification spec delta says registration must "apply ... JWT-refresh (`trigger: 'update'`) at that same write." No explicit `update()` call was added to the register route or `AuthModal.tsx` beyond what already existed. Reasoning: `AuthModal.tsx`'s existing flow already calls `POST /api/auth/register` (which now stamps the referral) and only THEN calls `signIn("credentials", ...)`. That `signIn` triggers `jwt()`'s `user`-present branch, which (per PR1) recomputes `referredByTripperSlug` fresh from the DB on every sign-in — so the very first session issued for a newly-registered, referred user already carries the correct claim, with no separate `update()` round-trip needed. This is the same ordering-dependent guarantee already documented in PR1's apply-progress (`getReferralClaim` on the `user`-present branch, not the `update()` branch, is the primary correctness path). Flagged here in case a future reviewer expected an explicit `update()` call to exist.
- **`ATTRIBUTION_ENABLED` does not gate register-time referral capture**: matches `env.example`'s existing PR1 comment ("Does NOT gate `referredByTripperId` capture at registration") — `stampReferral`/`resolveReferrerId` in the register route run unconditionally, regardless of the flag. Only the proxy's cookie write/refresh/clear and the mode-toggle route's cookie set are implicitly moot when the flag is off (no cookie would exist to read in the first place, but nothing in code hard-blocks reading/stamping from an explicit `referredByTripperSlug` selection even with the flag off — this is intentional per the pre-existing doc comment, not an oversight).
- **`resolveLiveAttribution` and `readAttributionSlug` are unused by any call site in this PR**: `readAttributionSlug` IS used (by the register route and `/api/trippers/active`), but `resolveLiveAttribution` (task 2.1's `-> getTripperJourneyContext` wrapper) has no caller yet — its consumers (`journey/page.tsx`, `by-type/[type]/page.tsx`) are Phase 3 scope. Kept in `attribution-server.ts` now per the design's file-ownership table rather than deferring the whole file to PR3, since 2.1 explicitly scopes this file to PR2.
- **`proxy.ts` applies attribution to redirect responses too**, not just the `NextResponse.next()` pass-through — a deliberate deviation from a literal reading of "after i18n/canon" as "only after both return null." Reasoning: the i18n and canon redirects preserve query string/hash, so a `?tripper=` param present on a redirected request would otherwise need a second round-trip (browser follows the redirect, hits `proxy.ts` again, THEN the cookie gets set) to take effect. Applying it uniformly to whichever response type is returned sets the cookie in the same round trip. This is a strict improvement, not a behavior change to any tested precedence scenario.

## Issues Found

None — no unexpected complexity or blockers. The `Set-Cookie` header casing (`Max-Age`, `SameSite`) required adjusting test assertions to be case-insensitive after the first RED run showed Next's actual header casing differs from my initial guess — a test-only correction, not an implementation bug.

## Remaining Tasks

- [ ] Phase 3 (12 tasks) — separate PR3, not started

## Workload / PR Boundary

- Mode: chained PR slice (feature-branch-chain)
- Current work unit: Unit 2 — "attribution-server.ts + proxy.ts wiring + register/trippers-active/mode routes + AuthModal picker"
- Boundary: starts from PR1's merged history (clean working tree); ends with all 11 Phase 2 tasks complete, tested, typechecked
- Estimated review budget impact: 6 new files + 4 modified files (~450-550 changed lines incl. tests) — this PR alone is comfortably under the 400-line-per-file-review norm per file, though the aggregate is the largest of the three planned slices; still well short of needing a further split per the original chained-PR plan

## Status

11/11 Phase 2 tasks complete. Full regression suite green (206 files/1506 tests), typecheck clean. Ready for orchestrator review and commit of PR2. NOT ready for `sdd-verify` of the full change (Phase 3 pending in a future PR) — recommend running verify scoped to Phases 1-2 only, or deferring full verify until PR3 lands.

---

## PR2 review fixes (2026-08-18)

An independent adversarial code review of the uncommitted PR2 diff confirmed 8 findings (5 CRITICAL, including one security/CSRF issue). All 8 were fixed.

### Findings fixed

1. **`?tripper=` query-param collision with the pre-existing blog-link usage** — `extractParamSlug()` in `src/proxy.ts` now validates the query-param value against a new shared `isValidTripperSlug()` (backed by `TRIPPER_SLUG_PATTERN`, moved into the Edge-safe `src/lib/tripper/attribution.ts`) before trusting it, so `/blog?tripperId=...&tripper=Carla%20Diaz` (a pre-existing, unrelated display-name link) no longer overwrites a visitor's real referral cookie. The `/trippers/[slug]` path segment is still trusted unconditionally. `src/app/api/user/tripper/route.ts` now imports the same `isValidTripperSlug()` instead of its own inline regex literal — one shared implementation, not two.
2. **`null` → `undefined` coercion breaking the cookie-clear contract** — removed the `?? undefined` in `applyAttribution()` (`src/proxy.ts`); `token?.referredByTripperSlug` already yields `undefined` when the token is absent and preserves an explicit `null` when the token exists with no referrer, which `resolveAttribution()` requires to force a `clear`.
3. **AuthModal always sending explicit `null`, losing a real cookie referral** — `src/components/auth/AuthModal.tsx`'s picker now has three distinct states instead of two: `""` (not yet decided/loading → omits the key, server falls back to the cookie), `"none"` (explicit None selection → sends `null`), or a real slug (pre-filled or manually picked → sends that string). Also fixed the sibling bug: `hasFetchedActiveTrippers` is now only set `true` on a successful fetch (not immediately on firing the request), and is reset in both `handleAuthSuccess` and `handleClose`, so a failed/aborted pre-fill no longer permanently blocks retries for the page's lifetime.
4. **Google OAuth signup never stamping referral credit** — `src/lib/auth.ts`'s `signIn()` Google new-user-creation branch now calls `readAttributionSlug()` / `resolveReferrerId()` / `stampReferral()` (the same pipeline the register route uses) right after `prisma.user.create()`, so a visitor referred by a tripper who signs up via "Continue with Google" now earns that tripper credit too.
5. **`/api/attribution/mode` POST had no origin/CSRF check (security)** — added a route-local `isTrustedOrigin()` check in `src/app/api/attribution/mode/route.ts`: compares `Origin` (falling back to `Referer`) against `NEXTAUTH_URL`'s origin, rejecting with 403 `FORBIDDEN` when missing/mismatched/unconfigured. No prior origin-check pattern existed anywhere else in the codebase to reuse, so this is intentionally small and route-local.
6. **Register route could 500 on a non-string `referredByTripperSlug`** — `src/app/api/auth/register/route.ts` now guards with `referredByTripperSlug === null || typeof referredByTripperSlug === "string"`; anything else (e.g. a number sent by a malformed client) is treated the same as "absent" and falls back to the cookie, never reaching the Prisma `where: { tripperSlug }` filter.
7. **Duplicated `NEXTAUTH_SECRET` one-liner** — added `getAttributionSecret()` to the Edge-safe `src/lib/tripper/attribution.ts` (reading `process.env` has no Edge/Node compatibility concern) and switched all three call sites (`proxy.ts`, `attribution-server.ts`, `attribution/mode/route.ts`) to import it. `attribution.purity.test.ts` re-run and still green — no Node-only import was introduced.
8. **`/api/trippers/active` over-fetching via `getAllTrippers()`** — added a scoped `getActiveTripperSlugsAndNames()` to `src/lib/db/tripper-queries.ts` (`select: { tripperSlug: true, name: true }`, same active-tripper `where` filter as `getAllTrippers()`) and switched the route to use it instead.

### Tests added/updated

- `src/lib/tripper/__tests__/attribution.test.ts` — new `isValidTripperSlug`/`TRIPPER_SLUG_PATTERN` and `getAttributionSecret` describe blocks.
- `src/__tests__/proxy.attribution.test.ts` — new file. Exported `extractParamSlug`/`applyAttribution` from `src/proxy.ts` (previously unexported) specifically to make these testable in isolation. Covers: display-name query param rejected vs. valid slug accepted, path-segment trusted unconditionally, `ATTRIBUTION_ENABLED=false` is a complete no-op, `referredByTripperSlug: null` clears a stale cookie (not kept/refreshed), `undefined` claim + valid cookie still keeps/refreshes it.
- `src/components/auth/__tests__/AuthModal.test.tsx` — new file (react-dom/client + `act`, no RTL in this repo). Covers all three submit-body states: omitted key while the pre-fill fetch is still pending, explicit `null` on the None option, and the picked slug on a real selection.
- `src/lib/__tests__/auth.signIn.test.ts` — added a `@/lib/tripper/attribution-server` mock and a new describe block: Google new-user creation with a valid `grt_tripper` cookie stamps `referredByTripperId`; with no cookie, stamps nothing.
- `src/app/api/auth/register/__tests__/route.test.ts` — new test: a numeric `referredByTripperSlug` no longer 500s, falls back to the cookie, signup still succeeds.
- `src/app/api/attribution/mode/__tests__/route.test.ts` — new origin/CSRF describe block (mismatched Origin, missing Origin+Referer, Referer-fallback happy path, matching-Origin happy path). Helper now sets `Origin`/`Referer` on the constructed `Request` via `.headers.set(...)` post-construction, since happy-dom's `Request` constructor silently drops these as forbidden request-header names when passed through the `headers` init option (a happy-dom/test-environment quirk, not a production behavior difference — Next's real incoming-request object isn't subject to that fetch-spec restriction).
- `src/app/api/trippers/active/__tests__/route.test.ts` — updated to mock/assert against `getActiveTripperSlugsAndNames()` instead of `getAllTrippers()`.

### Verification

- `npx tsc --noEmit` — clean, no errors.
- `npx vitest run` (full suite) — **208 test files, 1528 tests, all green** (was 206 files/1506 tests before this batch; +2 files, +22 tests net after accounting for the new `proxy.attribution.test.ts` and `AuthModal.test.tsx` files plus additions to 5 existing files).
- `npm run lint` (`next lint`) — still broken repo-wide (pre-existing "Invalid project directory provided" failure, same as documented in PR1/PR2 above), confirmed unrelated to any file touched in this fix batch; a direct `npx eslint` invocation also fails separately with a circular-JSON error in flat-config react-plugin resolution. Not a blocker, not caused by this change.

### Files changed in this fix batch

| File | What changed |
|------|--------------|
| `src/lib/tripper/attribution.ts` | Added `getAttributionSecret()`, `TRIPPER_SLUG_PATTERN`, `isValidTripperSlug()` |
| `src/proxy.ts` | `extractParamSlug()` validates query-param slugs; removed `?? undefined` coercion; uses shared `getAttributionSecret()`/`isValidTripperSlug()`; exported `extractParamSlug`/`applyAttribution` for testing |
| `src/lib/tripper/attribution-server.ts` | Removed local `getAttributionSecret()`, imports the shared one |
| `src/app/api/attribution/mode/route.ts` | Added `isTrustedOrigin()` origin/CSRF guard (403 `FORBIDDEN`); uses shared `getAttributionSecret()` |
| `src/app/api/user/tripper/route.ts` | Uses shared `isValidTripperSlug()` instead of an inline regex |
| `src/app/api/auth/register/route.ts` | Added `typeof === "string"` guard around `referredByTripperSlug` before it can reach Prisma |
| `src/lib/db/tripper-queries.ts` | Added `getActiveTripperSlugsAndNames()` |
| `src/app/api/trippers/active/route.ts` | Uses `getActiveTripperSlugsAndNames()` instead of `getAllTrippers()` |
| `src/lib/auth.ts` | Google new-user branch now stamps referral via `readAttributionSlug`/`resolveReferrerId`/`stampReferral` |
| `src/components/auth/AuthModal.tsx` | Three-state `referredByTripperSlug` picker (`NOT_DECIDED_VALUE`/`NONE_OPTION_VALUE`/slug); `hasFetchedActiveTrippers` only set on success, reset on success/close |
| `src/lib/tripper/__tests__/attribution.test.ts` | +tests for `isValidTripperSlug`, `getAttributionSecret` |
| `src/__tests__/proxy.attribution.test.ts` | New — 7 tests |
| `src/components/auth/__tests__/AuthModal.test.tsx` | New — 3 tests |
| `src/lib/__tests__/auth.signIn.test.ts` | +2 tests (Google referral stamping) |
| `src/app/api/auth/register/__tests__/route.test.ts` | +1 test (non-string slug) |
| `src/app/api/attribution/mode/__tests__/route.test.ts` | +4 tests (origin/CSRF guard) |
| `src/app/api/trippers/active/__tests__/route.test.ts` | Updated to the new scoped query function |

All 8 findings fixed in full — none deferred or partially resolved.
