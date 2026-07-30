# Verify Report: invite-travel-friends

**Verdict: PASS WITH WARNINGS** (0 CRITICAL, 4 WARNING, 3 SUGGESTION)

This is a RE-VERIFY pass following fix commit `00f49c50` (`fix(travelers): distinguish used tokens from invalid ones, localize completion notification`), applied on top of the 4 implementation commits (`9f6fc4ce`, `f5410844`, `af476667`, `60ad8049`) on `develop`. Both prior CRITICAL findings were independently re-checked against source and are genuinely resolved, not just claimed.

## Execution Evidence

| Check | Result |
|---|---|
| Branch | `develop`, 5 commits present (4 implementation + `00f49c50` fix) |
| `npm run typecheck` | Clean, 0 errors |
| `npm test` | 578/578 passed, 81 test files, 0 regressions (up from 573/573 pre-fix — 5 new tests added) |
| `npm run lint` | Not run — pre-existing, unrelated `next lint`/Next 16 environment breakage (confirmed out of scope, per instruction) |
| tasks.md | 48/48 checked `[x]`, matches apply-progress and code state |

## Completeness

All 48 tasks across Phase 1–4 remain checked and match the committed code, including the fix batch's changes.

## CRITICAL — Re-Verification

### CRITICAL 1 (prior): Already-consumed token resolved to "invalid" instead of "used" — RESOLVED, confirmed genuine

Re-inspected `src/lib/travelers/travelerInviteTokens.ts`:

- `consumeTravelerInvite` (lines 119–140) no longer includes `inviteTokenHash` in its update payload — the hash is deliberately left untouched/persisted on the row after consumption.
- `resolveTravelerInvite` (lines 78–98) now checks `if (row.status === "COMPLETE") return { ok: false, reason: "used" }` **before** the expiry check and **before** the `isRosterLocked` check — so a used-but-now-also-expired-or-locked token still correctly reads "used", not "expired"/"locked".
- **(a) Confirms it prevents a real Postgres unique-hash lookup from going stale**: because the hash is never nulled, `prisma.tripTraveler.findUnique({ where: { inviteTokenHash: tokenHash } })` will still find the row on a re-visit — the fix is structurally correct for real Prisma/Postgres unique-column semantics, not just for the mocked test.
- **(b) Test now genuinely simulates Prisma's `where.inviteTokenHash` matching semantics.** Verified `src/lib/travelers/__tests__/travelerInviteTokens.test.ts`: a real `hashPlaintext()` helper (identical sha256-hex logic to production `hashToken`) computes the persisted hash, and `findUnique` is mocked with `mockImplementation((args) => args.where.inviteTokenHash !== persistedHash ? null : <row>)` — the mock only returns the row when the hash argument actually matches, which is a faithful simulation of a real unique-column lookup. This is a materially different (and correct) test design vs. the prior unconditional-return mock. Also added: a re-consumption test (`consumeTravelerInvite` called twice with the same plaintext) asserting both calls return `used` and `prisma.tripTraveler.update` is never called — directly covers point (d).
- **(c) Checked `PATCH /api/travelers/[id]` for a second path that could set `status: "COMPLETE"`** and cause a false "used": it does — a buyer filling in an adult row directly (`fullName`+`email`+`idDocument` all present) flips `status` to `COMPLETE` via the PATCH route (`route.ts:69-79`), independent of the invite-token flow. This is NOT a bug: if that row happens to also have a previously-issued (now stale) `inviteTokenHash` still on it, a companion revisiting that old invite link correctly resolves to "used" — the row genuinely is complete, so surfacing "used" (rather than "invalid") is the more accurate user-facing state, not a false positive. No path sets `status: "COMPLETE"` on a row that is actually still open/incomplete.
- **(d) Re-consumption of an already-COMPLETE row is refused with no write** — confirmed via both the dedicated re-consumption test and the "used" tests in `consumeTravelerInvite`, all asserting `expect(prisma.tripTraveler.update).not.toHaveBeenCalled()`.

**Verdict: genuinely fixed**, not just claimed.

### CRITICAL 2 (prior): Hardcoded Spanish-only notification title — RESOLVED, confirmed genuine

Re-inspected `src/app/api/travelers/submit/route.ts:56-58` and both dictionaries:

