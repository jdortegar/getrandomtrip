# Proposal: Invited-Only Site Access

## Intent

While `SiteSetting.gateEnabled` is on, only `GATE_ALLOWED_ROLES = {admin, tripper}` passes `GateAwareChrome`. `TRAVELER` is the default role on **every** account, so no role check can distinguish an invited traveler from an anonymous signup. Product decision: **every invited person passes the gate, nobody else does** — traveler, tripper or admin. Today an invited traveler cannot get in at all, and a companion who accepts a `/invite/[token]` roster invite is pushed to `/dashboard` (not gate-exempt) with no unlock — a live lockout whenever the gate is on.

## Scope

### In Scope

- `User.siteAccessGrantedAt DateTime?` — the gate signal; exposed as `session.user.hasSiteAccess` from the existing `session()` `select` (no extra query)
- Generalize `TripperInvite` → `AccessInvite` with `kind AccessInviteKind (TRIPPER | SITE_ACCESS)`, default `TRIPPER`; hand-edited migration `ALTER TABLE "tripper_invites" RENAME TO "access_invites"` (no data loss). Accept stamps `siteAccessGrantedAt` for **both** kinds; `TRIPPER` additionally appends the role
- Waitlist invite becomes `SITE_ACCESS`: route `.../[id]/invite-tripper` → `.../[id]/invite`; button "Invite as Tripper" → "Invite as Traveler"; drop its existing-`User` 400 guard (the accept page's `hasAccount` login branch covers it — otherwise a self-registered waitlister has no path in)
- `POST /api/admin/users/[id]/invite-tripper` (already shipped) issues `kind: TRIPPER` — unchanged behavior, now also grants site access on accept
- `POST /api/travelers/submit` stamps `siteAccessGrantedAt` on the claiming companion, closing the lockout
- `GateAwareChrome`: `GATE_ALLOWED_ROLES.has(role) || hasSiteAccess`; clear `GATE_STORAGE_KEY` when an authenticated session has neither
- Gate CTA copy: drop `waitlist.adminLoginLabel`, keep one `loginAction` label (es/en)

### Out of Scope

- Admin revoke-access UI, and unlocking new admin surfaces beyond the waitlist button rename
- `gateEnabled` semantics — stays a global switch
- Anonymous browsers already unlocked via `localStorage` (pre-existing gap, inherited)
- Loosening `WaitlistPage`'s `<AuthModal allowRegister={false}>` — registration stays on the invite-accept page

## Capabilities

### New Capabilities

- `site-access-gate`: who passes the marketing gate, the `siteAccessGrantedAt` grant, the localStorage revalidation rule

### Modified Capabilities

- `tripper`: `TripperInvite` → kinded `AccessInvite`; waitlist endpoint renamed, no longer grants `TRIPPER`, existing-`User` guard dropped; both accept paths stamp site access

## Approach

Reuse the twice-shipped invite primitive rather than clone it: one hash-only, single-use, 7-day token table with a `kind` discriminator, one accept page, one email family, one admin status-badge derivation (`getTripperInviteStatuses`). Grant lives on `User` (revocable, no email-drift risk, no per-session join), not on `WaitlistEntry`. Invite email stays bound to the invited address (pre-filled and locked), so the companion flow's "token alone is the grant" laxity is not inherited.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | `User.siteAccessGrantedAt`, `AccessInvite` + `AccessInviteKind` |
| `src/lib/auth/tripperInviteTokens.ts` | Modified | Kinded issue/peek/consume; `grantAccessAndCleanup` |
| `src/lib/auth.ts` | Modified | `session()` exposes `hasSiteAccess`; `signIn()` OAuth grant honours `kind` |
| `src/types/next-auth.d.ts` | Modified | `hasSiteAccess` on session user |
| `src/components/waitlist/GateAwareChrome.tsx` | Modified | Access check + localStorage revalidation |
| `src/components/waitlist/WaitlistPage.tsx` | Modified | Single login label |
| `src/app/api/admin/waitlist/[id]/invite/` | Renamed | Was `invite-tripper`; issues `SITE_ACCESS` |
| `src/app/api/tripper-invite/accept/route.ts` | Modified | Branch on `kind` |
| `src/app/api/travelers/submit/route.ts` | Modified | Stamp grant on claim |
| `.../admin/AdminWaitlistPageClient.tsx` | Modified | Label rename, new endpoint path |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | Traveler-invite copy, gate label |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma regenerates the table rename as drop+create, losing pending invites | Med | Hand-edit the migration to `ALTER TABLE ... RENAME`; review SQL before apply |
| Admins locked out mid-rollout | Low | `GATE_ALLOWED_ROLES` bypass is kept as an OR, not replaced |
| localStorage revalidation locks out a user who unlocked anonymously then logs in | Low | Intended per "non-invited must not access"; documented |
| Dropping the waitlist existing-`User` guard enables invite spam to members | Low | Admin-only endpoint; token is single-use and email-bound |
| Untranslated new copy | Med | Dual-dictionary + `typecheck` |

## Rollback Plan

Revert the code commits and apply a down migration dropping `User.siteAccessGrantedAt`, `AccessInvite.kind`, and renaming `access_invites` back to `tripper_invites`. Grants are additive — no user data is destroyed by reverting; affected users simply return to gate-blocked.

## Dependencies

- None external. Builds on shipped `tripper-invite`, `waitlist-bulk-actions`, `traveler-invite-required-signup`.

## Success Criteria

- [ ] A waitlisted person invited from the admin table can accept, sign up, and reach the site with the gate on, holding only `TRAVELER`
- [ ] A signed-in `TRAVELER` with no grant still sees the gate
- [ ] A companion accepting `/invite/[token]` reaches `/dashboard` without hitting the gate
- [ ] Users-table tripper promotion still grants `TRIPPER` and now also passes the gate
- [ ] Pending `tripper_invites` rows survive the migration and still accept as `TRIPPER`
- [ ] Gate CTA shows only "Iniciar sesión" / "Log in"
- [ ] `npm run typecheck`, `npm run lint`, and `npx vitest run` pass
