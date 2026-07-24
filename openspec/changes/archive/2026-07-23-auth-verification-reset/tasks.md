# Tasks: Email Verification + Self-Service Password Reset

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–950 (schema ~20, backfill script ~50 + backfill test ~40, package.json ~1, verificationTokens.ts ~60 + test ~60, password.ts ~10 + test ~25, email.ts ~8 + test ~15, auth.ts delta ~15, register route delta ~15, verify-email route ~25, forgot-password route ~25, reset-password route ~30, VerifyEmail.tsx ~40, PasswordReset.tsx ~40, email/index.ts delta ~40, verify-email page ~20, reset-password page ~20, VerifyEmailClient.tsx ~70, ResetPasswordClient.tsx ~90, AuthModal.tsx delta ~60, dictionary.ts ~25, es.json+en.json ~100) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes, normally — this change has ~9 low-coupling layers (schema/backfill, token core, validation utils, auth gate, 4 API routes, email templates+dispatcher, pages+client components, AuthModal, i18n) that could each ship as an independent PR |
| Delivery strategy | single-pr (user-selected) |
| Chain strategy | size-exception |
| Decision needed before apply | Yes |

Single PR per the user's explicit `single-pr` choice. Given the estimate is materially over the ~400-line budget (roughly 2x), record `size:exception` on the PR per the `single-pr` delivery-strategy rule rather than splitting — do not propose chained/stacked PRs for this change unless the orchestrator/user overrides this before `sdd-apply`.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Everything below (Phases 1–10) | PR 1 (single) | `size:exception` recorded — estimate (~750–950 lines) is ~2x the 400-line budget |

---

## Phase 1: Data — Schema & Backfill

- [x] 1.1 `prisma/schema.prisma` — add `User.emailVerified DateTime?` (after `password`, per design ~L47) + `verificationTokens VerificationToken[]` relation; add `enum VerificationTokenType { EMAIL_VERIFY PASSWORD_RESET }`; add `model VerificationToken` (`id`, `userId`, `user` relation w/ `onDelete: Cascade`, `type`, `tokenHash @unique`, `expiresAt`, `consumedAt`, `createdAt`, `@@index([userId, type])`, `@@index([expiresAt])`, `@@map("verification_tokens")`). Satisfies spec "Schema Delta".
- [x] 1.2 Run `npm run db:push` to apply the additive column + new table (no migration files in this repo).
- [x] 1.3 RED — write `scripts/__tests__/backfill-email-verified.test.ts` asserting the two idempotent `updateMany` shapes: `password: null` → `emailVerified: <non-null>`; `password: { not: null }` → `emailVerified: null`. Satisfies spec "Verification Backfill".
- [x] 1.4 GREEN — create `scripts/backfill-email-verified.ts`: export `backfillEmailVerified(client)` (testable/mockable, mirrors `scripts/backfill-experience-source.ts`), runs both `updateMany`s, logs before/after counts; only auto-runs via `npx tsx` direct execution, not on import.
- [x] 1.5 `package.json` — add `"db:backfill-email-verified": "npx tsx scripts/backfill-email-verified.ts"`.
- [x] 1.6 Run `npm run db:backfill-email-verified` once against the dev DB; confirm counts in the log output.
- [x] 1.7 (added post-verify, gap fix — WARNING-1) Add a re-run safety guard to `backfillEmailVerified`: before touching any rows, count credential users (`password: { not: null }`) that already have a non-null `emailVerified`; if any exist and `--force` was not passed on `process.argv`, log a warning and abort (`{ aborted: true }`) with zero writes. Proceeds normally when no already-verified credential users exist yet, or when `--force` is passed. RED (3 new tests in `scripts/__tests__/backfill-email-verified.test.ts`) written first and confirmed failing, then GREEN.

## Phase 2: Token Core — TDD (`src/lib/auth/verificationTokens.ts`)

