# Companion invite auto-send

## Objective

When a buyer adds a companion, the companion receives an email invitation, creates an account, and sees the trip in their trips dashboard.

## Problem

- The invite email is only sent on an explicit button click (`TravelerRow.tsx` `handleSendInvite`).
- A buyer-filled row becomes `COMPLETE` without a `userId` link, so the companion never sees the trip (`tripAccessWhere` requires `TripTraveler.userId`).
- After the details cutoff, a fully populated row rejects the invite token as `locked` (`travelerInviteTokens.ts`), so late companions can never join.
- The token alone grants access; any account can accept a forwarded or mistyped invite.
- The email copy frames the invite as paperwork and omits trip dates.

## Why

First real case: Ana Ortega's XSED trip (Oct 3–4, 2026). Her cutoff (T-72h) is around Sep 30, so phase 1 must ship before Oct 3.

## Scope

### Phase 1 — Ana-critical (this release)

- [x] **T1** Accept until trip ends: invite tokens remain acceptable after the details cutoff until the trip `endDate` (fallback `startDate`); after cutoff, acceptance only links `userId` + consent and populated fields stay frozen. Manual invite/resend is allowed after cutoff.
  - Decision: new peek/consume reason `ended` (replaces `locked`, which nothing produces anymore; dictionary key `landingReasonLocked` replaced by `landingReasonEnded`, es + en). "Ended" = `now >= start of the UTC day after endDate` (`isTripEnded` in `travelerPolicy.ts`), so the whole end date is inclusive; null endDate falls back to startDate; no dates = never ends.
  - Decision: `POST /api/travelers/[id]/invite` drops the `locked` 403; returns `403 ended` after the trip and `409 already_joined` when `userId` is set. The `locked && row.userId && row.userId !== claimant` protection in `consume` is kept.
- [x] **T2** Email match: `POST /api/travelers/submit` rejects when the session email differs (case-insensitive, trimmed) from `TripTraveler.email`. Invite page prefills and locks the invited email in the sign-up form and shows a masked "sent to j***@…" message for a mismatched signed-in account.
  - Decision: the check lives in `consumeTravelerInvite` (row in hand, same CAS write) and returns `email_mismatch`; the submit route maps it to `403 { error: "email_mismatch", reason: "email_mismatch" }`. Rows without email and requests without session email are rejected too. Peek now also returns `invitedEmail` (prefill) and `maskedEmail`; the page passes both to the client; `AuthModal` gained optional `lockEmail` (read-only email, used with `initialEmail`). Mismatched signed-in accounts see the localized message + "Use a different account" (`signOut`). Google sign-in stays; a Google account with another email hits the same message.
- [x] **T3** Auto-send: `PATCH /api/travelers/[id]` issues a token and sends the invite when an ADULT row's email is first saved or changed to a different value and the row is not linked (`userId` null). Same-email re-save sends nothing. Button relabeled "Resend invite".
  - Status semantics (least invasive): the auto-invited row becomes `INVITED` (same as the manual invite today). `COMPLETE` is reserved for "companion accepted" because `resolveTravelerInvite` reads `status === COMPLETE` as `used`. So PATCH never flips an `INVITED` row to `COMPLETE`, and roster completeness is now derived from details: new `isTravelerRosterComplete` (`status in COMPLETE|INVITED` and no missing details) used by `getRosterForTrip.submitted`, `TravelerRosterSection` count and `saveAll`. A bare `PENDING` row still counts as incomplete (keeps failed-save detection). Cron Pass 1 (selects `INVITED`) is unchanged and still reminds invited-not-linked rows. `submittedAt` is stamped when details first complete if not already stamped.
  - PATCH returns `invited: true` when an invite went out; failures to issue/send are logged and never fail the save. `TravelerRow` shows the "Invited {date}" note and skips the follow-up `POST /invite` when the save already sent one (avoids a double email / token rotation). Removed unused dictionary key `sendInviteAction`.
- [x] **T4** Email rewrite: subject "{Buyer} added you to their randomtrip"; body with trip dates and trip type, never the destination; CTA "SEE MY TRIP"; expiry line kept; es/en in buyer locale.
  - `sendTravelerInviteEmail` is now a fire-and-forget wrapper over new awaitable `deliverTravelerInviteEmail` (rejects on provider failure; used by the backfill). Trip type label reuses the exported `travelerTypeLabels` from `TripStartVouchers.tsx` (+ `XSED` special case). Dates via `Intl.DateTimeFormat.formatRange` (UTC). `BASE_URL` untouched (T9). Subject helper is `getSubject(locale, buyer)` (old static `subjects` export removed).
