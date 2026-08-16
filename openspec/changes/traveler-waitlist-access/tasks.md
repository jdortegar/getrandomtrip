# Tasks: Invited-Only Site Access

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1100-1500 (2 renamed modules with full rewrites, 1 new script, ~20 modified files, ~10 test files new/modified) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (schema+script+tokens module) → PR 2 (session/OAuth+accept/register/waitlist routes) → PR 3 (email+users-invite+travelers-submit) → PR 4 (gate component+dictionaries+admin client) |
| Delivery strategy | not yet chosen this session |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Phase 0-2: spec amendments, schema+migration script, `accessInviteTokens.ts` full rewrite | PR 1 | Self-contained foundation; unit-testable in isolation; ~300-400 lines. Includes the manual DB-ops step. |
| 2 | Phase 3-4: session/OAuth `signIn`, accept route+page+client, register route | PR 2 | Depends on PR 1's token module surface; ~350-450 lines |
| 3 | Phase 5-8: email template+sender, waitlist invite route move, users-table invite route, travelers/submit stamp | PR 3 | Depends on PR 1 (kinded `issueAccessInvite`); independent of PR 2's client copy; ~300-400 lines |
| 4 | Phase 9-10: gate component, dictionaries+types, admin waitlist client (ADR 8 removals) | PR 4 | Depends on PR 1 (`hasSiteAccess`) and dictionary keys touched across PR 2/3 surfaces; ~350-450 lines |
| — | Phase 11: manual QA checklist | accompanies final PR/tracker | Not automatable |

## Phase 0: Spec Amendments (gap closure — do first)

- [x] 0.1 Add Requirement "Schema Delivery Sequencing" to `specs/tripper/spec.md`: Phase 1 SQL script MUST run before `db:push`; `db:push` MUST NEVER be run with `--accept-data-loss`; `prisma generate` MUST run only after `db:push` reports convergence. Scenario: skipped Phase 1 causes `db:push` to refuse the drop.
- [x] 0.2 Add Requirement "Admin Waitlist Invite Availability" to `specs/tripper/spec.md` stating the client-side `alreadyMember` disabled/filter (row button, `invitableSelectedIds`, skipped-count note) is removed alongside the server 400 — explicitly superseding the invite-filter half of `waitlist-bulk-actions` Resolved Decision #1 (bulk-delete/checkbox half unaffected).
- [x] 0.3 Add Scenario to `specs/tripper/spec.md` "Admin Trigger Endpoints": a `SITE_ACCESS`-kind invite email MUST NOT reference a Tripper role in subject or body.
- [x] 0.4 Add Scenario to `specs/site-access-gate/spec.md` "Stale Unlock Revalidation" verbatim: GIVEN `GATE_STORAGE_KEY` is set and `status === "loading"`, WHEN the page mounts, THEN the key is not cleared and the gate is not shown.
- [x] 0.5 (added during apply — 5th gap flagged by orchestrator, missing from the original task brief) Add Requirement "Accept Page Copy Selection" to `specs/tripper/spec.md` with 3 scenarios covering both accept-page branches (existing-account grant, new-account registration) for `SITE_ACCESS` vs `TRIPPER` kind, per design ADR 6 / Downstream notes item 4.

## Phase 1: Schema + Migration Script (ADR 1 — hard sequencing, no `--accept-data-loss`)

- [x] 1.1 Modify `prisma/schema.prisma`: `User.siteAccessGrantedAt DateTime?`; `TripperInvite` → `AccessInvite` model with `kind AccessInviteKind @default(TRIPPER)` + `@@map("access_invites")`; new `enum AccessInviteKind { TRIPPER SITE_ACCESS }`.
- [x] 1.2 Create `scripts/rename-tripper-invites-to-access-invites.ts` — idempotent SQL from design ADR 1 via `prisma.$executeRawUnsafe` (enum create, table+index rename, `kind` column add, `siteAccessGrantedAt` column add).
- [x] 1.3 Add `"db:rename-access-invites": "npx tsx scripts/rename-tripper-invites-to-access-invites.ts"` to `package.json`.
- [x] 1.4 **Manual/ops, non-automatable by test — requires DB access.** Run in exact order against the target DB: `npm run db:rename-access-invites` → `npm run db:push` (expect "already in sync"; if it proposes a drop, ABORT — do not pass `--accept-data-loss`) → `npm run db:generate`. Record pending-invite row count before/after. **Executed against the local dev DB (Neon `verceldb`)** — see apply-progress for exact output/counts.

