# Verify Report: invite-travel-friends

**Verdict: FAIL** (2 CRITICAL, 5 WARNING, 3 SUGGESTION)

## Execution Evidence

| Check | Result |
|---|---|
| Branch | `develop`, 4 commits present (`9f6fc4ce`, `f5410844`, `af476667`, `60ad8049`) |
| `npm run typecheck` | Clean, 0 errors |
| `npm test` | 573/573 passed, 81 test files, 0 regressions |
| `npm run lint` | Not run — pre-existing, unrelated `next lint` environment breakage (confirmed out of scope) |
| tasks.md | 48/48 checked `[x]` across all 4 phases — matches apply-progress and actual code state |

## Completeness

All 48 tasks across Phase 1 (schema/token/roster core), Phase 2 (write/read routes), Phase 3 (email/cron), Phase 4 (UI/i18n) are checked and match the committed code. No task claims completion without corresponding source.

## Spec Compliance Matrix (9 requirements / 24 scenarios)

| Requirement | Scenarios | Status |
|---|---|---|
| Roster Creation on Payment Success | Normal party, Malformed paxDetails, Solo traveler | PASS — `computeTravelerCap` (`src/lib/travelers/travelerRoster.ts`) defensively coerces non-numeric to 0, clamps ≥0; `ensureRoster` creates ADULT-then-MINOR; `TravelerRosterSection` returns `null` at `cap === 0` |
| Adult Row Fields and Invite Action | Buyer sends first invite, Resend rotates token, Buyer fills adult row directly | PASS — `issueTravelerInvite` rotates hash in place; `TravelerRow` auto-saves adult fields on blur via PATCH, flipping to COMPLETE without ever sending an invite |
| Minor Row Direct-Save Validation | Complete minor save, Incomplete minor save rejected | PASS — `PATCH /api/travelers/[id]` requires all 3 minor fields before COMPLETE, rejects with 400 + inline error otherwise, status never downgraded |
| Edit Rules and Cutoff Enforcement | Pre-cutoff edit allowed, Post-cutoff write rejected server-side, No add/remove at any time | PASS — `isRosterLocked` checked server-side in both `PATCH` and `invite` routes (not just rendered); PATCH is single-row only, no create/delete path exists |
| Blocking Until Cutoff | Incomplete rows block processing pre-cutoff, Cutoff pass locks and stops reminders | PASS w/ WARNING — reminders continue correctly (`runPass1`) and lock correctly (`runPass2`), but no discrete "trip processing eligibility" function exists anywhere in the codebase for the literal "not-yet-processable" wording (see WARNING 2) |
| Buyer Notification on Companion Completion | Companion submits via invite, No duplicate notification on re-render | PASS — one `Notification` created per completion in `submit/route.ts`; re-render doesn't call the route so no duplicate risk |
| Companion Invite Token Lifecycle | Valid token peek, Expired token, **Already-consumed token**, Submission after cutoff rejected | **FAIL on "Already-consumed token"** — see CRITICAL 1 |
| Companion Invite Landing — No-Login Submission | Consent gates submit, Destination never revealed, Account creation optional | PASS — client+server consent gate, no destination reference anywhere in `TravelerInviteClient.tsx`/`/invite/[token]/page.tsx`, `/login` link is optional |
| Gender-Neutral Bilingual Invite Copy | Dictionary parity, Neutral greeting rendered | PASS — `inviteTravelers` has exactly 51 keys in both `es.json`/`en.json` (0 drift); greeting uses "su randomtrip" (ES) / "their randomtrip" (EN), no gendered pronoun |

## CRITICAL

**1. "Already-consumed token" scenario is unreachable in production — dead branch masked by over-mocked tests.**

`resolveTravelerInvite` (`src/lib/travelers/travelerInviteTokens.ts:68-88`) looks up the row via `prisma.tripTraveler.findUnique({ where: { inviteTokenHash: tokenHash } })`. `consumeTravelerInvite` nulls `inviteTokenHash` on successful submission. Once null, **no row can ever be found again by re-hashing the original plaintext** — Prisma's unique-column lookup for a specific non-null hash value will never match a column that is now `null`. So a companion who re-visits (or double-clicks) an already-submitted invite link gets `row = null` → `{ ok: false, reason: "invalid" }`, not `{ ok: false, reason: "used" }`.