- Route now does `const locale = trip.user?.locale === "en" ? "en" : "es"; const dict = locale === "en" ? enCopy.inviteTravelers : esCopy.inviteTravelers;` and uses `dict.notifTitle`.
- **Dictionary keys are real, not placeholders**: `src/dictionaries/es.json` → `"notifTitle": "Un acompañante completó sus datos de viaje"`; `src/dictionaries/en.json` → `"notifTitle": "A companion completed their travel details"` — both under the `inviteTravelers` section, distinct bilingual strings.
- **Type wiring confirmed**: `src/lib/types/dictionary.ts:1567` — `InviteTravelersDict.notifTitle: string`, and `InviteTravelersDict` is referenced as `inviteTravelers: InviteTravelersDict` inside `MarketingDictionary` (line 2758).
- **Locale-fallback default is defensible, not an assumption**: `src/lib/i18n/config.ts:8` defines `export const DEFAULT_LOCALE: Locale = "es"`, confirming "es" is genuinely this repo's default locale. The route's `locale === "en" ? "en" : "es"` pattern is also not a one-off invention — it's byte-for-byte identical to the established convention already used in `src/lib/email/index.ts:73`, `src/app/api/admin/experiences/[id]/send-to-tripper/route.ts:114`, `src/app/api/admin/experiences/[id]/approve/route.tsx:132/158`, `src/app/api/admin/experiences/[id]/reject/route.tsx:91/118`, `src/app/api/admin/blogs/[id]/approve|reject|send-to-tripper` — i.e. this is the codebase's standard locale-resolution idiom, applied consistently here.
- **Test coverage confirmed**: `src/app/api/travelers/submit/__tests__/route.test.ts` has three dedicated tests — es-locale buyer gets `esCopy.inviteTravelers.notifTitle`, en-locale buyer gets `enCopy.inviteTravelers.notifTitle`, and no-locale-set buyer defaults to `esCopy.inviteTravelers.notifTitle` — all asserting against the actual imported dictionary objects (not duplicated literal strings), so the test would fail if the dictionary values drifted from what the route sends.

**Verdict: genuinely fixed**, not just claimed.

## WARNING — Re-Verification

### Lock icon warning (prior WARNING 3): RESOLVED, confirmed genuine

Re-inspected `src/components/app/travelers/TravelerRow.tsx:206-227`: the icon button block is now gated by `{!locked && (isAdult ? <TableIconButton .../> : <TableIconButton .../>)}` — when `locked` is true, the entire conditional short-circuits to `false` and renders nothing, not a disabled button. This now matches the spec's literal "no icon actions" wording for locked rows. Confirmed against actual JSX, not inferred from the commit message.

## WARNING — Carried Forward Unchanged (not re-investigated, per instruction)

These 4 were explicitly deferred by the fix batch, not silently dropped. Re-confirmed accurate as originally described:

1. **spec.md/API naming drift** — `spec.md`'s API Contracts table still lists `POST /api/travelers/submit-from-token` while the actual route/design/tasks consistently use `POST /api/travelers/submit`. Still an unresolved doc-only drift; not touched by the fix batch.
2. **No discrete "trip processing eligibility" function** for the "Blocking Until Cutoff" requirement's literal wording — still satisfied indirectly via roster `locked`/`submitted` fields rather than an explicit consumed gate. Unchanged.
3. **`npm run lint` still not independently re-run** — same pre-existing, unrelated `next lint`/Next 16 sandbox breakage, confirmed out of scope again in this pass per explicit instruction. Still owed before merge in a normal shell.
4. **Manual QA (task 4.14) remains code-review-only** — no live click-through pass (≥360px / ≥1280px) has been performed. Still outstanding before merge.

## SUGGESTION (unchanged, carried forward)

1. Locked-banner "days remaining" always computes to `0` once locked — harmless, cosmetic.
2. `runPass1`'s strict `gt` cutoff boundary excludes the exact cutoff instant from a final reminder — negligible at hourly cron granularity.
3. `BASE_URL` hardcoded in new email senders — consistent with pre-existing repo-wide pattern, not introduced by this change.

## Recommendation

Both CRITICAL items are genuinely resolved with correct logic and non-tautological test coverage. The remaining 4 WARNINGs are known process/doc gates (lint environment, manual QA, spec doc drift, indirect requirement satisfaction) that do not block archive — they are pre-existing, already-scoped-out, or non-blocking documentation debt. Recommend proceeding to `sdd-archive`. Lint (env-blocked) and manual QA remain owed before the change ships to production, independent of this SDD pipeline.