## Phase 2: Token Module Generalization (ADR 2, 3)

- [x] 2.1 RED: rename `src/lib/auth/__tests__/tripperInviteTokens.test.ts` → `accessInviteTokens.test.ts`; update every `prisma.tripperInvite.*` mock to `prisma.accessInvite.*`; add cases: `issueAccessInvite` persists `kind` and invalidates across kinds; `peek`/`consume` return `kind`; DEFAULT-kind row resolves `TRIPPER`; `stampSiteAccess` uses `updateMany` with the null guard, no-op when already granted; `grantAccessAndCleanup` stamps both kinds, appends role+`tripperSince` only for `TRIPPER`, deletes waitlist row both kinds. (spec: tripper — TripperInvite Model and Token Lifecycle)
- [x] 2.2 GREEN: rename `src/lib/auth/tripperInviteTokens.ts` → `accessInviteTokens.ts`; implement full surface from design ADR 3 (`issueAccessInvite(email, kind)`, `peekAccessInvite`, `consumeAccessInvite`, `getAccessInviteStatuses`, `resolveOAuthInviteGrant` unchanged, `stampSiteAccess`, `grantAccessAndCleanup(userId, email, kind)`, `ACCESS_INVITE_COOKIE` const). Confirm 2.1 passes.

## Phase 3: Session + OAuth signIn (ADR 4, 5)

- [x] 3.1 RED: create `src/lib/__tests__/auth.session.test.ts` — asserts `session()` sets `hasSiteAccess: true/false` from `siteAccessGrantedAt`, and `prisma.user.findUnique` is called exactly once. (spec: site-access-gate — Site Access Grant)
- [x] 3.2 GREEN: in `src/lib/auth.ts` `session()`, add `siteAccessGrantedAt: true` to the existing `select`; assign `session.user.hasSiteAccess = !!dbUser.siteAccessGrantedAt`. Confirm 3.1 passes.
- [x] 3.3 Add `hasSiteAccess?: boolean` to `Session["user"]` in `src/types/next-auth.d.ts` (ADR 10).
- [x] 3.4 RED: create `src/lib/__tests__/auth.signIn.test.ts` — OAuth create with `SITE_ACCESS` cookie → stamp, no `TRIPPER` role, token consumed; with `TRIPPER` → role+`tripperSince`+stamp; email mismatch → neither, token not consumed. (spec: tripper — Accept Flow New User; OAuth email mismatch)
- [x] 3.5 GREEN: in `src/lib/auth.ts` `signIn()` OAuth-create branch, split `grantAccess`/`grantTripper` per ADR 5, widen the consume/cleanup condition to `grantAccess`, add `tripperSince: new Date()` on the `grantTripper` branch. Repoint imports to `accessInviteTokens`. Confirm 3.4 passes.

## Phase 4: Accept Route + Page + Client + Register Route (ADR 6)

