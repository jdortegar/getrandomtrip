# Proposal: Invite as Tripper (Admin-Initiated, Consent-Gated)

## Intent

Admins have NO way to invite someone to become a Tripper. Two admin surfaces show people who could become Trippers but offer no invite action: the Admin Waiting List (`AdminWaitlistPageClient.tsx`, backed by `WaitlistEntry` — a standalone table with no `User` link, only `{id, email, name, lastName, createdAt}`; sole row action today is Delete) and the Admin Users table (`UsersTable.tsx` / `UsersTableRow.tsx`), for an existing `User` who is currently `CLIENT`-only. This change adds an "Invite as Tripper" action to both. Crucially, this is **consent-gated**: sending the invite changes NOTHING about the invitee's account. The `TRIPPER` role is granted only when the invitee clicks the emailed link and accepts — never by admin fiat.

## Scope

### In Scope

- New `TripperInvite` Prisma model: `{id, email, tokenHash, expiresAt, consumedAt, createdAt}`. NO FK to `WaitlistEntry` or `User` — the invite is resolved by **email lookup at accept time**, not creation time (naturally handles someone self-registering between invite and click).
- Token flow mirroring `src/lib/auth/verificationTokens.ts` (SHA-256 hash stored, single-use, plaintext only in the emailed link) but as a **dedicated flow** — `VerificationToken` requires a non-null `userId` FK and this use case often has no `User` yet. Expiry **7 days**.
- **Resend semantics**: re-clicking "Invite as Tripper" while a pending (unexpired, unconsumed) invite exists invalidates the old token and issues+emails a fresh one (mirrors `issueVerificationToken`'s "delete prior unconsumed same-type tokens"). Once consumed, the button shows an accepted/disabled state.
- Two admin-gated trigger endpoints (`hasRoleAccess`-gated like existing admin routes): `POST /api/admin/waitlist/[id]/invite-tripper` and `POST /api/admin/users/[id]/invite-tripper`.
- New dedicated accept route `/[locale]/tripper-invite?token=` plus its backing public endpoint(s). Server resolves the invite by token hash, then `User` by the invite's email (see User Flows).
- Grant `TRIPPER` via the existing `addMembershipRole` / `buildUserRoleUpdate` patterns in `src/lib/auth/prismaUserRoles.ts` (append to `roles`, preserve existing).
- New Resend email `sendTripperInviteEmail(email, token, locale)` in `src/lib/email/index.ts` + React Email template `src/emails/TripperInvite.tsx` with `subjects: {es, en}`. Waitlist-sourced invites send in `es` (no locale available); existing-user invites use `User.locale`.
- Admin UI status badge next to the button: "Invited" (pending, unexpired) or "Expired" (past `expiresAt`, still resendable), derived from a `TripperInvite` row for that email with `consumedAt IS NULL`. Users-table button renders only for users lacking `TRIPPER`/`ADMIN`.
- `WaitlistEntry` cleanup: delete the row once a waitlist-sourced invite is accepted and the `User` exists.
- All new copy in `es.json` + `en.json` with types in `src/lib/types/dictionary.ts`.

### Out of Scope

- **Other roles / role picker** — Tripper only.
- **Audit trail** (`invitedByUserId` or admin-action attribution) — no precedent in this codebase, no consumer yet.
- **Self-service resend** from the accept page — re-issuance is admin-only (re-click the button).
- **Forced Tripper onboarding gate** on accept — Tripper dashboard has none today (`TripperGuard` is dead/unused code); accepted existing users redirect to `/` with a log-in message.
- **Rate limiting** on the invite/accept endpoints — no infra exists; consistent with `auth-verification-reset`'s deferred gap.

## Capabilities

### New Capabilities

- `tripper-invite`: admin-initiated, consent-gated Tripper invitation — hashed single-use 7-day token, dedicated accept flow that grants `TRIPPER` on existing users or at account-creation time (credentials + Google OAuth) for new users, with waitlist cleanup. (Single flat `spec.md` per repo convention.)

### Modified Capabilities

- None (behavior captured entirely in the new flat spec; touches admin + auth code but no existing spec requirement changes).

## User Flows

**Sending the invite.** From the Waiting List row or a Users-table row, admin clicks "Invite as Tripper". The admin endpoint (role-gated) invalidates any prior pending invite for that email, issues a fresh 7-day `TripperInvite`, and fires `sendTripperInviteEmail`. Waitlist source → `es`; existing-user source → `User.locale`. The row shows an "Invited" badge.

**Accepting the invite** at `/[locale]/tripper-invite?token=` (server-side): look up `TripperInvite` by token hash, then `User` by the invite's email.
- **Invalid/expired token** → error state (no self-service resend; admin re-clicks to reissue).
- **Existing `User`** → append `TRIPPER` to `roles` (preserve existing), mark invite consumed, redirect to `/` with a "log in" message.
- **No `User` yet** → render the normal registration form with email pre-filled/locked, token carried through, supporting BOTH credentials and Google OAuth. On successful creation via either path, grant `TRIPPER` at creation:
  - Credentials: `src/app/api/auth/register/route.ts` accepts+validates the token and sets `roles: [CLIENT, TRIPPER]` instead of `[CLIENT]`.
  - OAuth: `src/lib/auth.ts` `signIn` callback (~88-126) does a pending-invite-by-email lookup right before the new-Google-user `create`, setting roles accordingly.
  - After creation, mark invite consumed and delete the matching `WaitlistEntry` if one exists.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `TripperInvite` model (no FKs). Apply via `prisma db push` (repo convention). |
| `src/lib/auth/` (new invite-token helper) | New | SHA-256 hash + issue/consume, no `userId` FK; mirrors `verificationTokens.ts`. |
| `src/app/api/admin/waitlist/[id]/invite-tripper/route.ts` | New | `hasRoleAccess`-gated trigger (waitlist source). |
| `src/app/api/admin/users/[id]/invite-tripper/route.ts` | New | `hasRoleAccess`-gated trigger (existing-user source). |
| `src/app/api/` (accept endpoint(s)) | New | Public accept flow backing `/tripper-invite`. |
| `src/app/[locale]/tripper-invite/page.tsx` | New | Server accept page (`hasLocale` + `getDictionary`); error / existing-user / new-user branches. |
| `src/app/api/auth/register/route.ts` | Modified | Accept+validate token; set `roles: [CLIENT, TRIPPER]`; consume invite; delete waitlist row. |
| `src/lib/auth.ts` | Modified | `signIn` Google-create path: pending-invite lookup → roles + consume + waitlist cleanup. |
| `src/lib/auth/prismaUserRoles.ts` | Reused | `addMembershipRole` / `buildUserRoleUpdate` for role grant on existing users. |
| `src/lib/email/index.ts` | Modified | `sendTripperInviteEmail(email, token, locale)`; `es` fallback for waitlist source. |
| `src/emails/TripperInvite.tsx` | New | React Email template + `subjects: {es, en}`. |
| `AdminWaitlistPageClient.tsx` | Modified | Invite button + Invited/Expired badge per row. |
| `UsersTable.tsx` / `UsersTableRow.tsx` | Modified | Invite button (only for non-TRIPPER/ADMIN) + badge. |
| `src/dictionaries/{es,en}.json` | Modified | All new admin + accept-page + email copy in both locales. |
| `src/lib/types/dictionary.ts` | Modified | Types for new dictionary sections. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OAuth `signIn` invite injection breaks Google login for non-invited users | Med | Lookup is additive and only affects the new-user `create` branch; default stays `CLIENT`; cover with tests. |
| Email/roles mismatch (invite email vs. OAuth-provided email differ) | Med | Resolve strictly by invite email; if the accepting account's email differs, treat as no-match (no silent grant). |
| Double-grant or race on concurrent accept + self-register | Low | Single-use consume + append-not-replace role update are idempotent; `consumedAt` guards replay. |
| Waitlist row deleted before account fully created | Low | Delete only after successful `User` create + invite consume, in the same server action. |
| Plaintext token leakage | Low | Only SHA-256 hash persisted; plaintext exists solely in the emailed link. |
| Untranslated admin/email copy | Low | Enforce dual `es`/`en` entries + `dictionary.ts` types per `i18n-and-types.md`. |
| No rate limiting on trigger/accept endpoints | Med | Admin-gated triggers limit blast radius; token expiry + single-use; rate limiting tracked as follow-up. |

## Rollback Plan

Revert the change commits. `TripperInvite` is a standalone additive table with no FKs — dropping it via `prisma db push` against the reverted schema is low-risk and destroys only pending invites (re-issuable). All role grants are code-level and consent-driven; reverting the code stops new invites/grants immediately, while `TRIPPER` roles already granted to consenting users remain valid and correct. No destructive change to `User` or `WaitlistEntry` beyond the intended per-accept waitlist-row deletion.

## Dependencies

- Existing Resend integration (`src/emails/`, `src/lib/email/index.ts`) — reused, not rebuilt.
- Existing role helpers (`src/lib/auth/prismaUserRoles.ts`) and token pattern (`src/lib/auth/verificationTokens.ts`) — mirrored/reused.
- `prisma db push` to apply the new model.

## Open Questions

- None. All design decisions (Tripper-only scope, unified email-resolved model, 7-day expiry, resend/consume semantics, dedicated accept route, credentials + OAuth grant-at-creation, locale fallback, waitlist cleanup, no audit trail) were pre-resolved via a full user interview and are settled requirements for the spec/design phases.

## Success Criteria

- [ ] Admin can invite from both the Waiting List and the Users table; sending the invite changes nothing on the invitee's account until they accept.
- [ ] Accept flow grants `TRIPPER` to an existing `User` (roles preserved), marks the invite consumed, and redirects to `/` with a log-in message.
- [ ] New invitee can create an account via credentials OR Google OAuth from the accept page and receives `TRIPPER` at creation; the matching `WaitlistEntry` is deleted.
- [ ] Re-clicking invalidates the prior pending token and emails a fresh one; consumed invites disable the button.
- [ ] Invalid/expired tokens show an error state with no self-service resend.
- [ ] Admin rows show Invited/Expired badges; the Users-table button hides for existing `TRIPPER`/`ADMIN`.
- [ ] Invite email is localized (`es` for waitlist source, `User.locale` for existing users); all copy present in `es` and `en`.
- [ ] `npm run typecheck` and `npm run lint` pass.
