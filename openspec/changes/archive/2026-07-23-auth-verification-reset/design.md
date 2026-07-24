# Design: Email Verification + Self-Service Password Reset

## Technical Approach

Close the verification/reset gap by threading a single hashed-token model through the auth surfaces that already exist, instead of introducing new infra (no rate limiter, no session store, no DB adapter). Five layers:

1. **Data** — add `User.emailVerified DateTime?` and one new `VerificationToken` model (SHA-256 hash, `type` discriminator `EMAIL_VERIFY | PASSWORD_RESET`, expiry, single-use). Shipped via `prisma db push` (this repo has **no** migration files — `prisma/migrations/` is unused and `db:migrate` is aliased to `prisma db push` in `package.json`). A one-off `scripts/*.ts` backfill (run via `npx tsx`, the established pattern here — cf. `scripts/backfill-experience-source.ts` → `db:backfill-source`) marks OAuth-only users verified and leaves credential users unverified.
2. **Token core** — a new pure module `src/lib/auth/verificationTokens.ts` owns generate/hash/issue/consume/reissue. Only the SHA-256 hex hash is persisted; the plaintext exists solely in the emailed link. Lookup on consume is by the unique hash (an indexed exact match — no secret comparison, so no timing concern).
3. **Gate** — `CredentialsProvider.authorize()` (`src/lib/auth.ts`) blocks credential login when `emailVerified` is null, **after** the bcrypt check, throwing a recognizable `EMAIL_NOT_VERIFIED` error and firing a fresh verification email inline (fire-and-forget). Google OAuth never touches `authorize()` and stays ungated.
4. **API + pages** — three thin routes (`verify-email` consume, `forgot-password` enumeration-safe issue, `reset-password` consume+update) plus two server pages that hand a `?token=` to a small client child which POSTs to the route (scanner-safe: consumption happens via client-side POST, not on GET render).
5. **Email + UI** — two Resend templates + two `send…` dispatchers following the existing fire-and-forget `void (async () => …)()` pattern in `src/lib/email/index.ts`; `AuthModal` gets a real forgot-password fetch and a distinguishable "not verified → resend" affordance.

### Judgment calls (proposal was silent or under-specified — decided here)

