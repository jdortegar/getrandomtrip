# Verification Report: auth-verification-reset

**Date**: 2026-07-23 (second pass)
**Mode**: openspec (file-based artifacts)
**Verdict**: PASS WITH WARNINGS (0 CRITICAL against this change's own spec, 2 WARNING, 1 SUGGESTION) — see "Out-of-Scope Cross-Cutting Item" for the separately-tracked commit-split blocker that still gates `sdd-archive`.

All claims below were independently re-derived by reading the actual current source files and re-running commands myself in this session — nothing was taken from `apply-progress.md` or the first `verify-report.md` at face value.

## Previous Pass Summary (for history)

First pass verdict: **FAIL** (2 CRITICAL, 3 WARNING, 1 SUGGESTION).
- CRITICAL-1: undocumented waitlist-gate refactor mixed into the working tree (git-history/scope issue, not a code defect against this change's spec).
- CRITICAL-2: "Registration Issues Verification Token" had zero test coverage.
- WARNING-1: backfill script's credential-branch reset wasn't guarded against accidental re-run after go-live.
- WARNING-2: `authorize()` has no direct unit/integration test (consistent with pre-existing repo convention).
- WARNING-3: manual QA tasks 10.5–10.7 open.
- SUGGESTION-1: stale `minLength={6}` HTML hint on the password field.

This pass re-verifies all of the above plus new integration fixes from a live manual-QA session (Phase 11 in tasks.md).

## Completeness (tasks.md vs actual code)

All checkable tasks across Phases 1–11 are marked `[x]` (98 original + task 5.6 + task 10.8 + Phase 11's 5 items). Independently spot-checked against the working tree — matches. No open tasks remain except the already-resolved manual-QA items, which are now checked off and corroborated by the "Live Manual QA Batch" section in `apply-progress.md`.

## Command Evidence (run independently, this session)

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run test` (vitest) | ✅ **67 files / 458 tests, all green** (re-ran myself; matches apply-progress's post-verify-fix-batch numbers exactly — not cited from the report) |
| `npm run lint` | ❌ still fails: `Invalid project directory provided, no such directory: .../lint` — `next lint` doesn't exist in Next 16.2.6, confirmed pre-existing via `git log -p -- package.json` (the `"lint": "next lint"` line predates this change by multiple commits). Unrelated to this change's files. Same conclusion as the first pass, independently re-confirmed. |

## Re-Check: Gap Fixes From First Pass

### Gap 1 (was CRITICAL-2) — register route test coverage

`src/app/api/auth/register/__tests__/route.test.ts` exists and contains 4 tests, all passing in the full suite run above:
1. Weak password (`"abc123"`) → 400, `prisma.user.create` and `issueVerificationToken` never called.
2. Invalid email (`"not-an-email"`) → 400, same non-call assertions.
3. Duplicate email → 400, no token issued (existing behavior preserved).
4. Success path → `prisma.user.create` called with hashed password and `emailVerified` left `undefined` on the create payload; `issueVerificationToken("user-1", "EMAIL_VERIFY")` and `sendVerificationEmail("user-1", "plaintext-token")` both asserted called; 201 response.

**Confirmed accurate.** The "Registration Issues Verification Token" requirement and both "Password Policy" register scenarios now have passing covering tests, satisfying Strict TDD Mode's compliance bar. Gap fully closed.

### Gap 2 (was WARNING-1) — backfill re-run guard

Read `scripts/backfill-email-verified.ts` directly (lines 47–99):

- The guard query (`client.user.count({ where: { password: { not: null }, emailVerified: { not: null } } })`, line 58) runs **first**, before any `updateMany` call — confirmed by line order: guard at lines 58–67, OAuth `updateMany` at line 72, credential `updateMany` at line 83. If the guard trips (`alreadyVerifiedCredentialCount > 0 && !force`), the function returns `{ aborted: true }` at line 66, **before either `updateMany` is reached**. Zero-write guarantee confirmed by code structure, not just by test assertion.
- Return type is the discriminated union `{ aborted: true } | { aborted: false, oauthUpdated, credentialUpdated }` (lines 50–56).
- The one caller — the `isMainModule` block at lines 101–113 — calls `backfillEmailVerified()` and only attaches `.catch()` / `.finally()` to the returned promise; it never inspects `result.aborted`. This is **correct usage**, not a misuse: the aborted case resolves normally (no throw), so `.catch()` correctly only fires on unexpected errors, and `.finally()` correctly disconnects Prisma either way. The union only needs active narrowing by callers that read the success-only fields (`oauthUpdated`/`credentialUpdated`) — the CLI entry point doesn't need those fields, so not narrowing it is not a bug.
- Confirmed 6/6 tests pass in `scripts/__tests__/backfill-email-verified.test.ts` (3 original idempotency tests + 3 new guard tests), verified in the full suite run above.

**Confirmed accurate.** Gap fully closed.

## Re-Check: New Integration Fixes (Phase 11)

### Item 3 — Gate-exempt routes in `GateAwareChrome.tsx` / `HomeWrapper.tsx`

Read both files directly (`src/components/waitlist/GateAwareChrome.tsx`, `src/components/waitlist/HomeWrapper.tsx`).

- **Rules of Hooks**: In both components, all hook calls (`useSession`, `usePathname`, and every `useState`/`useEffect`) execute unconditionally at the top of the function body, before the `isGateExemptRoute(...)` early return. `GateAwareChrome`: 5 hooks (lines 45–61) all precede the early return at line 63. `HomeWrapper`: 4 hooks (lines 38–53) all precede the early return at line 55. **No conditional/early-return-before-hooks bug exists in the final code** — the mid-session bug mentioned in the prompt was fixed correctly.
- **Locale-prefix stripping**: `GateAwareChrome.isGateExemptRoute` strips the prop-driven `/${locale}` prefix (`pathname.startsWith(withLocalePrefix) ? pathname.slice(...) : pathname`); `HomeWrapper.isGateExemptRoute` uses a locale-agnostic regex (`/^\/(es|en)(?=\/|$)/`) that doesn't depend on a `locale` prop at all (the component doesn't receive one). Both correctly reduce e.g. `/en/verify-email` → `/verify-email` before matching against `GATE_EXEMPT_ROUTES = ["/login", "/verify-email", "/reset-password"]`.
- **Live confirmation via curl** against the running dev server (port 3010): `GET /en/verify-email?token=anything123` returns HTML whose rendered `<h1>` is literally `Verifying your email…` (confirmed via `rg -o "<h1[^>]*>[^<]*</h1>"` against the raw response body) — this is `VerifyEmailClient`'s markup, not `WaitlistPage`'s. The only "waitlist" string matches in the raw payload are RSC chunk-loader references and unrelated admin-dashboard dictionary keys (e.g. `"waitlist":"Waitlist"` under the admin settings tab copy), not rendered gate UI. **Confirmed correct and reachable.**

### Item 4 — `login/page.tsx` static dict import + `AuthModal`'s narrowed `dict` type

- `src/app/[locale]/login/page.tsx` statically imports `es.json`/`en.json`, selects by locale, and passes `dict` + `initialEmail={search.get("email") ?? undefined}` to `AuthModal` (confirmed by direct read).
- `AuthModal`'s `dict` prop is typed `Pick<Dictionary, "auth">` (line 19 of `AuthModal.tsx`), with an inline comment explaining why (only `dict.auth` is ever read).
- Checked all 4 other callers by grepping every `.tsx` file that imports `AuthModal`: `src/components/providers/GlobalAuthModal.tsx`, `src/components/Navbar.tsx`, `src/components/waitlist/GateAwareChrome.tsx`, `src/components/waitlist/HomeWrapper.tsx` — all pass a full `Dictionary` object obtained from `getDictionary()`/`layout.tsx` props. A full `Dictionary` structurally satisfies `Pick<Dictionary, "auth">` (it's a strict supertype). `npm run typecheck` returning 0 errors independently confirms none of these 4 callers broke.
- **Live confirmation via curl**: `GET /es/login` (308-redirects to `/login` per this repo's default-locale-unprefixed middleware convention, followed with `-L`) returns HTML containing the literal mixed-case dictionary strings `"Iniciar Sesión"` and `"Continuar con Google"` (grepped case-sensitively from the raw response body, not the CSS-uppercased visual form) — confirms the dictionary is actually wired through and rendering, not just type-checking.

### Item 5 — `verify-email` response `{ok, email}` + `AuthModal.initialEmail` wiring

- `src/app/api/auth/verify-email/route.ts` line 32: `NextResponse.json({ ok: true, email: user.email })` — confirmed, `user` is fetched via `select: { email: true }` on the same `update` call.
- `src/components/auth/VerifyEmailClient.tsx`: on success (`res.ok && data.ok`), builds `target = data.email ? "${loginPath}?email=${encodeURIComponent(data.email)}" : loginPath` and calls `router.replace(target)` (lines 46–52). Confirmed.
- `AuthModal.tsx`: `initialEmail?: string` prop (line 21) seeds `email` state (`useState(initialEmail ?? "")`, line 51). The remembered-email `useEffect` (lines 92–98) is guarded with `if (!isOpen || initialEmail) return;` — confirmed it will **not** override a caller-supplied `initialEmail` with a stale `localStorage` value.
- The register-route test and the verify-email route test (`json).toEqual({ ok: true, email: "test@example.com" })`) both pass in the full suite run — confirmed the response-shape change didn't regress either test.

**Confirmed correct end-to-end.**

### Item 6 — Post-auth redirect destination change

- `src/app/[locale]/login/page.tsx` diff: `dest = returnTo ? decodeURIComponent(returnTo) : pathForLocale(locale as Locale, "/")`, replacing `dashboardPathFromRole(role)`.
- Grepped the whole `src/` tree for `dashboardPathFromRole` — the only remaining reference is its own definition in `src/lib/roles.ts:7`. **No other file calls it anymore.** No other code depended on this page's old redirect behavior.
- **Confirmed no regression.**

### Item 7 — `auth.resendVerification` copy shortened in both locales

`rg "\"resendVerification\""` against both dictionaries confirms: `es.json:835` → `"Reenviar link"`, `en.json:835` → `"Resend link"`. **Both locales updated.**

## Re-Confirm From Original Spec

| Requirement | Status | Evidence |
|---|---|---|
| Password policy (8+ chars, letter+number) enforced server-side | ✅ PASS | `register/route.ts:29` and `reset-password/route.ts:19` both call `isValidPassword`; unit + route tests pass. |
| Forgot-password enumeration-safe | ✅ PASS | `forgot-password/route.ts` — direct read confirms every branch (invalid email, no match, match, thrown error in `catch`) returns the identical `NextResponse.json({ ok: true })` with no distinct status/body. |
| Google OAuth login path untouched by verification gate | ✅ PASS | `src/lib/auth.ts`'s `signIn` callback (lines 88–126) only **writes** `emailVerified: new Date()` on the Google-create branch (line 107); never reads or branches on it anywhere. The gate lives exclusively inside `CredentialsProvider.authorize()` (lines 63–70), which the OAuth flow never invokes. |
| `authorize()` gate order — bcrypt strictly before `emailVerified` check | ✅ PASS | Direct read of `src/lib/auth.ts`: bcrypt compare + `isValid` throw at lines 54–61; `emailVerified` gate at lines 63–70 — strictly after. |

No regressions found in any of the four re-confirmed spec areas.

## WARNING Issues (carried forward / re-assessed)

### WARNING-2 — `authorize()` has no direct unit/integration test

Still true. No test file exercises NextAuth's `CredentialsProvider.authorize()` as a whole in this repo (consistent with the pre-existing convention — no NextAuth provider test exists anywhere else either). The underlying primitives it calls (`issueVerificationToken`, `consumeVerificationToken`, the gate-order logic) remain independently verified by direct code reading and by the primitives' own unit tests. Unchanged severity: WARNING, not CRITICAL, since this predates the change's own scope.

### WARNING-4 — `AuthModal.tsx` and the waitlist-gate refactor are now functionally interdependent, not just co-located

New finding for the commit-split decision (see "Out-of-Scope Cross-Cutting Item" below for full detail). Recorded here as a WARNING because it affects how a future revert/rollback of either change would behave, which matters for this change's own documented "Migration / Rollout" rollback plan in `design.md` ("revert `src/lib/auth.ts` immediately restores ungated login"). That specific claim about `auth.ts` still holds (confirmed — `auth.ts` has no dependency on the waitlist-gate files), but the pages/UI layer (`/login`, `/verify-email`, `/reset-password` reachability) does now depend on `GateAwareChrome`/`HomeWrapper`'s exemption fix, which lives in the other change's files.

## SUGGESTION (carried forward)

### SUGGESTION-1 — Stale `minLength={6}` HTML hint on the password field

Confirmed still present: `src/components/auth/AuthModal.tsx:421` (`minLength={6}`), unchanged since the first pass. Cosmetic only — `validateForm()` already enforces the real 8-char+letter+number policy in register mode via `isValidPassword` before submission. Low priority.

## Out-of-Scope Cross-Cutting Item: CRITICAL-1 (waitlist-gate refactor) — Functional Interdependency Assessment

Per the verify instructions, this is a known, already-discussed, separately-tracked issue — not re-litigated here as a new blocking CRITICAL against `auth-verification-reset`'s own spec compliance. Reporting the requested fact for the commit-split decision:

**Are the two changes now functionally interdependent at the code level? Yes, in one direction, confirmed by direct code reading:**

- `auth-verification-reset`'s own pages (`/login` fully-localized modal, `/verify-email`, `/reset-password`) are wrapped by `GateAwareChrome`/`HomeWrapper` on every route. The committed (`HEAD`) version of these two files has **no** exemption logic at all — every route, including `/login`, is gated by the marketing waitlist lock. Confirmed via `git diff` against `HEAD`: the `isGateExemptRoute()` function is wholly new in the working tree, added specifically to fix this.
- **Consequence**: if the waitlist-gate refactor's changes to `GateAwareChrome.tsx`/`HomeWrapper.tsx` are reverted back to `HEAD` (e.g., to split it into its own commit/branch by reverting just those two files) while keeping `auth-verification-reset`'s own files as-is, this change's `/login`, `/verify-email`, and `/reset-password` pages would **silently stop rendering** whenever the marketing gate is locked (the default/production state until an admin/tripper unlocks it) — `WaitlistPage` would render instead, with no error, reproducing exactly the bug the live manual-QA session found and fixed. This is a real, verified one-directional dependency: **`auth-verification-reset`'s reachability depends on the waitlist-gate refactor's exemption fix.**
- **Reverse direction is weaker**: the waitlist-gate refactor's core lock/unlock mechanism (role-based unlock via `useSession`, `WaitlistPage` rendering, `AuthModal`'s `allowRegister={false}` login-only instance) does not import anything from `auth-verification-reset`'s new files (`verificationTokens.ts`, the three new API routes, `VerifyEmailClient`, `ResetPasswordClient`). If `auth-verification-reset`'s pages were removed, the `GATE_EXEMPT_ROUTES` array would just contain two dead string entries (`/verify-email`, `/reset-password`) — harmless, no compile or runtime break.
- **Shared-file coupling (pre-existing, reinforced not created by this pass)**: `AuthModal.tsx` carries both changes' deltas in a single 357-line diff — the waitlist refactor's `allowRegister` prop and the auth-verification-reset deltas (`initialEmail`, `errorKind`, `resendState`, `forgotState`, the `Pick<Dictionary,"auth">` narrowing, `isValidPassword`/`isValidEmail` wiring) are interleaved in the same file, same component, same render tree. This was already true before Phase 11 and is not newly created by items 3–4, but it does mean a clean per-commit split of this one file requires careful manual patch splitting rather than a straight file-level revert.

**Practical implication for the commit-split plan**: order the commits so the waitlist-gate refactor's `GateAwareChrome.tsx`/`HomeWrapper.tsx` exemption fix lands in the **same commit as (or before, never after)** `auth-verification-reset`'s pages, or `auth-verification-reset` will ship with unreachable pages in production until the other commit follows. `AuthModal.tsx` cannot be cleanly attributed to a single commit without manual hunk-splitting.

This does not block this verify pass's PASS verdict for `auth-verification-reset`'s own spec compliance, but it does mean `sdd-archive` should not proceed until the user/orchestrator has made the commit-split/ordering decision — consistent with what `apply-progress.md` already flags.

## Design Coherence

| Design Decision | Code Match |
|---|---|
| Gate placed after bcrypt check | ✅ Confirmed line order in `src/lib/auth.ts` |
| Google OAuth path untouched by gate | ✅ Confirmed — `signIn` callback never reads `emailVerified` |
| Token consumption via client POST (not GET-render) | ✅ `VerifyEmailClient` POSTs on `useEffect` mount; `ResetPasswordClient` POSTs on form submit |
| Delete-then-create reissue strategy | ✅ `issueVerificationToken`'s `$transaction([deleteMany, create])` |
| SHA-256 hash-at-rest, plaintext only in email link | ✅ Confirmed in `verificationTokens.ts` |
| Enumeration-safe forgot-password | ✅ Confirmed always `200 { ok: true }`, including on internal error |
| NextAuth v4 thrown-message propagation (`result.error === "EMAIL_NOT_VERIFIED"`) | ✅ Empirically confirmed against installed `next-auth@4.24.14` source (task 10.8) and reflected correctly in `AuthModal.tsx` |
| Gate-exempt routes for auth utility pages (new, Phase 11) | ✅ Confirmed live via curl; Rules of Hooks respected in final code |
| `initialEmail` pre-fill after verify redirect (new, Phase 11) | ✅ Confirmed wired end-to-end, guarded against localStorage override |

## Dictionary / i18n

Spot-checked all `auth` keys (including the shortened `resendVerification`), `VerifyEmailPageDict`, `ResetPasswordPageDict`, and the new `forgotPasswordLink` key — all present in both `es.json` and `en.json` with matching type interfaces in `src/lib/types/dictionary.ts`. `npm run typecheck` (0 errors) independently confirms structural completeness.

## Final Verdict

**PASS WITH WARNINGS** for `auth-verification-reset`'s own spec/design/tasks compliance:
- Both CRITICAL-2 (register route test coverage) and WARNING-1 (backfill re-run guard) from the first pass are confirmed fixed by direct code + test inspection, not just cited.
- All new Phase 11 integration fixes (gate-exemption, login dict wiring, response-shape change, redirect change, cosmetic copy) are independently confirmed correct via direct code reading, the full test suite, and live `curl` evidence against the running dev server.
- Remaining WARNINGs (authorize() untested directly; the AuthModal/waitlist-gate functional interdependency) and SUGGESTION (stale `minLength`) are non-blocking.
- **CRITICAL-1** (the separately-tracked waitlist-gate refactor) is not re-adjudicated as a spec-compliance defect of this change, per instructions — but it remains a real, now-confirmed-interdependent, unresolved commit-split/ordering decision that must be made **before** `sdd-archive`, or `auth-verification-reset`'s own pages will ship unreachable.

**Recommendation**: proceed to a commit-split decision with the user (ordering `GateAwareChrome`/`HomeWrapper` before or with `auth-verification-reset`'s page commits; manually splitting `AuthModal.tsx`'s intertwined hunks) before `sdd-archive`.