- [x] **T5** Backfill script: one-off, dry run by default, lists ADULT rows with email, `invitedAt` null, `userId` null, on paid trips not yet ended; `--send` sends invites. Real send requires explicit user approval of the dry-run list.
  - `scripts/backfill-companion-invites.ts` (`npm run db:backfill-companion-invites`). Pure `selectBackfillCandidates` (also excludes CANCELLED trips) + `runBackfill(client, {send, env, now}, deps)`; `--send` refused unless `RT_DEPLOY_ENV=production` (checked before env files/DB load; must be exported in the shell). App modules (token issuer, mailer) are imported dynamically only in the CLI path so importing the script stays side-effect free. NEVER executed against any DB in this phase. A row whose token was issued but email failed no longer matches (`invitedAt` set) and is listed as FAILED for manual resend.

### Phase 2 — follow-up release

- [x] **T6** Reduced read-only companion view (no price, no other travelers' ID/DOB, no editing others or inviting).
  - Decision: role comes from `tripRoleFor`. `getRosterForTrip(tripId, viewerUserId)` now requires the viewer and returns `viewerRole`; a companion gets their own linked row in full (`isSelf: true`) and every other row as a name only (email, ID, DOB, invite dates, link all null/false). `submitted` stays the buyer-side trip count. `GET /api/trips/[id]` returns `role` and, for companions, omits `payment`, `basePriceUsd` and raw `travelers` (`omitBuyerOnlyFields` in `src/lib/trips/companionTripView.ts`); `GET /api/trips` (list) strips `payment`/`basePriceUsd` on joined trips. `trip-summary` is already buyer-only (payment owner) and passes the viewer id, so roster parity holds.
  - Decision: companion PATCH only on their own linked row (403 otherwise) within existing cutoff rules, and may not change the row's email (403; re-sending the same address is fine). `POST /invite` is buyer-only (403 for companions). Dashboard trip page hides cost summary, payment card and invite/resend controls for companions; others render as `TravelerReadOnlyRow` (name only).
  - Note: the v1 "Companion Permission Parity" requirement was removed from the spec and replaced by "Companion Reduced Read-Only View". The list card UI may still show a catalog-based price estimate client-side when `basePriceUsd`/`payment` are absent (only `UnpaidTripsAlert` shows prices; companions' trips are paid).
- [x] **T7** One reminder for invited-but-not-linked companions at invite + 3 days or 24h before departure, whichever comes first.
  - Decision: Pass 1 queries ADULT, `invitedAt` set, `userId` null, `reminderSentAt` null, email present, paid and not CANCELLED/COMPLETED trips; due-time (`min(invitedAt+3d, start-24h)`) and `isTripEnded` are applied in memory. Not gated by status or the details cutoff. Delivery is now awaited (`deliverTravelerReminderEmail`, replaces fire-and-forget `sendTravelerReminderEmail`) and `reminderSentAt` is stamped only after provider acceptance, so a failed send retries next run (token is rotated again; `invitedAt` refreshes, which can delay the 3-day term). Reminder template reframed to "see my trip" (dates + type, TGIS/XSED, empty-buyer fallback). Pass 2 untouched.
- [x] **T8** Buyer roster badge per companion: Invitation sent / Joined / No email.
  - Decision: DTO gains `joined` (derived from `userId`, id never exposed); `invitedAt` already existed. `TravelerRow` shows an invite badge next to the unchanged status badge: No email / Invitation sent {date} / Joined (Resend hidden) / plus a fourth "Invite not sent" for email-saved-but-never-invited rows (not in the original list; needed for failed issuance and ended trips). Keys under `inviteTravelers.inviteBadge*`.
- [x] **T9** Invite URL built from the deploy origin instead of hardcoded `https://getrandomtrip.com`.
  - Decision: `getInviteOrigin`/`buildTravelerInviteUrl` in `src/lib/travelers/travelerInviteUrl.ts`; production always `https://getrandomtrip.com`, nonproduction uses `getNonproductionOrigin()` and falls back to the production URL only when null (explicit in code and doc). Applied to the traveler invite and reminder emails only.
- [x] **T10** (owner confirmed) Buyer cannot change the email of a companion who already joined.
  - Decision: PATCH returns `403 email_locked_joined` for any email change (including clearing) on a row with `userId` set, for every viewer; same-address re-save and other edits still work. `TravelerRow` makes the email read-only on a Joined row with hint `emailLockedJoinedHint` (es/en). The earlier companion email rule stays (it now reports the same code for linked rows).
- [x] **T11** (review R1-001) Invite peek exposes only the masked email to viewers who have not signed in with the invited address; the full email is no longer sent in the server-rendered payload.
  - Decision: `peekTravelerInvite(token, viewerEmail?)` returns `invitedEmail` only when the viewer's session email matches, plus `viewerEmailMatches`; `consume` results never carry it. The page reads the session server-side and forwards `emailMismatch` (boolean). Sign-up UX: masked hint (`landingEmailHint`) above the CTA, `AuthModal` opens with an editable, unprefilled email (`lockEmail`/`initialEmail` no longer used by the invite; the AuthModal props remain). After in-page sign-up the client cannot compare, so a wrong address is caught by the server `email_mismatch` on submit.
- [x] **T12** (review R1-002, owner decided) Require a verified email before an invite can be accepted.
  - Decision: `consumeTravelerInvite` takes `emailVerified` (DB value) and returns `email_unverified` when a claim has no verified email (after the mismatch check); `POST /api/travelers/submit` selects `emailVerified` from the User row (not session/JWT/body) and maps it to `403 email_unverified`. The session callback now exposes `user.emailVerified` (boolean from the DB on every read). Google: new Google users were already created verified; an existing unverified account signing in with Google is now marked verified.
  - Decision: the `grt_traveler_invite` bypass is KEPT (documented in `auth.ts` and the spec): it only yields a session so the invite page can show its in-page "check your inbox" state; enforcement at claim means it grants nothing. Removing it would send unverified sign-ups through the modal's EMAIL_NOT_VERIFIED path with no session, which also works but drops the in-page state.
  - Decision: return path. Register accepts `inviteReturnPath`; `safeInviteReturnPath` (`src/lib/auth/inviteReturnPath.ts`) allows only `/(es|en)/invite/{token}` (no scheme/host/query/fragment). `sendVerificationEmail(userId, token, returnPath?)` appends `&next=`; the verify page re-validates it server-side and `VerifyEmailClient` redirects there instead of login. The token only appears in the path and is never logged.
  - Decision: invite page shows `landingVerifyInbox` for a signed-in unverified session or on `email_unverified`. No Resend action: there is no resend endpoint for a signed-in session (resend today only happens by re-submitting credentials in the sign-in modal), so none was built.
- [x] **T13** Backfill dry run works without `RT_DEPLOY_ENV=production` (load app modules that apply the DB-host guard only on `--send`, or select candidates with the script's own client).
  - Decision: CLI logic moved into exported `runCli(options, {withPrisma, loadSendDeps, log})`; `loadSendDeps` (dynamic import of token issuer + mailer) is called only with `--send`. Tests prove a dry run never calls it and that `--send` still refuses outside production before touching the DB. NOT executed against any database.
- [x] **T14** Review follow-ups: PATCH reports `invited` only when a token was actually issued (R3/R4); stale cutoff doc in `travelers/submit/route.ts` (R2); invite subject safe with an empty buyer name (R3).
  - Decision (a): the row now becomes `INVITED` only through `issueTravelerInvite` (PATCH no longer pre-writes `INVITED`), so a failed issuance leaves the old status and no `invitedAt`; the response carries `inviteFailed: true` and `TravelerRow` shows the send error while keeping Resend available. Success response mirrors `status: INVITED` + `invitedAt`. (b) doc comment rewritten. (c) `getSubject`/body fall back to "Te sumaron a un randomtrip" / "You've been added to a randomtrip" for blank buyer names (also in the reminder).

## Constraints

- Email delivery stays disabled in nonproduction (`sendMail.ts`); QA happens in production with Ana's companion.
- All user-visible strings in `es` and `en` dictionaries (or email-local es/en maps, matching existing templates).
- Never send production emails without the user approving the dry-run list.
- Commits only with explicit user approval each time.

## Acceptance criteria

- Saving a new companion email triggers exactly one invite; re-saving the same email triggers none; changing it rotates the token.
- A companion signed in with the invited email can accept before and after the cutoff, until the trip ends; the trip then appears in their dashboard.
- A companion signed in with a different email cannot accept.
- Fields populated before the cutoff are unchanged by a post-cutoff acceptance.

## Checks

- TDD: strict mode enabled (source: user global config "Strict TDD Mode: enabled"); runner `npx vitest run <path>` (`npm test` = `vitest run`). RED → GREEN → REFACTOR per task.
- `npm run typecheck`, `npm run lint`, focused vitest files per task, full `npm test` at phase close.

## Delivery

- Branch: `feat/companion-invite-auto-send` from `origin/develop` (efd2e8ac).
- Strategy: `ask-on-risk` (default). Phase 1 forecast ~500–700 authored lines including tests, above the ~400 budget; chain strategy to be asked at first commit.

## Progress

| Task | Route | Trigger evidence | Status | Commit | Review |
|------|-------|------------------|--------|--------|--------|
| T1 | delegated direct (one writer) | 2+ non-trivial files | done | 7cc4496a | high risk, granted, approved (lineage review-889c9ee9ee7cc62f, acknowledged) |
| T2 | delegated direct | 2+ non-trivial files | done | ebc860bd | same review |
| T3 | delegated direct | 2+ non-trivial files | done | 245675be | same review |
| T4 | delegated direct | 2+ non-trivial files | done | 53f00c67 | same review |
| T5 | delegated direct | 2+ non-trivial files | done | ad25b380 | same review |
| T6 | delegated direct (one writer) | 2+ non-trivial files | done (tests, typecheck, lint, full suite green); uncommitted | none — awaiting user approval | not assessed |
| T7 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |
| T8 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |
| T9 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |
| T11 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |
| T13 | delegated direct | 2 files | done; uncommitted | none — awaiting user approval | not assessed |
| T14 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |
| T10 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |
| T12 | delegated direct | 2+ non-trivial files | done; uncommitted | none — awaiting user approval | not assessed |

Phase 1 delivery: single PR #217 → develop (merge 071a5a6c), release PR #218 → main (merge fb56c68e), 2026-10-01. Production backfill: dry run listed 1 candidate (the first real companion), owner approved, `--send` reported `sent`.

## Next step

Phase 2 on branch `feat/companion-invite-phase-2` (from origin/develop 071a5a6c): T6–T9, T11, T13, T14 implemented and uncommitted. Next: review the diff and approve commits (suggested slices: T13 script, T9+T14c emails, T7 reminder, T11 invite privacy, T6+T8 roster/companion view with T14a/b). T10 and T12 (owner decisions) are now implemented too, uncommitted; suggested extra slices: T12 server (consume/submit/auth), T12 return path + invite UX, T10.

## Verification log (phase 1)

- Focused vitest files: travelerInviteTokens, travelerPolicy, travelerEmail, travelerRoster, travelers/[id] (PATCH + invite), travelers/submit, TravelerInviteClient, TravelerRow, TravelerRosterSection, AuthModal, TravelerInvite email, sendTravelerInviteEmail, backfill-companion-invites, scriptImports: all pass.
- `npm run typecheck`, `npm run lint`: clean. `npm test`: 523 files / 5564 tests pass (one earlier run had load-induced flakes in trip-documents PDF render + eslintConfig tests; they pass in isolation and on rerun).
- Parent spot check (2026-09-30): `npx vitest run src/lib/travelers src/app/api/travelers src/components/app/travelers src/components/travelers` → 15 files / 167 tests pass; `npm run typecheck` clean.
- Parent fix (T4): en email labels XSED trips as TGIS per branding rule. New test "labels XSED trips as TGIS in en" observed RED (1 failed / 5 passed) then GREEN (6/6); `npm run lint` clean.

## Verification log (phase 2)

- TDD: RED observed before implementation for T13 (4 failing `runCli` tests), T9/T14c/T7-email (12 failing across URL, reminder email, invite subject), T7 pass (9 failing), T11 (peek, client; page tests failed first but partly on a mock-setup bug, fixed before GREEN), T14a (2 failing), T6/T8 (16 failing server, 9 failing UI). Two additions had no isolated RED: the blank-email skip test in the reminder pass and the T14b comment-only edit.
- Focused vitest files and full `npm test`: 528 files / 5632 tests pass; `npm run typecheck` and `npm run lint` clean.
