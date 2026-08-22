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

---

# PR3: Carousel + Page Wiring + Banner (2026-08-18)

**PR**: PR3 of 3 (feature-branch-chain) — Carousel + Page Wiring + Banner. Branch: `feature/tripper-attribution-pr3-carousel-ui`, off `feature/tripper-attribution-pr2-server-wiring` (already merged into this branch's history — PR1's and PR2's code, including the PR2 review-fix batch, is all already present).
**Mode**: Strict TDD (vitest run, happy-dom)
**Scope**: ONLY Phase 3 (12 tasks) — the final phase. Phases 1-2 were done in PR1/PR2.

## Completed Tasks (12/12 Phase 3)

- [x] 3.1/3.2/3.3 `src/lib/utils/traveler-card.ts`: `filterCarouselCards` rewritten to flag every card with `availableFromTripper` instead of dropping non-offered types — non-tripper context flags everything `true` (identity-preserving), tripper context flags per-card from `availableTypes` (empty/missing -> everything `false`, list never shrinks). `CarouselCard` interface added to `src/types/tripper.ts` (imports `TravelerTypeCardData` from `traveler-card.ts` and extends it) per the task's explicit instruction, not left local to the component. Also added a new pure `resolveCarouselCardHref(slug, options)` helper (not itemized as its own task, but needed for the href logic in 3.4) implementing design ADR-8's 4-row href table, deliberately extracted as a pure function so it's unit-testable without mounting the Embla/framer-motion carousel. `src/lib/utils/__tests__/traveler-card.test.ts` (new, 10 tests) covers both.
- [x] 3.4 `TravelerTypesCarousel.tsx`: per-card `href` now goes through `resolveCarouselCardHref`; unavailable-in-tripper-context cards render `dict.tripperAttribution.visitRandomTripExperiences` in place of their normal subtitle (the card's `description` slot — `TravelerTypeCard` has no separate CTA-label slot, so the fallback message replaces the description, title/image stay as-is) and suppress `tripperBadge`; removed the `if (tripperContext && typesToShow.length === 0) return null` early-return entirely — the carousel now always renders a full row when there are cards to show.
- [x] 3.5 `src/app/[locale]/experiences/by-type/[type]/page.tsx`: added `searchParams: Promise<{ catalog?: string }>` to the page signature; `?catalog=randomtrip` short-circuits to `null` before `readAttributionSlug()` even runs (read by the page, never touches the cookie); resolves via `resolveLiveAttribution()` (attribution-server.ts's existing not_found/inactive->null, ok->context wrapper, reused instead of re-inlining the same switch design's pseudocode showed inline); `priceOverrides` passed to `getPlannerContentForType` only when `typeData.meta.slug` is in `tripperContext.allowedTypes`, else `null` (base catalog pricing).
- [x] 3.6/3.7/3.8 `journey/page.tsx` is now `async`: resolves `tripperSlug` via `readAttributionSlug()` and a full `TripperContextState` via a small `resolveTripperState()` helper that calls `getTripperJourneyContext()` directly (not `resolveLiveAttribution()` — that would collapse `not_found` and `inactive` into the same `null`, losing the "unavailable" branch `JourneyPageClient` needs for `TripperUnavailableNotice`). Both are passed as props into `JourneyPageClient`, which forwards them into `JourneyPageContent`. Deleted the old `useEffect` that fetched `/api/trippers/{slug}/journey-context` client-side off `searchParams.get("tripper")`, and the local `tripperState` `useState` + the local `TripperJourneyContext`/`TripperContextState` type definitions (moved to `src/types/tripper.ts`, task 3.8). The one spot that read `searchParams.get("tripper")` for the checkout-payload/price-summary wiring (`tripperSlug` passed to `JourneyMainContent`) now uses the new `tripperSlug` prop instead — the raw query param is no longer trusted anywhere in this file, consistent with "the cookie/proxy handles it".
- [x] 3.9 Created `src/components/tripper/AttributionModeBanner.tsx` (async server component — `readAttributionSlug()` then `resolveLiveAttribution()`; renders `null` outright when there's no live, active attribution to show) and a sibling `AttributionModeBannerToggle.tsx` (client component owning the interactive toggle: keeps `tripperSlug`/`tripperName` and a local `mode` state in memory so a "switch to RandomTrip" toggle — which fully clears the `grt_tripper` cookie via `POST /api/attribution/mode { mode: "randomtrip" }` — can still be reversed via a "switch back" toggle that re-signs the cookie with the remembered slug, mirroring the mode route's own comment about the banner keeping the slug client-side). Mounted in `src/app/[locale]/layout.tsx` as a `banner` prop passed into `GateAwareChrome` (`GateAwareChrome` gained a new optional `banner?: React.ReactNode` prop), rendered in `normalChrome` right after `<Navbar>` and before `<main>` — not shown on the pre-gate waitlist view or gate-exempt routes.
- [x] 3.10 Added a new `tripperAttribution` top-level dictionary section (`visitRandomTripExperiences`, `bannerTripperModeMessage`, `bannerRandomtripModeMessage`, `bannerSwitchToRandomtrip`, `bannerSwitchToTripper`) to both `es.json`/`en.json` plus a new `TripperAttributionDict` interface in `dictionary.ts`, referenced from `MarketingDictionary`. The two `{name}`-placeholder strings follow the codebase's established `copy.field.replace("{name}", value)` convention (confirmed against `BlogIndex.tsx`/`TripperUnavailableNotice.tsx`, not invented fresh).
- [x] 3.11 No new code — `jwt()`'s DB-dependent claim branches and the Google-create stamp-before-jwt ordering were already implemented and unit-tested in PR1 (`auth.jwt.test.ts`) and PR2 (`auth.signIn.test.ts`'s Google-referral-stamping describe block from the PR2 review-fix batch) respectively. PR3 makes zero changes to `auth.ts`; the full regression run below reconfirms both suites are still green against this diff.
- [x] 3.12 `npx tsc --noEmit` — clean. `npx vitest run` — 209 test files, 1538 tests, all green (208 files/1528 tests before this batch; +1 file/+10 tests, all from the new `traveler-card.test.ts`). Dictionary parity for the new section verified programmatically (`Object.keys(es.tripperAttribution).sort()` === `Object.keys(en.tripperAttribution).sort()`) plus a full `JSON.parse` sanity check on both dictionary files.

## TDD Cycle Evidence

| Task | Test file | RED confirmed | GREEN confirmed |
|---|---|---|---|
| 3.1/3.2/3.3 | `src/lib/utils/__tests__/traveler-card.test.ts` (10 tests) | Yes — ran against the pre-edit `filterCarouselCards` (old drop/return-`[]` behavior) and the not-yet-existing `resolveCarouselCardHref`; 9/10 failed (`resolveCarouselCardHref is not a function` on 6 assertions, `filterCarouselCards` shape/behavior mismatches on the rest) | Yes — 10/10 pass after the rewrite |

3.4/3.5/3.6/3.7/3.8/3.9/3.10 have no dedicated RED/GREEN unit cycle — consistent with the design's own Testing Strategy table and the pattern already established in PR2: 3.4/3.9's interactive surface (Embla carousel + framer-motion `motion.div`, a `POST`-driven toggle) sits in the "Integration/manual ... No middleware/component test harness exists ... verify manually + typecheck. Do NOT invent one for this change" zone the design explicitly carves out, and the design's own "Component" test layer is marked conditional ("only if a sibling precedent exists"); a precedent now exists (`AuthModal.test.tsx`, react-dom/client + `act`, from the PR2 review-fix batch), but task 3.4 itself carries no `[RED/GREEN]` tag in `tasks.md` (only 3.3 does), and embla-carousel-react depends on `ResizeObserver` (happy-dom does implement one, but mounting the full carousel+Embla+framer-motion stack to assert per-card href/label text was judged higher integration risk than test value for this batch — the actual branching logic under test is the already-covered pure `resolveCarouselCardHref`/`filterCarouselCards` functions the component merely calls). 3.5/3.6/3.7/3.8 are server-side wiring/plumbing (page-level `async` functions calling already-tested `attribution-server.ts` primitives) with no new pure logic beyond `resolveTripperState()` in `journey/page.tsx`, which is a straightforward 3-branch mapping directly mirroring `getTripperJourneyContext`'s own already-tested discriminated union (`tripper-queries.getTripperJourneyContext.test.ts`, PR1/PR2-era) — re-testing the mapping in isolation would mostly re-assert the same three branches with mocked prisma, so it was verified via the full regression suite (still green) and `tsc --noEmit` instead of a new isolated unit test. 3.10 is pure data (dictionary JSON), verified via the parity check under 3.12.

Full regression run: `npx vitest run` -> **209 test files, 1538 tests, all green** (was 208 files/1528 tests before this batch — the only delta is `+1 file`/`+10 tests` from the new `traveler-card.test.ts`; no existing test needed a behavior update **except** one pre-existing test file that needed a scope-only fix, see below).
`npx tsc --noEmit` -> clean, no errors.
`npm run lint` (`next lint`) — still broken repo-wide, same pre-existing "Invalid project directory provided" failure documented in PR1/PR2. Not caused by this PR, not a blocker.

## Incidental fix: `journey/__tests__/page.test.ts` needed a new prisma mock

`journey/page.tsx` now transitively imports `attribution-server.ts` and `tripper-queries.ts` (both prisma-touching) for the new server-side attribution resolve. `page.test.ts` only exercises the pure `getAccordionForStep` re-export and never invokes the page component, but merely *importing* the module now constructs the real `PrismaClient` at module-load time (`src/lib/prisma.ts:28`), which throws (`PrismaClientConstructorValidationError`) in this sandboxed test environment where `DATABASE_URL` is unset. Fixed by adding the same `vi.mock("@/lib/prisma", ...)` stub `attribution-server.test.ts` already uses, at the top of `page.test.ts`, before the `page` import. This is a pre-existing-test-environment side effect of the new import graph, not a logic change — `getAccordionForStep`'s own 6 test assertions are untouched and still pass.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/utils/traveler-card.ts` | Modified | `filterCarouselCards` flags instead of drops; added `resolveCarouselCardHref` |
| `src/lib/utils/__tests__/traveler-card.test.ts` | Created | 10 tests |
| `src/types/tripper.ts` | Modified | Added `CarouselCard`, `TripperJourneyContext`, `TripperContextState` |
| `src/components/landing/exploration/TravelerTypesCarousel.tsx` | Modified | Per-card href via `resolveCarouselCardHref`, fallback description, badge suppression, removed early-return |
| `src/app/[locale]/experiences/by-type/[type]/page.tsx` | Modified | Reads attribution (`catalog=randomtrip` opt-out), passes `priceOverrides` |
| `src/app/[locale]/journey/page.tsx` | Modified | Now `async`; resolves `tripperSlug`/`tripperState` server-side, passes as props |
| `src/app/[locale]/journey/JourneyPageClient.tsx` | Modified | Removed client-side fetch + local state; consumes `tripperSlug`/`tripperState` props |
| `src/app/[locale]/journey/__tests__/page.test.ts` | Modified | Added a `@/lib/prisma` mock (import-graph fix, not a behavior change) |
| `src/components/tripper/AttributionModeBanner.tsx` | Created | Server component: reads + liveness-validates attribution, renders the toggle or nothing |
| `src/components/tripper/AttributionModeBannerToggle.tsx` | Created | Client component: toggle state + `POST /api/attribution/mode` |
| `src/app/[locale]/layout.tsx` | Modified | Mounts `AttributionModeBanner`, passes it into `GateAwareChrome` as a `banner` prop |
| `src/components/waitlist/GateAwareChrome.tsx` | Modified | Added `banner?: React.ReactNode` prop, rendered in `normalChrome` |
| `src/lib/types/dictionary.ts` | Modified | Added `TripperAttributionDict` + `tripperAttribution` field on `MarketingDictionary` |
| `src/dictionaries/es.json` | Modified | Added `tripperAttribution` section (Spanish) |
| `src/dictionaries/en.json` | Modified | Added `tripperAttribution` section (English) |

## Deviations from Design / Clarifications

- **Added `resolveCarouselCardHref` as a new pure helper**, not itemized as its own task and not given an explicit signature in design's interfaces section (design only gave a prose href table under "Carousel href"). Extracted so the href-selection branching is unit-testable in isolation from the Embla/framer-motion carousel — functionally implements exactly the 4-row table in design ADR-8, nothing more.
- **`by-type/page.tsx` uses `resolveLiveAttribution()` instead of inlining `getTripperJourneyContext()` + a manual `ctx.status === "ok"` check**, unlike design's illustrative pseudocode snippet. `resolveLiveAttribution()` already existed in `attribution-server.ts` (built in PR2, unused by any caller until now) and implements exactly that not_found/inactive->null, ok->context collapse — reusing it avoids duplicating the same three-way switch in a second place.
- **`journey/page.tsx` does NOT use `resolveLiveAttribution()`** for the same reason in reverse: it collapses `not_found` and `inactive` into the same `null`, which would make it impossible to show `TripperUnavailableNotice` (a deactivated tripper) versus silently falling back to no-attribution (a never-existed slug) — the two need different UI. `journey/page.tsx` calls `getTripperJourneyContext()` directly and maps all three branches itself in a small `resolveTripperState()` helper.
- **`TripperContextState`'s `TripperJourneyContext` has no `slug` field** (matches design's literal interface shape exactly — carried over unchanged from the pre-existing local definition in `JourneyPageClient.tsx`). Since `JourneyMainContent`'s checkout-payload wiring needs the raw slug string (not just the branding/pricing context), `journey/page.tsx` passes `tripperSlug` as a **separate sibling prop** alongside `tripperState`, rather than adding a `slug` field to the shared type — keeps the design's given interface untouched while still fully retiring the query-param-reading path.
- **Unavailable-type carousel cards show the fallback text in the card's `description` slot**, not a distinct "CTA label" UI element — `TravelerTypeCard` has no separate CTA-label slot beyond title/description text and the `comingSoonLabel` overlay (which is reserved for the coming-soon state and would be visually identical/confusing if reused here). The title still shows the actual traveler-type name; only the subtitle text becomes the fallback prompt.
- **No component-mount test for `TravelerTypesCarousel` itself** (Embla + framer-motion). See "TDD Cycle Evidence" above for the full reasoning — flagged here explicitly per the "if the design is wrong or incomplete, NOTE IT — don't silently deviate" rule, even though this is a test-scope call, not a design deviation.
- **`TripperTravelerTypesSection.tsx` (the tripper-mode carousel wrapper used on tripper profile pages) is untouched.** It has its own `if (!availableTypes?.length) return null` guard, separate from the one removed from `TravelerTypesCarousel.tsx` itself — a tripper with zero `ACTIVE` experiences would still see the entire carousel *section* (including all fallback cards) disappear at that outer layer, even though `TravelerTypesCarousel` itself would now happily render a full row of fallback cards. This file is not in design's File Changes table and not in `tasks.md`'s Phase 3 list, so left out of scope per the "implement ONLY Phase 3's tasks... don't re-litigate design" instruction — flagged here as a residual gap for a future change, not fixed silently and not fixed unrequested.
- **No `banner note` added to `by-type/page.tsx` for the "type not offered" case.** Design's prose mentions "Type resolved but not offered by the tripper -> base catalog + banner note (never a 404)" but no spec Scenario names a specific in-page notice element beyond the global `AttributionModeBanner` (which already covers "you're browsing under X's referral" generally) and the carousel's own fallback card (which is the actual UI a visitor sees when a type isn't offered, since they'd typically arrive at a non-offered `by-type` page via that very fallback card). Treated "never a 404" as the binding requirement (satisfied — the page always renders, just with base pricing) rather than inventing a new UI element with no dictionary key named in any spec.

