# Proposal: Email Verification + Self-Service Password Reset

## Intent

The app ships with NO email verification and NO real password-reset flow. `CredentialsProvider.authorize()` (`src/lib/auth.ts`) authenticates any credential account solely on `bcrypt.compare` — there is no proof the email is real or owned by the registrant. The `User` model has no `emailVerified` field. `AuthModal.handleForgotPassword` just opens a `mailto:support@...` link with no backend. This is a security and account-recovery gap that must close before public launch. We are still pre-launch (behind the waitlist gate, small internal user base), so a "force existing credential users to re-verify" migration is low-risk NOW — the ideal window to introduce the gate.

## Scope

### In Scope

- Add `emailVerified DateTime?` to `User` and one new `VerificationToken` model (single table, `type` enum discriminator `EMAIL_VERIFY | PASSWORD_RESET`; SHA-256 token hash + `userId` + `expiresAt` + consumed state).
- **Hard verification gate** in `CredentialsProvider.authorize()`: reject credential login when `emailVerified` is null, with a distinguishable error so the UI can offer "resend verification email".
- Auto-send a fresh verification email when a blocked (backfilled) credential login is attempted; send verification email immediately on successful `/api/auth/register`.
- New API routes: send/verify email, forgot-password (enumeration-safe), reset-password.
- New pages `/[locale]/verify-email?token=` and `/[locale]/reset-password?token=` (dedicated pages, mirroring `/login`).
- New Resend email templates + `send...` dispatcher functions following the existing `src/emails/*.tsx` + `src/lib/email/index.ts` fire-and-forget pattern.
- Password policy (register + reset): min 8 chars, ≥1 letter and ≥1 number. Add real email-format validation to `/api/auth/register`.
- Backfill: credential accounts (`password IS NOT NULL`) → `emailVerified = null` (must re-verify); OAuth-only (`password IS NULL`) → verified.
- All new copy in `es.json` + `en.json` with types in `src/lib/types/dictionary.ts`; reset-password form uses `@/components/ui/FormField`.

### Out of Scope

- **Rate limiting** — no infra exists; deferred (greenfield, separate effort).
- **Session invalidation on reset** — JWT-only sessions with no DB adapter; invalidating other active sessions needs new infra (`passwordChangedAt` per-request check). Accepted gap, documented.
- **Deleting the dead `/api/auth/signup` route** — leave untouched.
- **Gating Google OAuth accounts** — the `signIn` callback trusts Google's email; those logins must keep working unchanged.
- No bulk "please verify" email blast at migration time.

## Capabilities

### New Capabilities

- `auth-verification-reset`: email-verification gate for credential accounts + self-service password reset, backed by a hashed-token model and Resend emails. (Single flat `spec.md` per repo convention.)

### Modified Capabilities

- None (this repo has no prior auth spec file; behavior is captured entirely in the new flat spec).

## User Flows

**Email verification.** On register, `/api/auth/register` validates email format + password policy, hashes password, creates the user (unverified), issues an `EMAIL_VERIFY` token (24h), and fires the verification email with a link to `/[locale]/verify-email?token=`. That page validates+consumes the token server-side, sets `emailVerified`, and shows success with a login link (or an error/expired state). Login via credentials is hard-blocked until verified; a blocked attempt auto-issues a fresh verification email and surfaces a distinguishable error so `AuthModal` can show a "resend" affordance. Backfilled existing credential users hit this same path on their next login attempt.

