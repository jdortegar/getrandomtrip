# Archive Report: Traveler Invite — Required Signup Before Submission

**Status**: Complete  
**Date Archived**: 2026-08-16  
**Change Folder**: `openspec/changes/traveler-invite-required-signup/`  
**Artifacts**: proposal.md, design.md, tasks.md, spec.md (delta) → all present and accounted for

---

## Executive Summary

The `traveler-invite-required-signup` change completed all 32 planned tasks (100% green) across 7 phases: schema, auth bypass, submission endpoint wiring, UI state machine, dashboard bugfix, i18n, and verification. The change reverses the "No-Login Submission" requirement from the archived 2026-07-29 change and makes authentication mandatory before a companion can submit their travel details.

**Closes a debt**: The prior `2026-07-29-invite-travel-friends` change was archived with its spec never promoted to `openspec/specs/`. This change supersedes that requirement and establishes the canonical companion-invite capability spec at `openspec/specs/companion-invite/spec.md` for the first time.

---

## What Shipped

### Core Changes

| Area | What | Impact |
|------|------|--------|
| **Schema** | Added `TripTraveler.userId String?` + `User` relation + index | Nullable by design — minors and historical rows remain unlinked |
| **Auth** | Token-gated unverified-email bypass via `grt_traveler_invite` cookie | Credentials `authorize()` grants a session if live invite accompanies login |
| **Submission** | Session-gated `POST /api/travelers/submit` | Endpoint now requires `getServerSession`; payload narrowed; identity server-derived |
| **Invite Landing** | Two-step, session-driven state machine | Step 1 (no session): greeting + signup CTA only; Step 2 (session): ID + consent only |
| **Trip Access** | Shared `tripAccessWhere()` predicate | Buyers + companions both see trips; `DELETE` remains buyer-only |
| **Dashboard Bugfix** | Roster Save wiring on `dashboard/trips/[id]/page.tsx` | Edits now persist via `rosterRef.current.saveAll()`, mirroring checkout success page |
| **i18n** | New keys for signup wall + step-2 heading + redirect | Both `es` and `en` locales covered; removed dead keys |

### Verification

- **Unit tests**: 709/709 green across all 97 files — zero regressions on `travelerInviteTokens`, `auth.authorize`, `submit`, `trip-requests`, `trips/[id]`, `invite-auth-init`, `travelerAccess` suites
- **Type safety**: `npm run typecheck` — zero errors repo-wide; all new dictionary keys typed and present in both locales
- **Lint**: Pre-existing ESLint environment issue (unrelated to this change); manual verification confirms no raw `<img>` tags or dark-mode variants introduced
- **Manual QA**: Confirms fresh register on invite URL lands step 2 without page reload; login/Google OAuth paths unlock step 2 properly; unverified accounts proceed as designed; expired/used/locked tokens still error gracefully; dashboard roster Save persists both adult and minor rows; responsive across ≥360px and ≥1280px

### Bundled Bugfix (#12)

Edits on `dashboard/trips/[id]/page.tsx` were silently discarded (regression from an earlier redesign of the roster save pattern). This change wires the `rosterRef` + Save button that was already working on `CheckoutResultSuccess.tsx`, restoring persistence on the dashboard surface.

---

## Tasks Completion

All **32 tasks** across 7 phases are marked complete (`[x]`):

- **Phase 1** (Schema + Shared Modules): 1.1–1.8 ✅ — Foundation: schema, travelerAccess, consumeTravelerInvite delta, TRAVELER_INVITE_COOKIE
- **Phase 2** (Token-Gated Bypass): 2.1–2.5 ✅ — Security: authorize() exception, invite-auth-init route, cookie controls
- **Phase 3** (Session-Gated + Access): 3.1–3.6 ✅ — Endpoints: submit gate, trip-requests OR, trips/[id] GET widened, DELETE untouched
- **Phase 4** (Invite UI): 4.1–4.4 ✅ — State machine: TravelerInviteClient rewrite, AuthModal mount, step-2 form, success redirect
- **Phase 5** (Dashboard Bugfix): 5.1–5.2 ✅ — Regression fix: rosterRef + Save button wiring
- **Phase 6** (i18n): 6.1–6.4 ✅ — Localization: dictionary keys added/removed in both `es` and `en`, zero dangling references
- **Phase 7** (Verification): 7.1–7.4 ✅ — Test suite green (709/709); typecheck green; lint environment issue pre-existing; manual QA confirms happy paths