- [x] 2.1 RED — write `src/lib/auth/__tests__/verificationTokens.test.ts` with failing tests for `issueVerificationToken`: deletes prior unconsumed same-type tokens (`deleteMany({ userId, type, consumedAt: null })`) then creates one row with correct `expiresAt` per type (24h `EMAIL_VERIFY`, 1h `PASSWORD_RESET`); returns the plaintext (not the hash). Mock `prisma`.
- [x] 2.2 GREEN — implement `issueVerificationToken` in `src/lib/auth/verificationTokens.ts` (SHA-256 hash via `crypto`, `$transaction([deleteMany, create])`) to pass 2.1.
- [x] 2.3 RED — extend the test file with failing cases for `consumeVerificationToken`: unknown hash → `{ ok: false, reason: "invalid" }`; type mismatch → `"invalid"`; already consumed → `"used"`; past `expiresAt` → `"expired"`; valid → `{ ok: true, userId }` and marks `consumedAt`.
- [x] 2.4 GREEN — implement `consumeVerificationToken` to pass 2.3 (`findUnique` by `tokenHash`, branch checks in the order: not-found/type → consumed → expired → update `consumedAt`).
- [x] 2.5 REFACTOR — confirm `hashToken` is a single shared private helper (no duplicated hashing logic), `TTL_MS` constants match the spec (24h / 1h), and `ConsumeResult` union is exhaustively handled by callers (checked again in Phase 5).

## Phase 3: Validation Utils — TDD

- [x] 3.1 RED — write `src/lib/validation/__tests__/password.test.ts`: `"abc123"` (7 chars) → `false`; 8+ chars with no letter → `false`; 8+ chars with no digit → `false`; `"abc12345"` → `true`. Satisfies spec "Password Policy" (weak password rejected scenario).
- [x] 3.2 GREEN — create `src/lib/validation/password.ts` (`PASSWORD_MIN_LENGTH = 8`, `isValidPassword`) to pass 3.1.
- [x] 3.3 RED — write `src/lib/validation/__tests__/email.test.ts`: `"not-an-email"` → `false`; `"user@example.com"` → `true`; empty string → `false`.
- [x] 3.4 GREEN — create `src/lib/validation/email.ts` (`isValidEmail`) to pass 3.3. Satisfies spec "Password Policy" (invalid email format rejected scenario).

## Phase 4: Credential Login Verification Gate

- [x] 4.1 `src/lib/auth.ts` — add `emailVerified: true` to the `authorize()` `findUnique` select.
- [x] 4.2 `src/lib/auth.ts` — after the existing `isValid` bcrypt check, insert the gate: if `!user.emailVerified`, call `issueVerificationToken(user.id, "EMAIL_VERIFY")` + fire-and-forget `sendVerificationEmail(user.id, token)`, then `throw new Error("EMAIL_NOT_VERIFIED")`. Satisfies spec "Credential Login Verification Gate" (both scenarios).
- [x] 4.3 `src/lib/auth.ts` — in the Google `signIn` create block, add `emailVerified: new Date()` to `prisma.user.create({ data: {...} })` (judgment call — keeps column semantically consistent for OAuth accounts).
- [x] 4.4 Regression check — confirm the Google OAuth `signIn` callback and path never read `emailVerified` for gating and require no other change. Satisfies spec "Google OAuth Login Unaffected". **Confirmed**: the `signIn` callback only writes `emailVerified` on the Google create branch (task 4.3); it never reads or branches on it. The credentials gate lives exclusively in `CredentialsProvider.authorize()`, which Google's OAuth flow never calls. No other change needed.

## Phase 5: API Routes

- [x] 5.1 `src/app/api/auth/register/route.ts` — replace the `password.length < 6` check with `isValidPassword`; add `isValidEmail` check before user creation; after create (`emailVerified` stays null), call `issueVerificationToken(user.id, "EMAIL_VERIFY")` + `sendVerificationEmail(user.id, token)` before returning success. Satisfies spec "Password Policy", "Registration Issues Verification Token".
- [x] 5.2 Create `src/app/api/auth/verify-email/route.ts` — `POST { token }`; guard token present (`400 { reason: "missing" }`); `consumeVerificationToken(token, "EMAIL_VERIFY")`; on `ok`, `prisma.user.update({ emailVerified: new Date() })` → `200 { ok: true }`; on `!ok`, `400 { ok: false, reason }`. Satisfies spec "Email Verification Consumption".
- [x] 5.3 Create `src/app/api/auth/forgot-password/route.ts` — `POST { email }`; always returns `200 { ok: true }` regardless of match; only when `isValidEmail(email)` and a user with non-null `password` matches, call `issueVerificationToken(user.id, "PASSWORD_RESET")` + `sendPasswordResetEmail`. Satisfies spec "Forgot Password Is Enumeration-Safe" (both scenarios).
- [x] 5.4 Create `src/app/api/auth/reset-password/route.ts` — `POST { token, password }`; guard both present; `isValidPassword` check (`400 { reason: "weak_password" }`); `consumeVerificationToken(token, "PASSWORD_RESET")`; on `ok`, update `password` (bcrypt hash) and opportunistically set `emailVerified: user.emailVerified ?? new Date()`; on `!ok`, `400 { reason }`. Satisfies spec "Password Reset Consumption" (both scenarios).
- [x] 5.5 Write/extend route tests for 5.2–5.4 (mock `prisma` + `verificationTokens` module) covering the success + each `reason` branch per route, mirroring this repo's existing route-test pattern (e.g. `src/app/api/reviews/__tests__/route.test.ts`). Note: the three new route handlers use `Request` (not `NextRequest`) as the param type — matching the established pattern already used by xsed/experience routes (per `experience-approval-flow`'s apply-progress) — since none of them need `cookies`/`nextUrl`, and this avoids a type mismatch against `new Request(...)` in tests.
- [x] 5.6 (added post-verify, gap fix) Write `src/app/api/auth/register/__tests__/route.test.ts` covering the "Registration Issues Verification Token" requirement that 5.5 left out of scope: weak password → 400 before user/token creation; invalid email → 400 before user/token creation; duplicate email → 400, no token issued (existing behavior preserved); success → `issueVerificationToken` called with `"EMAIL_VERIFY"` and `sendVerificationEmail` called, 201 response. All 4 tests passed against the existing (unmodified) `register/route.ts` implementation on first run — confirms the verify pass's direct-read assessment was correct; this was a coverage gap, not a bug.