- [x] 4.1 RED: extend `src/app/api/tripper-invite/accept/__tests__/route.test.ts` — asserts `grantAccessAndCleanup` is called with `result.kind`. (spec: tripper — Accept Flow Existing User, all 3 scenarios)
- [x] 4.2 GREEN: in `src/app/api/tripper-invite/accept/route.ts`, call `consumeAccessInvite` and pass `result.kind` into `grantAccessAndCleanup`. Confirm 4.1 passes.
- [x] 4.3 Modify `src/app/[locale]/tripper-invite/page.tsx`: use `peekAccessInvite`; pass `kind` into `resolution`.
- [x] 4.4 RED: extend `src/app/api/tripper-invite/oauth-init/__tests__/route.test.ts` for `peekAccessInvite` rename and `ACCESS_INVITE_COOKIE` const usage.
- [x] 4.5 GREEN: modify `src/app/api/tripper-invite/oauth-init/route.ts` accordingly. Confirm 4.4 passes.
- [x] 4.6 Add `siteAccess` override object to `TripperInviteAcceptDict` in `src/lib/types/dictionary.ts` (ADR 6/11): `grantedTitle`, `grantedBody`, `registerEyebrow`, `registerTitle`, `registerSubtitle`, `registerSuccessBody`.
- [x] 4.7 Modify `src/components/auth/TripperInviteClient.tsx`: `TripperInviteResolution.ok` gains `kind`; one-line `const c = kind === "SITE_ACCESS" ? { ...copy, ...copy.siteAccess } : copy;` per branch.
- [x] 4.8 RED: extend `src/app/api/auth/register/__tests__/route.test.ts` — register consumes+cleans up on `grantAccess` (not only `grantTripper`); `SITE_ACCESS` token → `roles: [TRAVELER]`, stamp set, invite consumed.
- [x] 4.9 GREEN: in `src/app/api/auth/register/route.ts`, use `peekAccessInvite`/`consumeAccessInvite`; split `grantAccess`/`grantTripper`; stamp `siteAccessGrantedAt`; gate consume+waitlist cleanup on `grantAccess`. Confirm 4.8 passes.

## Phase 5: Email Template + Sender (ADR 6 gap)

- [ ] 5.1 Modify `src/emails/TripperInvite.tsx`: `copy[kind][locale]`, `subjects: Record<AccessInviteKind, Record<"es"|"en", string>>`, `kind` prop threaded to both.
- [ ] 5.2 Modify `src/lib/email/index.ts` (`:850-874`): rename `sendTripperInviteEmail` → `sendAccessInviteEmail(email, token, locale, kind)`, pass `kind` through.
- [ ] 5.3 RED: add/extend a test asserting `SITE_ACCESS` subject/body does not reference "Tripper". (spec: tripper — Admin Trigger Endpoints, email-content scenario from Phase 0.3)
- [ ] 5.4 GREEN: confirm 5.3 passes against 5.1/5.2 implementation.

## Phase 6: Waitlist Invite Route Move + Drop Guard (ADR 8)

- [ ] 6.1 Rename dir `src/app/api/admin/waitlist/[id]/invite-tripper/` → `.../[id]/invite/` (route + `__tests__/route.test.ts` move together).
- [ ] 6.2 RED: in the moved test, drop the `400` existing-user case; assert `issueAccessInvite(email, "SITE_ACCESS")` and `sendAccessInviteEmail(..., "SITE_ACCESS")`, no-400-on-existing-user case. (spec: tripper — Waitlist invite no longer blocked by an existing user)
- [ ] 6.3 GREEN: in `.../invite/route.ts`, issue `kind: "SITE_ACCESS"`; remove the `findExistingUserEmails` guard/import; send with `"SITE_ACCESS"`. Confirm 6.2 passes.

## Phase 7: Users-Table Invite Route (ADR 3/8 table)

- [ ] 7.1 RED: extend `src/app/api/admin/users/[id]/invite-tripper/__tests__/route.test.ts` to assert `issueAccessInvite(target.email, "TRIPPER")` and `sendAccessInviteEmail(..., "TRIPPER")`.
- [ ] 7.2 GREEN: modify `src/app/api/admin/users/[id]/invite-tripper/route.ts` accordingly — path/shapes/existing-TRIPPER-guard unchanged. Confirm 7.1 passes.
- [ ] 7.3 Rename-only: `getTripperInviteStatuses` → `getAccessInviteStatuses` in `src/app/api/admin/waitlist/route.ts` and `src/app/api/admin/users/route.ts`; update their `__tests__` mocks. No logic change.

## Phase 8: `/api/travelers/submit` Stamp (ADR 9)

- [ ] 8.1 RED: extend/create the route's test — successful claim calls `stampSiteAccess(dbUser.id)`; a stamp failure is caught and the response still returns `200`. (spec: site-access-gate — Companion claim grants access)
- [ ] 8.2 GREEN: in `src/app/api/travelers/submit/route.ts`, call `stampSiteAccess(dbUser.id)` in a try/catch after a successful consume, before the notification block. Confirm 8.1 passes.

## Phase 9: Gate Component (ADR 7)

