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

- [ ] **T6** Reduced read-only companion view (no price, no other travelers' ID/DOB, no editing others or inviting).
- [ ] **T7** One reminder for invited-but-not-linked companions at invite + 3 days or 24h before departure, whichever comes first.
- [ ] **T8** Buyer roster badge per companion: Invitation sent / Joined / No email.
- [ ] **T9** Invite URL built from the deploy origin instead of hardcoded `https://getrandomtrip.com`.
- [ ] **T10** (assumption, confirm) Buyer cannot change the email of a companion who already joined.

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
| T1–T5 | delegated direct (one writer) | 2+ non-trivial files | implemented, verified (focused tests, typecheck, lint, full test); uncommitted | none — awaiting user approval | not assessed |

## Next step

Review the uncommitted phase 1 diff, approve commits (suggested slices: T1+T2 server, T2 client, T3, T4, T5), then deploy before Oct 3. After deploy: run the backfill dry run in production and have the owner approve the list before any `--send`. Phase 2 (T6–T10) remains.

## Verification log (phase 1)

- Focused vitest files: travelerInviteTokens, travelerPolicy, travelerEmail, travelerRoster, travelers/[id] (PATCH + invite), travelers/submit, TravelerInviteClient, TravelerRow, TravelerRosterSection, AuthModal, TravelerInvite email, sendTravelerInviteEmail, backfill-companion-invites, scriptImports: all pass.
- `npm run typecheck`, `npm run lint`: clean. `npm test`: 523 files / 5564 tests pass (one earlier run had load-induced flakes in trip-documents PDF render + eslintConfig tests; they pass in isolation and on rerun).
- Parent spot check (2026-09-30): `npx vitest run src/lib/travelers src/app/api/travelers src/components/app/travelers src/components/travelers` → 15 files / 167 tests pass; `npm run typecheck` clean.
- Parent fix (T4): en email labels XSED trips as TGIS per branding rule. New test "labels XSED trips as TGIS in en" observed RED (1 failed / 5 passed) then GREEN (6/6); `npm run lint` clean.