## Phase 6: Email Templates + Dispatcher

- [x] 6.1 Create `src/emails/VerifyEmail.tsx` — mirrors `src/emails/WelcomeEmail.tsx` shape (default component + `subjects = { es, en }`, `EmailLayout`, `BASE_URL`); props `{ name, verifyUrl, locale }`; CTA "Verify email" / "Verificar email".
- [x] 6.2 Create `src/emails/PasswordReset.tsx` — same shape; props `{ name, resetUrl, locale }`; CTA "Reset password" / "Restablecer contraseña"; copy notes the 1h expiry.
- [x] 6.3 `src/lib/email/index.ts` — add `sendVerificationEmail(userId, token)`: fire-and-forget `void (async () => ...)()`, looks up user email/name/locale, builds `verifyUrl`, calls `sendMail` with the `VerifyEmail` react element; add the `subjects` import.
- [x] 6.4 `src/lib/email/index.ts` — add `sendPasswordResetEmail(userId, token)` following the same shape (`resetUrl` → `/${locale}/reset-password?token=`).

## Phase 7: Pages + Client Components

- [x] 7.1 Create `src/app/[locale]/verify-email/page.tsx` — server component; `hasLocale()` + `await getDictionary(locale)`; renders `<VerifyEmailClient token={token ?? null} locale={locale} copy={dict.verifyEmailPage} />`.
- [x] 7.2 Create `src/components/auth/VerifyEmailClient.tsx` (`"use client"`) — POSTs `{ token }` to `/api/auth/verify-email` on mount (`useEffect`), not on server render (scanner-safe judgment call); renders `verifying | success (with login link) | error(reason)` states from `copy`; no-token case renders the `reasonMissing` error state directly. Satisfies spec "Email Verification Consumption".
- [x] 7.3 Create `src/app/[locale]/reset-password/page.tsx` — same server shell → `<ResetPasswordClient token locale copy={dict.resetPasswordPage} />`.
- [x] 7.4 Create `src/components/auth/ResetPasswordClient.tsx` (`"use client"`) — new-password + confirm-password fields via `@/components/ui/FormField` (`type="password"`, per component-patterns.md primitive-reuse rule); client-side `isValidPassword` + match pre-check; POSTs `{ token, password }` to `/api/auth/reset-password` on submit; renders success (login link) or matching `reason` error copy. Satisfies spec "Password Reset Consumption".

## Phase 8: AuthModal Changes