- **Consumption is a client-side POST, not a GET-render side effect.** The proposal's Affected-Areas table describes `verify-email/route.ts` as "consume token". A server page that consumes on GET render is vulnerable to email-security-scanner link prefetch silently burning the token before the human clicks. Resolution: the page is a server component that renders a **client** child which POSTs the token on mount (`useEffect`). Scanners don't execute JS, so the token survives prefetch; the user still needs no extra click. Same shape for reset-password.
- **No dedicated "resend verification" endpoint.** The blocked-login auto-send inside `authorize()` is the single resend mechanism. The `AuthModal` "resend" button re-invokes `signIn()` with the credentials already in form state, which re-triggers the server-side auto-send, then shows "check your inbox". This keeps the route list exactly as the proposal specified (no unlisted endpoint) at the cost of requiring the password to still be present in the form (it is, immediately after a blocked attempt). Flagged for the orchestrator.
- **New Google users get `emailVerified` set at creation.** The `signIn` callback's Google-create block (`src/lib/auth.ts` ~L87) will set `emailVerified: new Date()` — Google already proved the email. Harmless (Google never hits the gate) but keeps the column semantically consistent with the backfill. Flagged.
- **Reissue = delete-then-create, not a DB unique constraint.** A user may legitimately hold one active `EMAIL_VERIFY` and one active `PASSWORD_RESET` simultaneously, and we keep consumed rows for a short audit trail, so `(userId, type)` is **not** unique. Issuing deletes prior *unconsumed* same-type rows first, then creates. See Decision "Reissue strategy".

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Verified flag | Add `emailVerified DateTime?` to `User` (nullable, no default → null = unverified). Placed after `password` (schema ~L24). | `emailVerified Boolean @default(false)`; a separate `EmailVerification` 1-1 table. | A nullable timestamp is the NextAuth-canonical shape (matches the adapter's `User.emailVerified`), records *when* verification happened, and is additive/zero-downtime. A boolean loses the timestamp; a side table adds a join for one fact. |
| Token storage | One `VerificationToken` table with a `type VerificationTokenType` discriminator; store only `tokenHash` (SHA-256 hex, `@unique`). | Two tables (`EmailVerifyToken` + `PasswordResetToken`); store plaintext token; JWT-encoded stateless tokens. | One table + enum avoids duplicate DDL and duplicate helper code and lets a single consume path serve both flows. Hash-at-rest limits blast radius of a DB leak to unusable digests. Stateless JWTs can't be single-use/revoked without a store — which is the whole point. |
| Schema delivery | Edit `schema.prisma`, apply with `npm run db:push`. Additive nullable column + new table → zero-downtime, no data migration. | `prisma migrate dev` generating a `migration.sql`. | This repo does **not** use migration files (`prisma/migrations/` is empty; `db:migrate` → `prisma db push` in `package.json`). A lone migration would fracture the workflow — same call already made in `admin-owned-experiences`. |
| Backfill | Standalone `scripts/backfill-email-verified.ts` via `npx tsx`, wired as `"db:backfill-email-verified"` in `package.json`. Two idempotent `updateMany`s. | Hand-edited `migration.sql`; fold into `prisma/seed.ts`. | No migration file to edit; `seed.ts` is full-DB seeding, not a targeted one-off. `scripts/*.ts` + `npx tsx` is the established one-off pattern (`db:backfill-source`, `db:grant-all-roles`). Idempotent + reversible. |
| Token hashing | `crypto.randomBytes(32).toString("hex")` (64-char plaintext) → `crypto.createHash("sha256").update(plaintext).digest("hex")`. Node `crypto`, no new dep. | bcrypt the token; HMAC with a server secret; UUID. | The token already has 256 bits of entropy, so a fast one-way SHA-256 is sufficient and lets us look it up by the indexed unique hash in O(1). bcrypt would force a full-table scan (can't index a per-row salt). No timing-safe compare needed — we never compare secrets, we index on the digest. |
| Reissue strategy | On issue: `deleteMany({ where: { userId, type, consumedAt: null } })` then `create`. | DB `@@unique([userId, type])` + upsert; keep all old tokens valid. | `(userId, type)` can't be unique (both types can be active at once; consumed rows are retained for audit). Delete-then-create guarantees at most one live token per (user, type) so an old emailed link can't be reused after a resend, without a constraint that would forbid legitimate multi-type coexistence. |
| Gate placement | In `authorize()`, the `emailVerified` check goes **after** `bcrypt.compare` succeeds. On failure: fire `sendVerificationEmail` (fire-and-forget) then `throw new Error("EMAIL_NOT_VERIFIED")`. | Check before the password compare; return `null`. | Checking after the password check prevents the gate from becoming an email/verification-status oracle for attackers who don't know the password. `authorize` returning `null` collapses to NextAuth's generic `CredentialsSignin` — the client can't distinguish "wrong password" from "unverified". A thrown `Error` **propagates its message** to `signIn`'s `result.error` in NextAuth v4, giving us the distinguishable signal. |
| Resend trigger site | Inline in `authorize()` (server-side, during the `signIn()` POST). Fire-and-forget `sendVerificationEmail(user.id, token)` before throwing. | A separate API route the client calls after the blocked login; a NextAuth event. | `authorize()` already runs server-side with the resolved `user`; the email dispatchers are fire-and-forget (`void` IIFE) so they don't block the throw. A separate route would re-resolve the user and duplicate issuance. Abuse (unbounded sends) is the documented, accepted no-rate-limit gap. |
| Consume transport | Client child component POSTs `{ token }` to the route on mount; server page only renders. | Consume on server GET render; a Next.js Route Handler `GET` redirect. | GET-render consumption is burned by email-scanner link prefetch. Client POST-on-mount is scanner-safe (no JS in scanners) and needs no extra user click. |
| Enumeration safety | `forgot-password` **always** returns `200 { ok: true }` with an identical body regardless of account existence; issuance + email happen only when a user with a non-null `password` matches. | Return 404 when the email is unknown; different messages. | Distinct responses/status codes leak which emails are registered. A constant response + constant-ish work (single indexed `findUnique`) removes the oracle. Full timing equalization is out of scope (documented). |
| Password policy home | Shared `src/lib/validation/password.ts` (`isValidPassword`, `PASSWORD_MIN_LENGTH`), consumed by `register` + `reset-password` routes (+ optionally the modal). Email regex in `src/lib/validation/email.ts` (`isValidEmail`). | Duplicate the checks in both routes; one big `validation.ts`. | The policy is enforced in ≥2 places; a shared util is the single source of truth and prevents drift (register currently allows 6 chars, the new policy is 8 + letter + number). Two tiny single-responsibility files match this repo's "one responsibility per file" rule (`.claude/rules/component-patterns.md`). |
| Page structure | `verify-email/page.tsx` + `reset-password/page.tsx` are **server** components (`hasLocale` + `getDictionary`) that render a `"use client"` child (`VerifyEmailClient` / `ResetPasswordClient`) with the token + a sliced dict. | Fully client pages reading the dict statically; fully server pages. | Server shell keeps the repo's server-page i18n contract (`hasLocale` → `getDictionary`); the client child does the POST/form work that must run in the browser. `reset-password` uses `@/components/ui/FormField` per `.claude/rules/component-patterns.md`. |

## Interfaces / Contracts

### Prisma (`prisma/schema.prisma`)

```prisma
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String
  password      String?
  emailVerified DateTime?  // null = unverified. Set on token consume, backfill, or Google create.
  // ...unchanged...
  verificationTokens VerificationToken[]   // new relation
}

enum VerificationTokenType {
  EMAIL_VERIFY
  PASSWORD_RESET
}

model VerificationToken {
  id         String                @id @default(cuid())
  userId     String
  user       User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  type       VerificationTokenType
  tokenHash  String                @unique   // SHA-256 hex of the plaintext; consumption lookup key
  expiresAt  DateTime
  consumedAt DateTime?                        // null = still valid (single-use)
  createdAt  DateTime              @default(now())

  @@index([userId, type])   // reissue: find/delete prior unconsumed same-type tokens
  @@index([expiresAt])      // optional: future expired-token pruning job
  @@map("verification_tokens")
}
```

Note: `tokenHash @unique` already yields a unique index, so consumption `findUnique({ where: { tokenHash } })` is O(1). `@@index([userId, type])` backs the reissue delete. `onDelete: Cascade` cleans tokens when a user is deleted. Applied via `npm run db:push`.

### Token helper (`src/lib/auth/verificationTokens.ts`, new)

```ts
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { VerificationTokenType } from "@prisma/client";

const TTL_MS = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000,    // 1h
} as const;

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Invalidates prior unconsumed same-type tokens, then issues a new one.
 *  Returns the PLAINTEXT token (only ever exposed here, for the email link). */
export async function issueVerificationToken(
  userId: string,
  type: VerificationTokenType,
): Promise<string> {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + TTL_MS[type]);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { userId, type, consumedAt: null } }),
    prisma.verificationToken.create({ data: { userId, type, tokenHash, expiresAt } }),
  ]);
  return plaintext;
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Hashes the incoming plaintext, validates type + expiry + unused, marks consumed. */
export async function consumeVerificationToken(
  plaintext: string,
  type: VerificationTokenType,
): Promise<ConsumeResult> {
  const tokenHash = hashToken(plaintext);
  const row = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== type) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  await prisma.verificationToken.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true, userId: row.userId };
}
```

### `src/lib/auth.ts` — `authorize()` gate delta

Add `emailVerified: true` to the existing `findUnique` select (L35-45). After the `isValid` check (current L57-59), insert:

```ts
// ...existing: throw new Error("Invalid credentials") when !isValid
if (!user.emailVerified) {
  // Fire a fresh verification email for backfilled / never-verified accounts.
  const token = await issueVerificationToken(user.id, "EMAIL_VERIFY");
  sendVerificationEmail(user.id, token); // fire-and-forget (void)
  throw new Error("EMAIL_NOT_VERIFIED"); // distinguishable; reaches client via result.error
}
// ...existing: return { id, email, name, image }
```

NextAuth v4 caveat: a thrown `Error`'s `.message` is surfaced to the client `signIn()` call as `result.error`. If a future NextAuth version wraps the message, the client should match with `result.error?.includes("EMAIL_NOT_VERIFIED")` rather than strict equality. Google path (`GoogleProvider` + `signIn` callback) is untouched, so OAuth logins are never gated.

Also in the `signIn` Google-create block (~L87-97), add `emailVerified: new Date()` to `prisma.user.create({ data: { … } })` (judgment call — keeps the column consistent for OAuth accounts).

### API routes

All routes are `POST`, JSON in / JSON out, `runtime` default (Node — `crypto` + Prisma).

**`POST /api/auth/verify-email`** (new) — consume `EMAIL_VERIFY`, set `emailVerified`.
```
req:  { token: string }
200:  { ok: true }
400:  { ok: false, reason: "invalid" | "expired" | "used" | "missing" }
```
Logic: guard `token` present → `consumeVerificationToken(token, "EMAIL_VERIFY")` → on `ok`, `prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } })` → `200`. On `!ok`, echo `reason` with `400`.

**`POST /api/auth/forgot-password`** (new) — enumeration-safe issue of `PASSWORD_RESET`.
```
req:  { email: string }
200:  { ok: true }        // ALWAYS this body/status, regardless of existence or validity
```
Logic: `if (!isValidEmail(email)) return 200 { ok: true }` (still generic). `findUnique({ where: { email }, select: { id, password } })`. Only if `user && user.password` (credential account): `token = issueVerificationToken(user.id, "PASSWORD_RESET")` + `sendPasswordResetEmail(user.id, token)`. Return `200 { ok: true }` in all branches. No 404, no distinct error — no account-existence oracle.

**`POST /api/auth/reset-password`** (new) — validate + update hash + consume.
```
req:  { token: string, password: string }
200:  { ok: true }
400:  { ok: false, reason: "invalid" | "expired" | "used" | "weak_password" | "missing" }
```
Logic: guard both present. `if (!isValidPassword(password)) return 400 { reason: "weak_password" }`. `consumeVerificationToken(token, "PASSWORD_RESET")` → on `!ok` return `400 { reason }`. On `ok`: `prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(password, 10), emailVerified: user.emailVerified ?? new Date() } })`. (Owning the reset link also proves the email → opportunistically verify if still unverified.) Return `200`.

### `POST /api/auth/register` — delta (`src/app/api/auth/register/route.ts`)

Replace the `password.length < 6` check with the shared policy; add email-format validation; issue + send verification after create:
```ts
import { isValidPassword, PASSWORD_MIN_LENGTH } from "@/lib/validation/password";
import { isValidEmail } from "@/lib/validation/email";
import { issueVerificationToken } from "@/lib/auth/verificationTokens";
import { sendVerificationEmail } from "@/lib/email";
// ...
if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
if (!isValidPassword(password)) return NextResponse.json({ error: "Weak password" }, { status: 400 });
// ...create user (unverified: emailVerified stays null)...
const token = await issueVerificationToken(user.id, "EMAIL_VERIFY");
sendVerificationEmail(user.id, token); // fire-and-forget
// response unchanged (201)
```
Note: the existing AuthModal auto-login-after-register will now hit the `EMAIL_NOT_VERIFIED` gate. That is the intended new behavior — after register the modal shows the "verify your email" state (see AuthModal changes), it no longer silently logs in.

### Validation utils (new)

`src/lib/validation/password.ts`:
```ts
export const PASSWORD_MIN_LENGTH = 8;
// min 8, at least one letter and one number
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export function isValidPassword(pw: string): boolean {
  return typeof pw === "string" && PASSWORD_RE.test(pw);
}
```
`src/lib/validation/email.ts`:
```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // same shape AuthModal already uses
export function isValidEmail(email: string): boolean {
  return typeof email === "string" && EMAIL_RE.test(email);
}
```

### Email templates + dispatchers

New templates mirroring `src/emails/WelcomeEmail.tsx` (default component + `subjects = { es, en }`, `EmailLayout`, `BASE_URL = "https://getrandomtrip.com"`):

- `src/emails/VerifyEmail.tsx` — props `{ name: string; verifyUrl: string; locale: "es" | "en" }`; CTA "Verify email" / "Verificar email".
- `src/emails/PasswordReset.tsx` — props `{ name: string; resetUrl: string; locale: "es" | "en" }`; CTA "Reset password" / "Restablecer contraseña"; copy notes the 1h expiry.

New dispatchers in `src/lib/email/index.ts` (exact fire-and-forget signature — take the **plaintext token**, since only the caller holds it):
```ts
export function sendVerificationEmail(userId: string, token: string): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, locale: true },
      });
      if (!user?.email) return;
      const locale = resolveLocale(user.locale);
      const verifyUrl = `https://getrandomtrip.com/${locale}/verify-email?token=${token}`;
      await sendMail({
        to: user.email,
        subject: verifyEmailSubjects[locale],
        content: { react: React.createElement(VerifyEmail, { name: user.name ?? "", verifyUrl, locale }) },
      });
    } catch (err) { console.error("[email] sendVerificationEmail:", err); }
  })();
}