## Issues Found

One incidental pre-existing-test-environment fix required (see "Incidental fix" section above) — not a logic bug, a missing mock exposed by the new import graph. No other unexpected complexity or blockers.

## Remaining Tasks

None — all 32 tasks across all 3 phases (Phase 1: 9/9, Phase 2: 11/11, Phase 3: 12/12) are now complete across PR1/PR2/PR3.

## Workload / PR Boundary

- Mode: chained PR slice (feature-branch-chain) — final slice
- Current work unit: Unit 3 — "Carousel flagging + by-type/journey wiring + AttributionModeBanner + i18n"
- Boundary: starts from PR2's merged history (clean working tree, PR2's review-fix batch included); ends with all 12 Phase 3 tasks complete, tested, typechecked — this is the last PR in the chain, the tracker branch `feature/tripper-attribution` aggregates PR1+PR2+PR3 to `main`
- Estimated review budget impact: 4 new files + 10 modified files (~450-550 changed lines incl. the new test file and dictionary/type additions) — comparable in size to PR2, within the originally forecast per-slice range

## Status

12/12 Phase 3 tasks complete. Full regression suite green (209 files/1538 tests), typecheck clean. All 32 tasks across all 3 phases are now done. Ready for orchestrator review and commit of PR3, and for `sdd-verify` of the full change now that all three phases have landed in the working tree (uncommitted, per instructions — orchestrator to review/commit/push/open PR3 separately).