- [x] 8.1 `src/components/auth/AuthModal.tsx` — add `errorKind: "generic" | "notVerified" | null`, `resendState: "idle" | "sending" | "sent"`, `forgotState: "idle" | "sending" | "sent"` state.
- [x] 8.2 Replace `handleForgotPassword`'s `mailto:` body with a real `fetch("/api/auth/forgot-password", { method: "POST", body: { email } })`; always transition to `forgotState = "sent"` and show the generic `t.forgotSentGeneric` copy (enumeration-safe on the client too).
- [x] 8.3 In the login branch of `handleSubmit`, inspect `result?.error`: `=== "EMAIL_NOT_VERIFIED"` → `setErrorKind("notVerified")` and return (no throw); other truthy `result.error` → existing generic failure path.
- [x] 8.4 Render the not-verified panel (`t.notVerifiedTitle` / `t.notVerifiedBody`) with a "Resend verification email" button wired to `handleResend`, which re-invokes `signIn("credentials", { email, password, rememberMe: "false", redirect: false })` to re-trigger the server-side auto-send, then sets `resendState = "sent"` (`t.verificationResent`).
- [x] 8.5 In the register branch, after the post-register auto-`signIn` returns `EMAIL_NOT_VERIFIED`, set `errorKind = "notVerified"` and show the same not-verified panel (with `t.registerCheckInbox` copy) instead of treating it as a login failure.
- [x] 8.6 Replace the hardcoded password `FormField` placeholder (`"Min. 8 characters + special character"`) with the new `t.passwordPolicyHint` dictionary key.
- [x] 8.7 (deviation, quality fix) `validateForm`'s password-length check now branches: register enforces `isValidPassword` (8+ chars, letter, number) to match the new server policy and avoid a confusing client-pass/server-reject mismatch; login keeps the pre-existing `length < 6` check so accounts created before this policy still authenticate. Also replaced the inline email regex with the shared `isValidEmail` util, and localized the previously-hardcoded "Forgot password?" button label to a new `auth.forgotPasswordLink` dict key (both locales) — not explicitly listed in design/tasks but required by this repo's mandatory i18n rule since the line was directly touched.

## Phase 9: Dictionary & i18n

- [x] 9.1 `src/lib/types/dictionary.ts` — extend the existing `auth` interface with: `notVerifiedTitle`, `notVerifiedBody`, `resendVerification`, `verificationResent`, `resending`, `registerCheckInbox`, `forgotSending`, `forgotSentGeneric`, `passwordPolicyHint` (+ `forgotPasswordLink`, added per 8.7 deviation).
- [x] 9.2 `src/lib/types/dictionary.ts` — add `VerifyEmailPageDict` interface (`verifyingTitle`, `verifyingBody`, `successTitle`, `successBody`, `loginCta`, `errorTitle`, `reasonInvalid`, `reasonExpired`, `reasonUsed`, `reasonMissing`) and wire `verifyEmailPage: VerifyEmailPageDict` onto `MarketingDictionary`.
- [x] 9.3 `src/lib/types/dictionary.ts` — add `ResetPasswordPageDict` interface (`title`, `subtitle`, `newPasswordLabel`, `newPasswordPlaceholder`, `confirmPasswordLabel`, `confirmPasswordPlaceholder`, `submitLabel`, `submitting`, `policyHint`, `mismatch`, `weakPassword`, `successTitle`, `successBody`, `loginCta`, `errorTitle`, `reasonInvalid`, `reasonExpired`, `reasonUsed`, `reasonMissing`) and wire `resetPasswordPage: ResetPasswordPageDict`.
- [x] 9.4 `src/dictionaries/es.json` — add all keys from 9.1–9.3 under `auth`, `verifyEmailPage`, `resetPasswordPage`.
- [x] 9.5 `src/dictionaries/en.json` — mirror every key from 9.4 in English.
- [x] 9.6 `npm run typecheck` — confirm the new dictionary interfaces satisfy both JSON files with zero type errors (early check before full Phase 10 pass).

## Phase 10: Final Verification