- [ ] 9.1 RED: create `src/components/waitlist/__tests__/GateAwareChrome.test.tsx`, mocking `useSession` across all three statuses. **Named acceptance criterion: `status === "loading"` with `GATE_STORAGE_KEY` already set MUST NOT clear it and MUST NOT show the gate** (Phase 0.4 scenario, design's highest-blast-radius line). Also: authenticated `TRAVELER`+`hasSiteAccess` → unlocked; authenticated `TRAVELER` without → cleared+`accessDenied`; authenticated `admin` without a grant → still unlocked; `unauthenticated` → localStorage untouched. (spec: site-access-gate — Gate Pass Condition, Stale Unlock Revalidation)
- [ ] 9.2 GREEN: in `src/components/waitlist/GateAwareChrome.tsx`, read `status` from `useSession`; derive `sessionGrantsAccess`; guard the clear-on-mismatch effect on `status !== "loading"` then `status !== "authenticated"`; rewrite `accessDenied` per ADR 7. Confirm 9.1 passes — verify this first per design's Risks.
- [ ] 9.3 Modify `src/components/waitlist/WaitlistPage.tsx`: drop `adminLoginLabel` span, rename `adminLoginAction` usage → `loginAction`; simplify CTA to one `<span>`.

## Phase 10: Dictionaries + Types (ADR 11)

- [ ] 10.1 Update `src/lib/types/dictionary.ts`: `waitlist` (`-adminLoginLabel`, `adminLoginAction→loginAction`, rewrite `accessDeniedTitle`/`accessDeniedBody` copy meaning); `adminPages.waitlist` (`actions.inviteTripper→actions.invite`, remove `alreadyMemberHint`, `bulkActions.inviteNothingToDo`, `bulkActions.inviteSkippedNote`; keep `alreadyMemberBadge`); `tripperInviteAccept.siteAccess` block (already typed in 4.6 — confirm placement here).
- [ ] 10.2 Apply the same key delta to `src/dictionaries/es.json` and `src/dictionaries/en.json` in this same task (same commit, per i18n-and-types.md).
- [ ] 10.3 Update the inline hand-maintained `WaitlistDict` interface in `src/components/waitlist/WaitlistPage.tsx` to match `dictionary.ts` — it is not derived, must be edited in lockstep.
- [ ] 10.4 Modify `src/app/[locale]/(secure)/dashboard/admin/AdminWaitlistPageClient.tsx` (ADR 8): endpoint URLs `:88`/`:150` → `/invite`; delete `invitableSelectedIds`, `skippedCount`, the `alreadyMember` `disabled`/tooltip arms on the row button, the skipped-note render; `inviteDisabled = selectedIds.size === 0`; `handleBulkInvite` uses `Array.from(selectedIds)`; rename handler `inviteAsTripper` → `inviteEntry`; use `copy.actions.invite`. Keep the `alreadyMember` chip.
- [ ] 10.5 RED: extend `src/app/[locale]/(secure)/dashboard/admin/__tests__/AdminWaitlistPageClient.test.tsx` — row invite button is enabled on an `alreadyMember` row and fires; bulk invite fans out to the full selection including `alreadyMember`; the chip still renders; no skipped-note. (spec: tripper — Admin Waitlist Invite Availability, Phase 0.2)
- [ ] 10.6 GREEN: confirm 10.5 passes against 10.4's implementation.
- [ ] 10.7 Run `npm run typecheck` — confirm zero remaining references to removed dict keys and to `TripperInvite`/`tripperInviteTokens` symbols anywhere in `src/`.

## Phase 11: Verification + Manual QA (not automatable)

- [ ] 11.1 Run `npx vitest run` (full suite) — confirm every RED/GREEN pair above is green and no prior test regressed.
- [ ] 11.2 Run `npm run typecheck` and `npm run lint` clean.
- [ ] 11.3 Manual: count pending `access_invites` rows before/after Phase 1.4 migration — must match.
- [ ] 11.4 Manual: full path — invited waitlister accepts → registers → verifies email → logs in → reaches the site with the gate on, holding only `TRAVELER`.
- [ ] 11.5 Manual: a signed-in `TRAVELER` with no grant still sees the gate; an admin/tripper without a grant does not.
- [ ] 11.6 Manual: responsive check at ≥360px and ≥1280px on the gate CTA and the accept page.
