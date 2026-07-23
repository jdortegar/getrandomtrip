# Apply Progress: Email Verification + Self-Service Password Reset

## Status: CODE COMPLETE — 3 manual-QA tasks remain (10.5–10.7, require a human browser session)

95/98 tasks across 10 phases implemented. Typecheck: 0 errors. Test suite: 66 files / 451 tests, all green (28 new tests across 7 new/extended suites, zero regressions). `size:exception` recorded per the tasks artifact's Review Workload Forecast (single-pr, ~2x the 400-line budget, user-confirmed).

Single batch — no continuation needed for automatable work. Remaining items (10.5–10.7) are manual browser/inbox QA that this agent cannot perform in this environment; left for the user or a future `sdd-verify` pass to confirm.

---

## Phase 1: Data — Schema & Backfill

- [x] 1.1 `prisma/schema.prisma` — added `User.emailVerified DateTime?` (after `password`) + `verificationTokens VerificationToken[]` relation; added `VerificationTokenType` enum (`EMAIL_VERIFY | PASSWORD_RESET`); added `VerificationToken` model (`tokenHash @unique`, `expiresAt`, `consumedAt`, `@@index([userId, type])`, `@@index([expiresAt])`, `@@map("verification_tokens")`)
- [x] 1.2 `npm run db:push` — applied (additive column + new table, zero-downtime)
- [x] 1.3 RED — `scripts/__tests__/backfill-email-verified.test.ts` (3 tests) written first, confirmed failing (module didn't exist)
- [x] 1.4 GREEN — `scripts/backfill-email-verified.ts` — `backfillEmailVerified(client)`, mirrors `backfill-experience-source.ts` pattern; two idempotent `updateMany`s (OAuth-only → verified, credential → unverified)
- [x] 1.5 `package.json` — added `"db:backfill-email-verified": "npx tsx scripts/backfill-email-verified.ts"`
- [x] 1.6 Ran against dev DB: `oauth matched=12 verified before=0 after=12`, `credential matched=2 unverified before=2 after=2`

**USER MUST HAVE ALREADY RUN** (done during this apply session): `npm run db:generate` was also required after the schema edit — Prisma client didn't have `emailVerified` until regenerated. Both `db:push` and `db:generate` were run.

---

## Phase 2: Token Core — TDD (`src/lib/auth/verificationTokens.ts`)

- [x] 2.1 RED — `src/lib/auth/__tests__/verificationTokens.test.ts` — failing tests for `issueVerificationToken` written first (deleteMany scoping, expiry per type, plaintext-not-hash return), confirmed failing (module didn't exist)
- [x] 2.2 GREEN — implemented `issueVerificationToken` (SHA-256 via `crypto`, `$transaction([deleteMany, create])`)
- [x] 2.3 RED — extended test file with `consumeVerificationToken` cases (invalid/type-mismatch/used/expired/ok) before implementing
- [x] 2.4 GREEN — implemented `consumeVerificationToken` (findUnique by tokenHash → type check → consumed check → expiry check → update)
- [x] 2.5 REFACTOR — `hashToken` is the single private helper; `TTL_MS` matches spec (24h/1h); `ConsumeResult` union exhaustively handled

7/7 tests green.

---

## Phase 3: Validation Utils — TDD

- [x] 3.1 RED — `src/lib/validation/__tests__/password.test.ts` (5 tests) written first, confirmed failing
- [x] 3.2 GREEN — `src/lib/validation/password.ts` (`PASSWORD_MIN_LENGTH = 8`, regex `^(?=.*[A-Za-z])(?=.*\d).{8,}$`)
- [x] 3.3 RED — `src/lib/validation/__tests__/email.test.ts` (3 tests) written first, confirmed failing
- [x] 3.4 GREEN — `src/lib/validation/email.ts` (same regex shape AuthModal already used)

8/8 tests green.

---

## Phase 4: Credential Login Verification Gate

- [x] 4.1 `src/lib/auth.ts` — added `emailVerified: true` to `authorize()`'s `findUnique` select
- [x] 4.2 `src/lib/auth.ts` — gate inserted after the bcrypt check: `issueVerificationToken` + fire-and-forget `sendVerificationEmail` + `throw new Error("EMAIL_NOT_VERIFIED")`
- [x] 4.3 `src/lib/auth.ts` — Google `signIn` create block now sets `emailVerified: new Date()`
- [x] 4.4 Regression check confirmed: the `signIn` callback never reads `emailVerified` for gating (only writes it on Google create); the gate lives exclusively in `authorize()`, which OAuth never calls

---

## Phase 5: API Routes

- [x] 5.1 `src/app/api/auth/register/route.ts` — `isValidEmail` + `isValidPassword` replace the old 6-char check; issues + sends `EMAIL_VERIFY` after create
- [x] 5.2 `src/app/api/auth/verify-email/route.ts` (new) — consume `EMAIL_VERIFY`, set `emailVerified`
- [x] 5.3 `src/app/api/auth/forgot-password/route.ts` (new) — always `200 { ok: true }`; issues `PASSWORD_RESET` only for matching credential accounts
- [x] 5.4 `src/app/api/auth/reset-password/route.ts` (new) — validates policy + token, updates hash, opportunistically verifies email
- [x] 5.5 Route tests: `verify-email` (3), `forgot-password` (4), `reset-password` (5) — 12 tests, all green

**Deviation**: all three new routes use `Request` (not `NextRequest`) as the handler param type, matching the established pattern from `experience-approval-flow`/xsed routes — none of them need `cookies`/`nextUrl`, and this avoids a TS mismatch against `new Request(...)` in tests.

---

## Phase 6: Email Templates + Dispatcher

- [x] 6.1 `src/emails/VerifyEmail.tsx` (new) — mirrors `WelcomeEmail.tsx` shape
- [x] 6.2 `src/emails/PasswordReset.tsx` (new) — same shape, notes 1h expiry
- [x] 6.3 `src/lib/email/index.ts` — `sendVerificationEmail(userId, token)` added
- [x] 6.4 `src/lib/email/index.ts` — `sendPasswordResetEmail(userId, token)` added

---

## Phase 7: Pages + Client Components

- [x] 7.1 `src/app/[locale]/verify-email/page.tsx` (new) — server shell
- [x] 7.2 `src/components/auth/VerifyEmailClient.tsx` (new) — POST-on-mount (`useEffect`), scanner-safe; `verifying | success | error(reason)` states
- [x] 7.3 `src/app/[locale]/reset-password/page.tsx` (new) — server shell
- [x] 7.4 `src/components/auth/ResetPasswordClient.tsx` (new) — `FormField` (not raw `Input`) for new/confirm password, client pre-check + POST

---

## Phase 8: AuthModal Changes

- [x] 8.1 Added `errorKind`, `resendState`, `forgotState` state
- [x] 8.2 `handleForgotPassword` now does a real fetch instead of `mailto:`, always shows generic `forgotSentGeneric`
- [x] 8.3 Login branch inspects `result?.error === "EMAIL_NOT_VERIFIED"` before the generic failure path
- [x] 8.4 Not-verified panel with resend button (`handleResend` re-invokes `signIn`)
- [x] 8.5 Register branch shows the same panel (with `registerCheckInbox` copy) instead of a login failure
- [x] 8.6 Password `FormField` placeholder now uses `t.passwordPolicyHint`
- [x] 8.7 (deviation — quality fix, not in original task list) `validateForm`'s password check now branches: register enforces the new `isValidPassword` policy (8+ chars, letter, number); login keeps the old `length < 6` check so pre-policy accounts still authenticate. Replaced the inline email regex with the shared `isValidEmail` util. Localized the previously-hardcoded "Forgot password?" label to a new `auth.forgotPasswordLink` key (both locales) since the line was directly touched and the repo's i18n rule has no exceptions.

---

## Phase 9: Dictionary & i18n

- [x] 9.1 `auth` interface extended with 9 new keys + `forgotPasswordLink` (deviation, see 8.7)
- [x] 9.2 `VerifyEmailPageDict` interface added, wired as `verifyEmailPage`
- [x] 9.3 `ResetPasswordPageDict` interface added, wired as `resetPasswordPage`
- [x] 9.4 `src/dictionaries/es.json` — all keys added
- [x] 9.5 `src/dictionaries/en.json` — all keys mirrored
- [x] 9.6 `npm run typecheck` — 0 errors (confirmed early and again in Phase 10)

---

## Phase 10: Final Verification

- [x] 10.1 `npm run typecheck` — **0 errors, repo-wide**
- [~] 10.2 `npm run lint` — **environment-broken, not a code issue.** `next lint` doesn't exist in Next 16.2.6 (`npm run lint` errors with "Invalid project directory provided, no such directory: .../lint" — Next's CLI misparsing the removed subcommand). Direct `npx eslint` also fails with a pre-existing `eslint.config.js` circular-JSON crash in this repo's ESLint 8.57 + flat-config bridge, unrelated to this change. Manually verified instead: `rg "<img"` and `rg "dark:"` across every new/modified file in this change return zero matches.
- [x] 10.3 `npm run test` — **66 files / 451 tests, all green.** Zero regressions.
- [x] 10.4 Re-ran `npm run db:backfill-email-verified` — confirmed idempotent (oauth `matched=0`; credential branch is a no-op re-apply of `null` to the same 2 rows)
- [ ] 10.5 Manual QA (register flow) — **not run, requires human + browser + real inbox**
- [ ] 10.6 Manual QA (gate + Google regression) — **not run, same reason**
- [ ] 10.7 Manual QA (reset flow, enumeration-safety) — **not run, same reason**
- [x] 10.8 **Empirically confirmed** (design's flagged open question) by reading the installed `next-auth@4.24.14` source directly:
  - `node_modules/next-auth/core/routes/callback.js`: when `authorize()` throws, the POST handler redirects with `error=${encodeURIComponent(error.message)}` — the raw thrown message, not a generic value. (`"CredentialsSignin"` is only used when `authorize()` returns falsy instead of throwing.)
  - `node_modules/next-auth/react/index.js`: client `signIn()` extracts it via `new URL(data.url).searchParams.get("error")` — URL-decodes, does not rename/wrap.
  - **Conclusion: `result.error === "EMAIL_NOT_VERIFIED"` strict equality (as implemented) is correct for this NextAuth version. No `.includes()` fallback needed.**

---

## Key Design Decisions / Deviations

| ID | Decision |
|----|----------|
| D1 | Kept design's strict-equality assumption for `result.error === "EMAIL_NOT_VERIFIED"` — verified empirically via NextAuth v4.24.14 source (see 10.8), not just assumed |
| D2 | New API routes (`verify-email`, `forgot-password`, `reset-password`) use `Request`, not `NextRequest` — matches established xsed/experience-approval-flow convention, avoids test-type friction |
| D3 | `validateForm` in `AuthModal` branches password validation by mode (strict `isValidPassword` for register, legacy `length < 6` for login) to avoid blocking pre-existing users while still enforcing the new policy on new signups — not explicitly specified in design but required to avoid a client/server validation mismatch |
| D4 | Localized the pre-existing hardcoded "Forgot password?" button label (new `auth.forgotPasswordLink` key) since the line was directly modified in this change and the repo's i18n rule has zero exceptions |
| D5 | `npm run db:generate` had to be run after the schema edit (not explicitly listed as a task, implied by 1.2) — the backfill script failed with "Unknown argument `emailVerified`" until the Prisma client was regenerated |

## Known Environment Issue (not introduced by this change)

`npm run lint` / `next lint` is broken repo-wide on Next 16.2.6 + the current ESLint 8.57 config (see 10.2 note). This predates this change and was not caused by it — worth flagging to the user separately from this feature.

## Manual Steps Still Required (by a human)

1. Task 10.5, 10.6, 10.7 — browser-based manual QA of the register/gate/reset flows, plus a live Google OAuth regression check
2. Optional: fix the `next lint` / ESLint environment breakage (separate concern from this change)

---

## Verify-Fix Batch (2026-07-23)

Follow-up to `verify-report.md`'s FAIL verdict — this batch fixes the 2 gaps that were in scope for `sdd-apply` (CRITICAL-2 and WARNING-1). CRITICAL-1 (the undocumented waitlist-gate refactor mixed into the working tree) is explicitly **out of scope for this batch** — it requires a triage decision with the user/orchestrator (revert vs. adopt-with-its-own-spec), not a code fix, and was not touched here.

### Gap 1 (CRITICAL-2) — register route had zero test coverage

- [x] Added `src/app/api/auth/register/__tests__/route.test.ts` (4 tests): weak password → 400 (no user/token created); invalid email → 400 (no user/token created); duplicate email → 400 (no token issued, existing behavior preserved); success → user created with `emailVerified` left unset, `issueVerificationToken(user.id, "EMAIL_VERIFY")` called, `sendVerificationEmail(user.id, token)` called, 201 response.
- **Result: all 4 tests passed on first run against the existing, unmodified `src/app/api/auth/register/route.ts`.** No implementation changes were needed. This confirms the verify pass's direct-code-read conclusion ("code is correct by inspection") was accurate — the gap was purely missing test coverage, not a latent bug. The "Registration Issues Verification Token" spec requirement now has a passing covering test, satisfying Strict TDD Mode's compliance bar.
- `tasks.md` task 5.5 has been left as-is (still correctly scoped to 5.2–5.4 historically); a new task 5.6 was added and checked off to close the gap explicitly.

### Gap 2 (WARNING-1) — backfill script unsafe to re-run after go-live

- Checked `scripts/backfill-experience-source.ts` first (the repo's other one-off backfill script, cited in design.md) — it has **no re-run guard of any kind** (its "idempotent" comment just means re-applying the same `source: "RANDOMTRIP"` value is a no-op). No existing guard convention to mirror, so the guard below is a new pattern for this repo's backfill scripts.
- RED: extended `scripts/__tests__/backfill-email-verified.test.ts` with a new `describe("re-run safety guard")` block (3 tests) before touching the implementation — confirmed failing (guard didn't exist: `result.aborted` was `undefined`, `result` didn't equal `{ aborted: true }`).
- GREEN: `backfillEmailVerified(client, force = process.argv.includes("--force"))` now runs a guard `count` query first — `{ password: { not: null }, emailVerified: { not: null } }`. If that count is `> 0` and `force` is `false`, it `console.warn`s a message (mentions `--force`) and returns `{ aborted: true }` with **zero writes** (no `updateMany` calls at all). Otherwise it proceeds exactly as before and returns `{ aborted: false, oauthUpdated, credentialUpdated }`.
- Return type changed from a bare `{ oauthUpdated, credentialUpdated }` object to a discriminated union (`{ aborted: true } | { aborted: false, oauthUpdated, credentialUpdated }`). Existing 3 tests in the file still pass unchanged in spirit (assertions on `updateMany` call args are untouched); the one test that reads `result.oauthUpdated.count` was updated to first assert `result.aborted === false` (with a type-narrowing early-return) before reading the success-only fields, since TypeScript now requires narrowing the union.
- Script header comment updated to document the danger and the guard, per WARNING-1's suggested wording ("DANGER: do not re-run after users start verifying...").
- `--force` works by calling `npx tsx scripts/backfill-email-verified.ts --force` — Node's `process.argv` includes trailing args after the script path, so no CLI-arg-parsing library is needed.
- 6/6 tests green in this file (3 original + 3 new guard tests).

### Verification

- `npm run typecheck` — 0 errors.
- `npm run test` — **67 files / 458 tests, all green** (was 66/451; +1 new file `register/route.test.ts` = +4 tests, +3 new guard tests in the existing backfill file = +7 total). Zero regressions.

### Not in scope for this batch

- **CRITICAL-1** (undocumented waitlist-gate refactor: `LoginModal.tsx` deletion, `GateAwareChrome.tsx`/`HomeWrapper.tsx`/`WaitlistPage.tsx` changes, `AuthModal.tsx`'s `allowRegister` prop) — this is a scope/triage decision, not a code defect fixable by `sdd-apply`. Still present in the working tree, unresolved. Must be addressed (revert or adopt-with-spec) before this change can pass a re-verify and move to `sdd-archive`.
- Manual QA tasks 10.5–10.7 — unchanged, still require a human browser/inbox session.
- SUGGESTION-1 (stale `minLength={6}` HTML hint) — still open, cosmetic/low-priority, not addressed in this batch.

### Status

Both gaps assigned to `sdd-apply` in the verify-fix instructions are resolved and green. **A re-verify pass is needed** to confirm the fixes and to re-adjudicate CRITICAL-1 (which remains unresolved and blocks archive on its own). `state.yaml`'s `phases.verify: fail_critical_findings` has intentionally been left as-is per the verify-fix instructions — it should only flip once a fresh `sdd-verify` pass re-confirms the full spec compliance matrix, including CRITICAL-1's disposition.

---

## Live Manual QA Batch (tasks 10.5–10.7 + Phase 11)

Performed live by the user in an actual browser against the local dev DB (test account `jd.or@hotmail.com`, recreated twice: once as `CLIENT`, once as `TRIPPER`), not simulated. Real bugs surfaced and were fixed as part of this pass — see Phase 11 in `tasks.md` for the full list; summarized here:

1. **Gate swallowed this change's own pages** — `GateAwareChrome`/`HomeWrapper` (the separately-tracked waitlist-gate refactor, CRITICAL-1) wrapped every route including `/verify-email`, `/reset-password`, `/login`, so while the marketing gate was locked these pages never rendered — the gate's `WaitlistPage` rendered instead, with no error, making it look like the verify link "did nothing." Fixed with a pathname-based `isGateExemptRoute()` check in both components. Confirmed via direct HTML fetch (`curl`) that the visible DOM now shows `VerifyEmailClient`'s content, not the waitlist form, for a locked-gate + unauthenticated request.
2. **`/login` never passed `dict` to `AuthModal`** — pre-existing gap (predates this change), invisible until the verify-email redirect started sending users there. Every dictionary-driven label rendered blank. Fixed by statically importing the locale JSON (client-component i18n pattern) and passing it through; required narrowing `AuthModal`'s `dict` prop to `Pick<Dictionary, "auth">` since the full `Dictionary` type has unrelated fields with literal-union types that plain JSON imports can't satisfy.
3. **User-requested UX addition**: verify-email success now auto-redirects to `/login?email=` with the email prefilled (`AuthModal` gained `initialEmail`), instead of just showing a "go to login" button requiring the email to be retyped.
4. **User-requested change**: `/login`'s post-auth redirect now goes to the locale home page instead of `dashboardPathFromRole(role)`, when no explicit `returnTo` is present.
5. **Cosmetic**: shortened the resend-link button copy (was wrapping to two lines).

All of 1–5 are now reflected in the working tree. `npm run typecheck` and `npm run test` (67 files / 458 tests) both clean after every step above, re-confirmed at the end of this batch.

**CRITICAL-1 disposition**: still unresolved as a *git-history* matter (the waitlist-gate refactor and this change remain uncommitted together in the same working tree) — but items 1–2 above show the two changes are now functionally *interdependent* at the code level too (this change's pages literally do not work without the gate-exemption fix). Splitting them into separate commits is still the right call for review hygiene, but they can no longer be reverted fully independently without re-breaking the other. Flagging this clearly for whoever does the commit split.