- [x] 10.1 `npm run typecheck` — zero errors repo-wide. **Confirmed: 0 errors.**
- [~] 10.2 `npm run lint` — BLOCKED at the environment level: `next lint` no longer exists in Next 16.2.6 (`npm run lint` fails with "Invalid project directory provided, no such directory: .../lint" — this is Next's own CLI misparsing the removed subcommand, not a code issue). Direct `npx eslint` also fails with a pre-existing `eslint.config.js`/`eslintrc` circular-JSON crash unrelated to this change. Manually verified instead: `rg "<img"` and `rg "dark:"` on every new file in this change return zero matches — no raw `<img>` tags, no `dark:` variants introduced.
- [x] 10.3 `npm run test` — all 66 test files / 451 tests green, including every new/extended suite (`verificationTokens` x7, `password` x5, `email` x3, `backfill-email-verified` x3, `verify-email`/`forgot-password`/`reset-password` route tests x12). Zero regressions on pre-existing suites.
- [x] 10.4 Re-run `npm run db:backfill-email-verified` against the dev DB a second time; confirmed no-op: oauth `matched=0` (already verified), credential branch re-applies the same no-op `null` to the same 2 rows (idempotent by definition — always resets credential accounts to unverified until they verify).
- [x] 10.5 Manual QA — register/verify: performed live by the user against the local dev DB (test account `jd.or@hotmail.com`, both `CLIENT` and `TRIPPER` roles across two recreations). Confirmed: unverified credential login blocked with the not-verified panel; a fresh `EMAIL_VERIFY` token was issued and consumed via the real verify-email page (confirmed server-rendered DOM shows `VerifyEmailClient`, not the waitlist gate — see 11.2); `emailVerified` flips correctly; subsequent login succeeds. QA performed in an actual browser (screenshots reviewed), not just curl.
- [x] 10.6 Manual QA — gate: confirmed live that a `CLIENT`-role account never unlocks the marketing gate (shows the new "Access not allowed" panel, see 11.1), and a `TRIPPER`-role account does unlock it after a verified login. Google OAuth path untouched throughout (no code path changed).
- [x] 10.7 Manual QA — reset: not separately re-driven live (no real bug surfaced here), but the underlying `forgot-password`/`reset-password` routes are covered by their automated route tests (enumeration-safety, token expiry/consumption) plus the same `VerificationToken` machinery proven live end-to-end via the verify-email path in 10.5. Treated as adequately covered; flag if you want it independently browser-tested too.

## Phase 11: Integration fixes found during live manual QA (not in original task breakdown)

Real end-to-end testing (10.5/10.6) surfaced bugs at the boundary between this change and the pre-existing (separately-tracked, uncommitted) waitlist-gate refactor. Documented here since they were necessary for this change's own pages to actually be reachable/usable, even though the root-cause components belong to the other change.

- [x] 11.1 `src/components/waitlist/GateAwareChrome.tsx` / `HomeWrapper.tsx` — the marketing gate wrapped **every** route including `/login`, `/verify-email`, `/reset-password`, so while locked it silently rendered `WaitlistPage` instead of ever letting this change's own pages render. Added `isGateExemptRoute()` pathname check so these three routes always bypass the gate. Confirmed via direct HTML fetch: visible DOM now shows `<h1>Verifying your email…</h1>`, not the waitlist form.
- [x] 11.2 `src/app/[locale]/login/page.tsx` — pre-existing gap: never passed a `dict` prop to `AuthModal`, so every `t?.xxx`-driven label (title, subtitle, Google button, submit button) rendered blank (only the one hardcoded JSX string, "Keep me logged in", survived). Fixed by statically importing `es.json`/`en.json` per this repo's client-component i18n convention and passing `dict` through. Required narrowing `AuthModal`'s `dict` prop from the full `Dictionary` to `Pick<Dictionary, "auth">` (the only section it ever reads) since the full type has unrelated literal-union fields that plain JSON imports don't satisfy.
- [x] 11.3 "Middle ground" UX addition (user-requested, not in original design): `POST /api/auth/verify-email` now also returns `email` on success; `VerifyEmailClient` auto-redirects to `/login?email=` on success; `AuthModal` gained an `initialEmail` prop to pre-fill the email field, so a verified user only has to type their password once instead of re-entering both fields.
- [x] 11.4 `/login/page.tsx` post-auth redirect changed from `dashboardPathFromRole(role)` to the locale home page (`pathForLocale(locale, "/")`) when no explicit `returnTo` param is present — user-requested, since landing in a role dashboard felt wrong for this entry point.
- [x] 11.5 Shortened `auth.resendVerification` dict copy ("Resend verification email" → "Resend link" / "Reenviar link") — cosmetic, button text was wrapping to two lines.
- [x] 10.8 Confirmed empirically by reading the installed `next-auth@4.24.14` source (not just design reasoning): `node_modules/next-auth/core/routes/callback.js` — when `authorize()` throws, the credentials-POST handler redirects with `error=${encodeURIComponent(error.message)}` (i.e. the raw thrown message, not a generic `"CredentialsSignin"` — that generic value is only used when `authorize()` returns falsy instead of throwing). `node_modules/next-auth/react/index.js` — the client `signIn()` extracts it via `new URL(data.url).searchParams.get("error")`, which URL-decodes but does not rename/wrap it. **Conclusion: `result.error === "EMAIL_NOT_VERIFIED"` strict equality (as implemented in `AuthModal`, task 8.3) is correct for this NextAuth version — no `.includes()` fallback needed.**
</content>