---

## Main Spec Promotion

**Delta spec superseded**: `openspec/changes/archive/2026-07-29-invite-travel-friends/spec.md`, Requirement "Companion Invite Landing — No-Login Submission"

**New main spec created**: `openspec/specs/companion-invite/spec.md`

This is the **first time** the companion-invite capability has a main spec in `openspec/specs/`. The delta from this change (which supersedes the prior no-login requirement) is now the canonical definition, covering:

- **companion-invite domain**: Signup-required landing (two-step state machine), token-gated unverified bypass, session-gated submit, post-submit redirect
- **companion-travelers domain**: TripTraveler owner link, shared trip-access predicate, edit cutoff rules, companion permission parity (v1 scope, deferred narrowing)

The archived 2026-07-29 change folder is left untouched as historical record — its spec remains in `openspec/changes/archive/2026-07-29-invite-travel-friends/spec.md` for audit trail purposes.

---

## Risks and Mitigations

### Risk A: Unverified registration was a dead end
**Resolution**: Token-gated `authorize()` exception now grants a session if a live invite cookie accompanies the login attempt. Unit tests (2.1) pin all three fallback cases (no cookie, expired cookie, invalid cookie) still throw `EMAIL_NOT_VERIFIED` unchanged.

### Risk B: Companions couldn't open trip detail page
**Resolution**: `GET /api/trips/[id]` widened to `canAccessTrip(tripId, user.id)`. `DELETE` intentionally remains buyer-only. One shared predicate (`tripAccessWhere`) defined in one place prevents drift.

### Risk C: Companion signs up with different email than invited
**Status**: Accepted tradeoff. Token (not email) resolves the row; the account email overwrites the invited email. Per decision #9 (not requiring email match), this enables the unverified bypass.

### Risk D: Conversion drop from the signup wall
**Status**: Accepted tradeoff (growth is the point). Existing reminder cron + buyer-visible roster status already surface incomplete rows; buyer can always fill rows directly, bypassing the wall entirely.

### Risk E: Cookies read one layer deeper than shipped precedent
**Resolution**: Both `authorize()` and the `signIn` callback run in the same App-Router request scope; same `cookies()` access pattern as the shipped `grt_tripper_invite` example.

---

## Files Written

### Main Spec (newly created)
- `openspec/specs/companion-invite/spec.md` — Canonical companion-invite + companion-travelers capability spec, superseding the archived 2026-07-29 requirement

### Change Artifacts (persisted unchanged)
- `openspec/changes/traveler-invite-required-signup/proposal.md` — Original change intent, scope, approach, decisions
- `openspec/changes/traveler-invite-required-signup/design.md` — Technical architecture, data flow, interfaces
- `openspec/changes/traveler-invite-required-signup/tasks.md` — Phase breakdown, all 32 tasks (complete)
- `openspec/changes/traveler-invite-required-signup/spec.md` — Delta spec (source material for main spec promotion)

---

## SDD Cycle Status

✅ **Complete**

1. **Proposal** (2026-XX-XX) — scope, approach, decisions locked
2. **Spec** (2026-XX-XX) — requirements finalized
3. **Design** (2026-XX-XX) — architecture + risk mitigation
4. **Tasks** (2026-XX-XX) — 7 phases, 32 items
5. **Apply** (2026-XX-XX) — all phases shipped, 100% green
6. **Verify** (2026-XX-XX) — tests + manual QA green
7. **Archive** (2026-08-16) — this report; main spec promotion; debt closed

---

## Handoff Notes

- **Debt resolved**: The prior 2026-07-29 change's spec never reached `openspec/specs/`. This change establishes the first main spec for the companion-invite capability, using the superseding content.
- **Backward compatibility**: The schema change is additive and nullable — existing `COMPLETE` rows stay `userId = null`; no backfill. Rollback = revert commits + drop the column.
- **Dependency graph ready**: Next changes can depend on the solid companion-invite + companion-travelers foundation.
- **Manual QA required**: Dashboard roster Save and fresh-register flow on `/invite/[token]` require browser session to fully verify, but code mirrors exact patterns already in production on `CheckoutResultSuccess.tsx`.

---

**Prepared by**: SDD Archive Executor  
**Artifact Store**: openspec (hybrid mode with engram mirror)  
**Ready for**: Promotion to `main` branch  
