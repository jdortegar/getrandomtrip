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