The unit tests (`travelerInviteTokens.test.ts:96-111`, `submit/route.test.ts:95-104`) "pass" only because they mock `prisma.tripTraveler.findUnique` to directly return a row with `inviteTokenHash: null` regardless of the `where` clause — that's not how Prisma's `findUnique` on a unique column actually behaves, so the test gives false confidence. Landing page shows the generic `landingReasonInvalid` copy instead of the intended `landingReasonUsed` copy for this case — the two are different, user-facing strings in both locales, so this is an observable UX defect, not just an internal label mismatch.

Fix requires resolving the plaintext token to a row by an identifier that survives consumption (e.g. keep a separate `consumedTokenHash` or store `travelerId` in the URL alongside the token, or never null the hash and instead check `status === "COMPLETE"` to distinguish "used" from "invalid").

**2. Hardcoded Spanish-only notification title violates the project's mandatory i18n rule.**

`src/app/api/travelers/submit/route.ts:61` — `title: "Un acompañante completó sus datos de viaje"` is a literal Spanish string, sent regardless of the buyer's locale. This is a user-visible string per `NotificationItem.tsx` (renders `notification.title` verbatim, no runtime i18n lookup). Per `.claude/rules/i18n-and-types.md`: *"Any code that introduces user-visible text MUST be localized in both es and en in the same change. No exceptions."* This is not one of the 5 confirmed scope-reduction decisions listed in the task brief.

This also diverges from the established convention already present elsewhere in this exact codebase — e.g. `src/app/api/admin/experiences/[id]/send-to-tripper/route.ts:114-116` resolves `owner.locale` and picks `dict.notifTitle` from the locale-appropriate JSON before calling `notification.create`. English-locale buyers get a Spanish notification title with no equivalent English string added to either dictionary.

## WARNING

1. **spec.md/API naming drift.** `spec.md`'s API Contracts table lists `POST /api/travelers/submit-from-token`; the actual route, `design.md`, and `tasks.md` all consistently use `POST /api/travelers/submit`. Functionally identical, but `spec.md` itself was never updated — flag for correction so the artifact doesn't mislead future readers.
2. **No discrete "trip processing eligibility" function for the "Blocking Until Cutoff" requirement's literal wording** ("the trip is marked not-yet-processable"). Only reminders-continue / lock-at-cutoff are implemented and tested; there's no codebase feature today that consumes a "not-yet-processable" flag (no other trip-progression step currently checks traveler completeness), so this is satisfied indirectly (roster `locked`/`submitted` fields exist for a future consumer) rather than by an explicit, tested gate.
3. **"No icon actions" wording vs. implementation.** Spec says locked rows render "disabled inputs with no icon actions." `TravelerRow.tsx` keeps the `TableIconButton` present (disabled, icon swapped to `Lock`) rather than omitting it. Functionally locked and server-enforced regardless, but a literal reading of the spec text isn't met — the icon is present, just non-interactive.
4. **`npm run lint` still not independently re-run** in this verify pass — confirmed same pre-existing, unrelated `next lint` sandbox breakage already flagged in apply-progress. Still owed before merge in a normal shell.
5. **Manual QA (task 4.14) remains code-review-only**, not a real click-through pass (≥360px / ≥1280px) — carried forward from apply-progress as still outstanding before merge.

## SUGGESTION

1. Locked-banner "days remaining" (`TravelerRosterSection.tsx:74-86`) always computes to `0` once locked, since the deadline is necessarily in the past by definition of being locked — harmless but slightly redundant copy path.
2. `runPass1`'s window uses a strict `gt` cutoff boundary, excluding the exact cutoff instant from receiving a final reminder — a minor edge-case interpretation of "up to and including the cutoff pass," unlikely to matter at hourly cron granularity.
3. `BASE_URL = "https://getrandomtrip.com"` is hardcoded again in the two new email senders — consistent with the rest of `src/lib/email/index.ts` (pre-existing pattern, not introduced by this change) but worth eventually centralizing into an env var repo-wide.

## Recommendation

Route back to `sdd-apply` to fix the 2 CRITICAL items (token-consumption lookup + notification i18n) before re-running `sdd-verify`. WARNINGs 1 and 3 are cheap doc/UX fixes; WARNINGs 4-5 are process gates (lint + manual QA) already known and owed before merge regardless of this report.