## Post-apply copy revision (same session)

Mid-turn feedback: the banner/toggle copy should never mention pricing — frame the switch purely as "tripper-curated experiences" vs. "RandomTrip's general experiences". Updated `es.json`/`en.json`'s `tripperAttribution.bannerTripperModeMessage`/`bannerRandomtripModeMessage`/`bannerSwitchToRandomtrip`/`bannerSwitchToTripper` (removed "precios"/"prices"/"catálogo estándar"/"standard catalog" wording in favor of "experiencias curadas"/"curated experiences" vs. "experiencias generales"/"general experiences"), plus the corresponding JSDoc in `dictionary.ts` and the header comment in `AttributionModeBannerToggle.tsx`. No field/key renames, no component/prop changes — copy-only. Re-verified: `npx tsc --noEmit` clean, `npx vitest run` still 209 files/1538 tests green, dictionary parity re-confirmed programmatically.

## Post-apply risk remediation (same session) — Phase 3b, tasks 3.13-3.15

Mid-turn feedback: address the three risks flagged in the PR3 return summary and formalize them into specs/tasks, not just fix silently.

1. **`TripperTravelerTypesSection.tsx`'s own hide guard** — removed `if (!availableTypes?.length) return null`. A tripper with zero `ACTIVE` experiences now still renders the section, with `TravelerTypesCarousel` underneath showing a full row of `catalog=randomtrip` fallback cards instead of the whole section vanishing. New test: `src/components/tripper/__tests__/TripperTravelerTypesSection.test.tsx` (2 tests — renders with empty `availableTypes`, renders a working attributed href for an offered type). New spec scenario in `specs/tripper/spec.md` under "Carousel Attribution-Aware Fallback Cards": "A tripper who offers nothing still shows a full fallback row, not a hidden section".
2. **No component-mount test for `TravelerTypesCarousel`** — added `src/components/landing/exploration/__tests__/TravelerTypesCarousel.test.tsx` (5 tests: offered-type href + badge, non-offered-type fallback href + no badge, empty-`availableTypes` still renders every card, non-tripper-context plain hrefs, coming-soon types never get an href). Mounted via `react-dom/client` + `act` (same pattern as `AuthModal.test.tsx`); empirically confirmed no `ResizeObserver`/Embla issues — `slidesPerView` defaults to 4 and these small fixtures keep `EmblaCarousel` in its `isStatic` branch (ref never attached, Embla's own DOM-measurement code never runs). Also extended the pre-existing `GateAwareChrome.test.tsx` (+2 tests) to cover the new `banner` prop end-to-end: renders when passed, renders nothing extra when absent.
3. **Duplicate per-request `readAttributionSlug()`/DB reads** — wrapped `getTripperJourneyContext` (`src/lib/db/tripper-queries.ts`) and `readAttributionSlug` (`src/lib/tripper/attribution-server.ts`) in `React.cache()`. Empirically verified in a standalone Node script that `cache()` outside an active Next.js request render (e.g. plain vitest tests) is a transparent no-op passthrough — always calls straight through, never throws, never returns a stale/wrong value — so no existing test needed a mock or behavior change; the memoization only takes effect inside a real Next.js request render. New spec section in `specs/tripper-attribution/spec.md`: "Cross-Cutting: Request-Scoped Attribution Reads" (SHOULD-level, performance not correctness) + a scenario. New `design.md` ADR-10 documenting the decision and the alternatives considered.

Verification after all three fixes: `npx tsc --noEmit` clean; `npx vitest run` -> **211 test files, 1547 tests, all green** (+2 files/+9 tests vs. the 209/1538 baseline right after the main PR3 batch — 2 new test files totaling 7 tests, plus 2 new tests added to the existing `GateAwareChrome.test.tsx`).

Updated artifacts: `openspec/changes/tripper-attribution/specs/tripper/spec.md`, `openspec/changes/tripper-attribution/specs/tripper-attribution/spec.md`, `openspec/changes/tripper-attribution/design.md` (ADR-10), `openspec/changes/tripper-attribution/tasks.md` (new Phase 3b, tasks 3.13-3.15).

## Tracker-branch review fixes (post-merge, on `feature/tripper-attribution`)

An independent adversarial code review against the fully-merged tracker branch (PR1+PR2+PR3) confirmed 10 findings across correctness, i18n, UX consistency, and performance. All 10 were applied in full; none were skipped or partially resolved.

1. **Case-sensitivity mismatch, carousel vs. by-type pricing gate** — `filterCarouselCards` normalized `availableTypes` with `.toLowerCase().trim()`; the by-type page's `priceOverrides` gate did a raw case-sensitive `.includes()` against the same `Experience.type` data. Extracted a single shared `isTypeOffered(allowedTypes, slug)` helper into `src/lib/utils/traveler-card.ts`, used by both `filterCarouselCards` and `src/app/[locale]/experiences/by-type/[type]/page.tsx`. Tests: `src/lib/utils/__tests__/traveler-card.test.ts` (+3 tests, mixed-case `["XSED", "Couple"]` resolving `"couple"` as offered in both call sites).

2. **`TripperTravelerTypesSection.tsx` hardcoded Spanish-only copy** — the section's own guard-removal (task 3.13 above) meant it now always renders, exposing hardcoded Spanish strings ("Tipos de viajero", "Viajes con {name}", etc.) to English-locale visitors. Added `trippers.travelerTypesSection` (`eyebrow`/`title`/`subtitle`, `{name}` placeholder) to `src/lib/types/dictionary.ts` + `src/dictionaries/es.json` + `src/dictionaries/en.json`. Component now takes a required `copy` prop (same pattern as `TripperUnavailableNotice`); caller `src/app/[locale]/trippers/[tripper]/page.tsx` passes `dict.trippers.travelerTypesSection`. Test added to `TripperTravelerTypesSection.test.tsx` proving English copy renders with no Spanish leak.

3. **Unvalidated `tripperSlug` forwarded to client on dead/inactive tripper** — `src/app/[locale]/journey/page.tsx` now only forwards the raw `tripperSlug` prop to `JourneyPageClient` when `resolveTripperState` resolved to `status: "ok"`; `"none"`/`"unavailable"` forward `undefined` regardless of the cookie's HMAC validity. Tests added to `journey/__tests__/page.test.ts` (+3 tests) covering not_found, inactive, and ok paths.

4. **Banner permanently loses "switch back" after toggle-off + refresh** — added a second, separate, longer-lived cookie `grt_tripper_last_seen` (90-day TTL vs. the live `grt_tripper` cookie's 30-day TTL; `GRT_TRIPPER_LAST_SEEN_COOKIE`/`LAST_SEEN_COOKIE_MAX_AGE`/`lastSeenCookieOptions()` in `src/lib/tripper/attribution.ts`). Written alongside the live cookie on a genuinely NEW referral (`proxy.ts`'s `action.kind === "set"`) and on `POST /api/attribution/mode` re-selecting `"tripper"` mode; deliberately NEVER cleared by the `"randomtrip"` toggle action. `AttributionModeBanner` (`src/components/tripper/AttributionModeBanner.tsx`) now falls back to this cookie (via new `readLastSeenTripperSlug()` in `attribution-server.ts`) when there's no live cookie, rendering the toggle in `initialMode="randomtrip"` so the visitor can still switch back. Explicitly documented as distinct from `referredByTripperId` (permanent, write-once, DB-level referral credit) — this is a session/cookie-level, UI-only "last seen" signal. Tests: `attribution-server.readSlugs.test.ts` (new, 4 tests), `proxy.attribution.test.ts` (+3 tests), `mode/route.test.ts` (+2 tests), `AttributionModeBannerToggle.test.tsx` (new, covers `initialMode`).

5. **Toggle doesn't invalidate already-rendered Server Component pricing** — `AttributionModeBannerToggle.tsx`'s `handleToggle` now calls `router.refresh()` (from `next/navigation`) immediately after a successful `POST /api/attribution/mode`, so already-rendered by-type page pricing re-renders with the new attribution state. Test: `AttributionModeBannerToggle.test.tsx` asserts `router.refresh()` is called after a successful toggle and NOT called after a failed one.

6. **Banner/page disagree under `?catalog=randomtrip`** — `AttributionModeBannerToggle` (client component, already nested under the Suspense boundary from fix #8) now reads `useSearchParams()` directly — this works even though layouts don't receive `searchParams` as a prop, because the hook subscribes to the router's client-side URL state regardless of where it's mounted in the tree. When `catalog=randomtrip` is active, the banner shows only the RandomTrip-general message with no toggle button (a page-local, per-request opt-out has no sensible cookie-level toggle action to offer). Documented the App-Router layout/page boundary reasoning inline. Tests: `AttributionModeBannerToggle.test.tsx` (+2 tests: opt-out active vs. any other `catalog` value).

7. **`cache()`-wrapped `getTripperJourneyContext` memoizes transient DB errors** — the catch-all in `src/lib/db/tripper-queries.ts` used to swallow ANY thrown error into `{ status: "not_found" }`, which `React.cache()` would then memoize for the rest of the request. Changed to re-throw genuine DB errors (verified against React 19's documented `cache()` semantics: a rejected/thrown result is never memoized, only a resolved value is) while still returning `{ status: "not_found" }` normally for an actual missing tripper (not an exception). Error handling moved to the call sites that need graceful degradation without poisoning the shared cache: `resolveLiveAttribution` (`attribution-server.ts`) and `resolveTripperState` (`journey/page.tsx`) each catch-and-log locally now. Tests: `tripper-queries.getTripperJourneyContext.test.ts` (+2 tests distinguishing "doesn't exist" from "DB threw").

8. **`AttributionModeBanner` has no Suspense boundary** — wrapped it in `<Suspense fallback={null}>` in `src/app/[locale]/layout.tsx`, mirroring the existing `AppTracking` pattern in the same file, so the cookie/DB lookup no longer blocks the initial HTML/RSC response for every route.

9. **`TripperJourneyContext` type duplicated** — removed the duplicate `interface TripperJourneyContext` from `src/lib/db/tripper-queries.ts` (and its now-unused `TripperPriceOverrides` import); `tripper-queries.ts` now imports the canonical type from `src/types/tripper.ts`. Updated `src/lib/tripper/attribution-server.ts`'s import to also pull the type from `@/types/tripper` instead of re-exporting through `tripper-queries.ts`.

10. **Unparallelized awaits on the by-type page** — `src/app/[locale]/experiences/by-type/[type]/page.tsx` now runs the attribution resolution (`readAttributionSlug` + `resolveLiveAttribution`, skipped entirely when `catalog=randomtrip`), `getDictionary`, and `getReviewsForTripType` concurrently via `Promise.all` (not `allSettled` — verified neither `getDictionary` nor `getReviewsForTripType` can meaningfully reject, and `resolveLiveAttribution` now catches its own errors per fix #7). Test: new `by-type/[type]/__tests__/page.test.tsx` (3 tests, including a timing-based test proving concurrent — not sequential — execution).

### Verification

- `npx tsc --noEmit` — clean, zero errors.
- `npx vitest run` — **214 test files, 1574 tests, all passing** (up from the 211/1547 baseline: +3 new test files — `attribution-server.readSlugs.test.ts`, `AttributionModeBannerToggle.test.tsx`, `by-type/[type]/__tests__/page.test.tsx` — plus additions to 6 existing test files).

### Files touched

- `src/lib/utils/traveler-card.ts` (+`isTypeOffered`)
- `src/lib/utils/__tests__/traveler-card.test.ts`
- `src/app/[locale]/experiences/by-type/[type]/page.tsx`
- `src/app/[locale]/experiences/by-type/[type]/__tests__/page.test.tsx` (new)
- `src/lib/types/dictionary.ts`
- `src/dictionaries/es.json`, `src/dictionaries/en.json`
- `src/components/tripper/TripperTravelerTypesSection.tsx`
- `src/components/tripper/__tests__/TripperTravelerTypesSection.test.tsx`
- `src/app/[locale]/trippers/[tripper]/page.tsx`
- `src/app/[locale]/journey/page.tsx`
- `src/app/[locale]/journey/__tests__/page.test.ts`
- `src/lib/tripper/attribution.ts` (+`GRT_TRIPPER_LAST_SEEN_COOKIE`, `LAST_SEEN_COOKIE_MAX_AGE`, `lastSeenCookieOptions`)
- `src/lib/tripper/attribution-server.ts` (+`readLastSeenTripperSlug`, error handling in `resolveLiveAttribution`, type import fix)
- `src/lib/tripper/__tests__/attribution-server.readSlugs.test.ts` (new)
- `src/proxy.ts`
- `src/__tests__/proxy.attribution.test.ts`
- `src/app/api/attribution/mode/route.ts`
- `src/app/api/attribution/mode/__tests__/route.test.ts`
- `src/components/tripper/AttributionModeBanner.tsx`
- `src/components/tripper/AttributionModeBannerToggle.tsx`
- `src/components/tripper/__tests__/AttributionModeBannerToggle.test.tsx` (new)
- `src/lib/db/tripper-queries.ts`
- `src/lib/db/__tests__/tripper-queries.getTripperJourneyContext.test.ts`
- `src/app/[locale]/layout.tsx`

### Status

All 10 confirmed findings applied in full, no partial fixes. Left uncommitted per instructions — working tree changes are ready for orchestrator review and commit.