**Password reset.** From `AuthModal`, "forgot password" calls the forgot-password endpoint, which ALWAYS returns the same generic response regardless of account existence (no enumeration), and — only if the email matches — issues a `PASSWORD_RESET` token (1h) and sends the reset email linking to `/[locale]/reset-password?token=`. That page (using `FormField`) submits the new password to the reset endpoint, which validates the token + password policy, updates the bcrypt hash, and consumes the token. User then logs in with the new password.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `User.emailVerified DateTime?`; add `VerificationToken` model + `VerificationTokenType` enum. Apply via `prisma db push` (repo convention; `migrations/` unused). |
| `src/lib/auth.ts` | Modified | Verification gate in `authorize()`; distinguishable error; trigger resend on blocked login. Google `signIn` untouched. |
| `src/app/api/auth/register/route.ts` | Modified | Email-format validation, new password policy, issue+send verification email. |
| `src/app/api/auth/verify-email/route.ts` | New | Consume `EMAIL_VERIFY` token, set `emailVerified`. |
| `src/app/api/auth/forgot-password/route.ts` | New | Enumeration-safe; issue+send `PASSWORD_RESET` token. |
| `src/app/api/auth/reset-password/route.ts` | New | Validate token + policy, update password hash, consume token. |
| `src/app/[locale]/verify-email/page.tsx` | New | Token-consuming page (`hasLocale` + `getDictionary`). |
| `src/app/[locale]/reset-password/page.tsx` | New | Reset form page using `FormField`. |
| `src/emails/*.tsx` | New | Verify-email + reset-password React Email templates. |
| `src/lib/email/index.ts` | Modified | New `send...` dispatcher functions (existing fire-and-forget pattern). |
| `src/lib/` (token helper) | New | SHA-256 hash + issue/verify/consume token utilities. |
| `src/components/auth/AuthModal.tsx` | Modified | Wire real forgot-password call; "resend verification" affordance + blocked-login error copy. |
| `src/dictionaries/{es,en}.json` | Modified | All new page + modal copy in both locales. |
| `src/lib/types/dictionary.ts` | Modified | Types for new dictionary sections. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backfill locks out active credential users without warning | Med | Pre-launch, small internal base; blocked login auto-sends verification email, no dead end. |
| No session invalidation on reset (stolen session persists) | Med | Documented accepted gap; JWT tokens expire naturally; revisit with adapter/`passwordChangedAt` later. |
| No rate limiting on send/verify/reset endpoints (email/enumeration abuse) | Med | Enumeration-safe generic response; token expiry (24h/1h) + single-use limit blast radius; rate limiting is a tracked follow-up. |
| Verification gate accidentally blocks Google OAuth logins | Low | Gate keyed on credential path only (`password != null`); Google `signIn` callback left untouched, covered by tests. |
| Plaintext token leakage | Low | Only SHA-256 hash persisted; plaintext exists solely in the emailed link. |
| Untranslated auth copy | Low | Enforce dual `es`/`en` entries + `dictionary.ts` types per `i18n-and-types.md`. |

## Rollback Plan

Revert the change commits. `User.emailVerified` and `VerificationToken` are additive — dropping them via `prisma db push` against the reverted schema is low-risk. Because the gate is code-level, reverting `src/lib/auth.ts` immediately restores prior (ungated) login for all credential accounts; residual `emailVerified` timestamps are harmless if the column remains. No destructive data change beyond nulling `emailVerified` on credential accounts, which is re-derivable by re-verification.

## Dependencies

- Existing Resend integration (`src/lib/helpers/sendMail.ts`, `src/emails/`, `src/lib/email/index.ts`) — reused, not rebuilt.
- `prisma db push` to apply schema + run the backfill.

## Success Criteria

- [ ] Credential login is hard-blocked until `emailVerified` is set; error is distinguishable and triggers a resend + fresh verification email.
- [ ] New registration receives a verification email; consuming the 24h token verifies the account.
- [ ] Forgot-password returns an identical generic response whether or not the email exists; reset uses a single-use 1h token.
- [ ] Reset page (`FormField`) enforces min-8 + letter + number; register enforces the same policy plus email-format validation.
- [ ] Google OAuth logins work exactly as before (never gated).
- [ ] Backfill: credential accounts unverified, OAuth-only accounts verified; no mass email sent at migration.
- [ ] All new copy present in `es` and `en`; `npm run typecheck` and `npm run lint` pass.