export function sendPasswordResetEmail(userId: string, token: string): void { /* same shape → PasswordReset, resetUrl `/${locale}/reset-password?token=${token}` */ }
```
Add the two `import … { subjects as verifyEmailSubjects }` / `passwordResetSubjects` lines at the top alongside the existing template imports.

### Pages

Both are server components (Next 16 async `params`/`searchParams`) rendering a client child.

`src/app/[locale]/verify-email/page.tsx`:
```tsx
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};
export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const { token } = await searchParams;
  const locale = hasLocale(raw) ? raw : "es";
  const dict = await getDictionary(locale);
  return <VerifyEmailClient token={token ?? null} locale={locale} copy={dict.verifyEmailPage} />;
}
```
`VerifyEmailClient` (`"use client"`, co-located `src/components/auth/VerifyEmailClient.tsx`): on mount, if `token` → `POST /api/auth/verify-email { token }`; render `verifying | success (with login link) | error(reason)` states from `copy`. If no token → error state.

`src/app/[locale]/reset-password/page.tsx`: same server shell → `<ResetPasswordClient token locale copy={dict.resetPasswordPage} />`. `ResetPasswordClient` uses `@/components/ui/FormField` (`type="password"`) for the new password + a confirm field, client-side `isValidPassword` pre-check, then `POST /api/auth/reset-password { token, password }`; on success show a login link; on `weak_password | invalid | expired | used` show the matching `copy` message.

### `AuthModal.tsx` — deltas (`src/components/auth/AuthModal.tsx`)

State additions:
```ts
const [errorKind, setErrorKind] = useState<"generic" | "notVerified" | null>(null);
const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
const [forgotState, setForgotState] = useState<"idle" | "sending" | "sent">("idle");
```
(a) **Forgot password** — replace the `mailto:` body of `handleForgotPassword` with a real fetch:
```ts
if (!isValidEmail(email)) { setError(t?.invalidEmail ?? ""); return; }
setForgotState("sending");
await fetch("/api/auth/forgot-password", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
setForgotState("sent"); // always show generic "if that email exists, we sent a link" (t.forgotSentGeneric)
```
(b) **Not-verified login** — in the login branch of `handleSubmit`, inspect `result.error` before throwing generic:
```ts
if (result?.error === "EMAIL_NOT_VERIFIED") { setErrorKind("notVerified"); return; }
if (result?.error) { setErrorKind("generic"); throw new Error(t?.loginFailed ?? ""); }
```
When `errorKind === "notVerified"`, render the not-verified panel (copy `t.notVerifiedTitle` / `t.notVerifiedBody`) with a "Resend verification email" button → `handleResend`:
```ts
setResendState("sending");
await signIn("credentials", { email, password, rememberMe: "false", redirect: false }); // re-triggers server auto-send
setResendState("sent"); // show t.verificationResent
```
The register branch: after a successful `/api/auth/register`, the follow-up `signIn` now returns `EMAIL_NOT_VERIFIED` → set `errorKind="notVerified"` and show the same panel ("we sent you a verification link") instead of treating it as a login failure.

## Data Flow

```
REGISTER
  AuthModal → POST /api/auth/register (isValidEmail + isValidPassword)
    → create user (emailVerified=null)
    → issueVerificationToken(EMAIL_VERIFY, 24h) → sendVerificationEmail(userId, token)
    → auto-signIn hits authorize() gate → EMAIL_NOT_VERIFIED → modal shows "check your inbox"
  email link → /[locale]/verify-email?token=
    → VerifyEmailClient POST /api/auth/verify-email { token }
      → consumeVerificationToken → user.emailVerified = now → success + login link

LOGIN (unverified / backfilled)
  AuthModal → signIn(credentials) → authorize(): bcrypt OK, emailVerified null
    → issueVerificationToken + sendVerificationEmail (inline) → throw EMAIL_NOT_VERIFIED
    → modal shows not-verified panel → [Resend] re-signIn → re-fires auto-send

PASSWORD RESET
  AuthModal "forgot?" → POST /api/auth/forgot-password { email }  (ALWAYS 200 {ok:true})
    → only if user.password != null: issueVerificationToken(PASSWORD_RESET, 1h) + sendPasswordResetEmail
  email link → /[locale]/reset-password?token=
    → ResetPasswordClient (FormField) POST /api/auth/reset-password { token, password }
      → isValidPassword → consumeVerificationToken → bcrypt.hash → user.password updated (+emailVerified if null)
    → user logs in with new password (now verified)

GOOGLE OAUTH — unchanged; signIn callback sets emailVerified on create; never gated.
```

## File Changes

| File | Action | Notes |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `User.emailVerified` + relation; add `VerificationTokenType` enum + `VerificationToken` model. Apply via `npm run db:push`. |
| `scripts/backfill-email-verified.ts` | Create | OAuth-only (`password: null`) → `emailVerified = now`; credential (`password != null`) → null. Idempotent, logs counts. |
| `package.json` | Modify | Add `"db:backfill-email-verified": "npx tsx scripts/backfill-email-verified.ts"`. |
| `src/lib/auth/verificationTokens.ts` | Create | `issueVerificationToken` / `consumeVerificationToken` (SHA-256, delete-then-create reissue). |
| `src/lib/validation/password.ts` | Create | `isValidPassword`, `PASSWORD_MIN_LENGTH`. |
| `src/lib/validation/email.ts` | Create | `isValidEmail`. |
| `src/lib/auth.ts` | Modify | Add `emailVerified` to select; gate after bcrypt; inline auto-send + `throw EMAIL_NOT_VERIFIED`; set `emailVerified` on Google create. |
| `src/app/api/auth/register/route.ts` | Modify | Shared email/password validation; issue + send verification email. |
| `src/app/api/auth/verify-email/route.ts` | Create | Consume `EMAIL_VERIFY`, set `emailVerified`. |
| `src/app/api/auth/forgot-password/route.ts` | Create | Enumeration-safe; issue + send `PASSWORD_RESET`. |
| `src/app/api/auth/reset-password/route.ts` | Create | Validate token + policy; update hash; consume. |
| `src/emails/VerifyEmail.tsx` | Create | React Email template + `subjects`. |
| `src/emails/PasswordReset.tsx` | Create | React Email template + `subjects`. |
| `src/lib/email/index.ts` | Modify | `sendVerificationEmail(userId, token)`, `sendPasswordResetEmail(userId, token)` + imports. |
| `src/app/[locale]/verify-email/page.tsx` | Create | Server shell → `VerifyEmailClient`. |
| `src/app/[locale]/reset-password/page.tsx` | Create | Server shell → `ResetPasswordClient` (FormField). |
| `src/components/auth/VerifyEmailClient.tsx` | Create | Client: POST-on-mount consume + states. |
| `src/components/auth/ResetPasswordClient.tsx` | Create | Client: FormField new-password form + POST. |
| `src/components/auth/AuthModal.tsx` | Modify | Real forgot-password fetch; not-verified panel + resend; register-flow not-verified handling. |
| `src/lib/types/dictionary.ts` | Modify | New `auth` keys + `verifyEmailPage` + `resetPasswordPage` interfaces on `MarketingDictionary`. |
| `src/dictionaries/es.json` + `en.json` | Modify | All new keys in both locales. |

## Dictionary Additions

All keys required in **both** `src/dictionaries/es.json` and `en.json`, with types in `src/lib/types/dictionary.ts`.

**Extend `auth` (existing section, `MarketingDictionary.auth`)** — used by `AuthModal`:
- `notVerifiedTitle` — e.g. "Verify your email" / "Verificá tu email"
- `notVerifiedBody` — "You need to verify your email before signing in. We just sent you a link."
- `resendVerification` — button label "Resend verification email"
- `verificationResent` — "Verification email sent. Check your inbox."
- `resending` — "Sending…"
- `registerCheckInbox` — post-register "We sent a verification link to {email}."
- `forgotSending` — "Sending…"
- `forgotSentGeneric` — "If an account exists for that email, we sent a reset link."
- `passwordPolicyHint` — "Min. 8 characters, at least one letter and one number." (also replaces the hardcoded `placeholder="Min. 8 characters + special character"` on the password `FormField`)

**New section `verifyEmailPage`** (`MarketingDictionary.verifyEmailPage`) — used by `VerifyEmailClient`:
- `verifyingTitle` / `verifyingBody` — loading state
- `successTitle` / `successBody` — verified
- `loginCta` — "Go to login"
- `errorTitle` — generic error heading
- `reasonInvalid` — "This verification link is invalid."
- `reasonExpired` — "This link has expired. Sign in to get a new one."
- `reasonUsed` — "This link was already used."
- `reasonMissing` — "No verification token found."

**New section `resetPasswordPage`** (`MarketingDictionary.resetPasswordPage`) — used by `ResetPasswordClient`:
- `title` / `subtitle`
- `newPasswordLabel` / `newPasswordPlaceholder`
- `confirmPasswordLabel` / `confirmPasswordPlaceholder`
- `submitLabel` / `submitting`
- `policyHint` — same policy text
- `mismatch` — "Passwords don't match."
- `weakPassword` — "Password must be at least 8 characters with a letter and a number."
- `successTitle` / `successBody`
- `loginCta` — "Go to login"
- `errorTitle`
- `reasonInvalid` / `reasonExpired` / `reasonUsed` / `reasonMissing` — same set as verify page

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Type | New enum/model, new dict interfaces wire through; `ConsumeResult` union exhaustive | `npm run typecheck` |
| Lint | No raw `<img>`, design-system compliance on new pages/panels | `npm run lint` |
| Unit | `issueVerificationToken` deletes prior unconsumed same-type rows then creates one; `consumeVerificationToken` returns `invalid`/`expired`/`used`/`ok` per branch; `isValidPassword` / `isValidEmail` boundaries | `vitest` (`npm test`) — pure functions, mock `prisma` |
| Backfill | After run: `password IS NULL` users have `emailVerified` set, credential users null; re-run is a no-op | Log-and-verify counts; run twice |
| Manual — register | New account gets email; consuming 24h link verifies; login then succeeds | QA ≥360px + ≥1280px |
| Manual — gate | Backfilled credential login is blocked with the not-verified panel; resend arrives; Google login unaffected | Regression |
| Manual — reset | forgot-password returns identical response for known + unknown email; 1h single-use token; policy enforced on reset page | Two emails (exists / not) |

## Migration / Rollout

1. Merge schema + code. 2. `npm run db:push` (additive column + new table, safe). 3. `npm run db:backfill-email-verified` once. Order: push before backfill. Rollback: revert commits; reverting `src/lib/auth.ts` immediately restores ungated login even if the column lingers (harmless). Dropping the column/table via `db:push` against the reverted schema is safe (only nulled `emailVerified` on credential users, re-derivable by re-verification). Accepted gaps (documented in proposal): no rate limiting, no session invalidation on reset.

## Open Questions

- [ ] **Resend endpoint vs. re-signIn (judgment call, flagged):** design uses the `authorize()` inline auto-send as the only resend path; the modal "resend" re-invokes `signIn` with in-state credentials. Confirm this over adding a dedicated `POST /api/auth/resend-verification` (which the proposal did not list). Recommend the re-signIn path.
- [ ] **Consume via client POST-on-mount vs. proposal's implied server-GET route (judgment call, flagged):** chosen to defeat email-scanner link prefetch. Confirm the extra client component is acceptable vs. a server-render consume.
- [ ] **Google create sets `emailVerified` (judgment call, flagged):** minor additive change to the `signIn` callback for column consistency. Confirm inclusion.
- [ ] **NextAuth v4 thrown-message propagation:** `result.error === "EMAIL_NOT_VERIFIED"` relies on v4 passing the thrown message through. If integration testing shows wrapping, switch the client to `.includes(...)`. `sdd-apply` should verify empirically.
</content>
</invoke>
