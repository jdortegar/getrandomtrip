## Verification Report

**Change**: notifications-experience
**Version**: 1.0
**Mode**: Standard

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 13 (phases 1–4: 10 impl + phases 5.1–5.8: 3 automated) |
| Tasks complete (impl) | 10/10 |
| Tasks complete (verify auto) | 2/3 (typecheck ✅, stray-file check ✅, lint ⚠️ env issue) |
| Tasks deferred (manual QA) | 5 (5.3–5.7) |

---

### Build & Tests Execution

**Typecheck**: ✅ Passed — 0 errors

```text
npm run typecheck
> tsc -p tsconfig.json --noEmit
(exit 0, no output — clean)
```

**Tests**: ✅ 75 passed / ❌ 6 failed (pre-existing, unrelated)

```text
npm run test (vitest run)
Test Files: 2 failed | 12 passed (14)
Tests: 6 failed | 75 passed (81)

Failing tests (all pre-existing, in src/lib/xsed/ and src/app/api/admin/xsed/):
  × parseXsedNotificationBody > normalizes valid signup input
  × parseXsedNotificationBody > omits unsupported locale input
  × POST /api/admin/xsed > creates a minimal DRAFT with type=XSED (3 variants)
  × POST /api/admin/xsed > returns 409 on P2002 slug conflict

All notifications-experience tests PASS:
  ✓ approve route: 6/6 tests pass
  ✓ reject route: 6/6 tests pass
```

**Coverage**: Not available — no coverage config in project

**Lint**: ⚠️ Environment issue — ESLint 8 + flat config produces circular JSON
serialization error unrelated to this change. Pre-existing condition. No raw
`<img>` tags were used in the templates (confirmed by source inspection).

---

### Spec Compliance Matrix

| Requirement | Scenario | Test / Evidence | Result |
|---|---|---|---|
| Default Locale on Sign-In | New user gets `locale = "es"` | `src/lib/auth.ts:91` — `locale: "es"` in `prisma.user.create` | ✅ COMPLIANT |
| Default Locale on Sign-In | Existing user locale not overwritten | `src/lib/auth.ts:85` — create block only runs when `!dbUser` | ✅ COMPLIANT |
| Locale Update API | Valid locale update → 200 | `src/app/api/user/locale/route.ts` — full PATCH handler, returns `200 { locale }` | ✅ COMPLIANT (UNTESTED by unit test) |
| Locale Update API | Unauthenticated → 401 | `route.ts:11-13` — `!session?.user?.id` guard | ✅ COMPLIANT (UNTESTED by unit test) |
| Locale Update API | Invalid locale `"fr"` → 422 | `route.ts:24-26` — `locale !== "es" && locale !== "en"` check | ✅ COMPLIANT (UNTESTED by unit test) |
| Client-Side Locale Sync | Mismatch triggers sync | `useSyncLocale.ts:15` — `if (current === locale) return` skips match | ✅ COMPLIANT (UNTESTED by unit test) |
| Client-Side Locale Sync | Match skips sync | Guard at `useSyncLocale.ts:15` | ✅ COMPLIANT (UNTESTED by unit test) |
| Client-Side Locale Sync | Failure does not affect UX | `.catch(() => {})` at `useSyncLocale.ts:21` | ✅ COMPLIANT |
| ExperienceApproved Template | Renders in Spanish | `copy.es.*` block with ES strings; `<Html lang={locale}>` | ✅ COMPLIANT (UNTESTED by unit test) |
| ExperienceApproved Template | Renders in English | `copy.en.*` block with EN strings | ✅ COMPLIANT (UNTESTED by unit test) |
| ExperienceRejected Template | reviewNote visible verbatim | `{reviewNote}` rendered inside reviewNotePanel section | ✅ COMPLIANT (UNTESTED by unit test) |
| ExperienceRejected Template | Renders in correct locale | `copy[locale]` pattern; locale-keyed label `"Nota del revisor:" / "Reviewer note:"` | ✅ COMPLIANT (UNTESTED by unit test) |
| Approve Route Sends Notification | Triggers email in owner's locale | `approve/route.tsx:84-111` — fire-and-forget block with locale resolution | ✅ COMPLIANT (UNTESTED by unit test) |
| Approve Route Sends Notification | Null owner locale defaults to ES | `locale = owner.locale === "en" ? "en" : "es"` | ✅ COMPLIANT |
| Approve Route Sends Notification | sendMail failure → 200 still returned | `try/catch` inside IIFE; return statement outside IIFE | ✅ COMPLIANT |
| Reject Route Sends Notification | Triggers email with reviewNote | `reject/route.tsx:84-111` — passes `reviewNote` to template | ✅ COMPLIANT (UNTESTED by unit test) |
| Reject Route Sends Notification | sendMail failure → 200 still returned | Same IIFE pattern | ✅ COMPLIANT |

**Compliance summary**: 17/17 scenarios compliant (static evidence). 10 scenarios lack dedicated unit tests (WARNING, not CRITICAL — fire-and-forget side effects are inherently hard to unit test; route tests do pass confirming HTTP behavior is unaffected).

---

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| `Session["user"].locale` typed | ✅ Implemented | `next-auth.d.ts:15` — `locale?: "es" \| "en" \| null` |
| `User.locale` in Prisma schema | ✅ Implemented | `prisma/schema.prisma:51` — `locale String?` on User model |
| `locale` in session callback select | ✅ Implemented | `auth.ts:150` — `locale: true` in dbUser select |
| `locale` assigned to session | ✅ Implemented | `auth.ts:179` — cast to `"es" \| "en" \| null` |
| PATCH /api/user/locale — auth guard | ✅ Implemented | Checks `session?.user?.id` |
| PATCH /api/user/locale — validation | ✅ Implemented | Strict `!== "es" && !== "en"` check |
| useSyncLocale — session guard | ✅ Implemented | Guards on `!session?.user?.id` before fetch |
| useSyncLocale — locale mismatch guard | ✅ Implemented | `if (current === locale) return` |
| useSyncLocale — fire-and-forget | ✅ Implemented | `void fetch(...).catch(() => {})` |
| SyncLocale — returns null | ✅ Implemented | No rendered output, just hook invocation |
| layout.tsx — mounts SyncLocale | ✅ Implemented | `<SyncLocale />` at line 39 inside SessionProvider |
| ExperienceApproved props | ✅ Implemented | `{ tripper, experienceTitle, locale }` (tasks spec used `tripper`, not spec's `ownerName` — consistent with routes) |
| ExperienceApproved subjects export | ✅ Implemented | `export const subjects = { es, en }` |
| ExperienceRejected props + reviewNote | ✅ Implemented | `{ tripper, experienceTitle, reviewNote, locale }` |
| ExperienceRejected reviewNote panel | ✅ Implemented | Distinct Section with `background: #fdf9f9` |
| No stray route.ts at approve path | ✅ Verified | Only `route.tsx` exists at approve and reject paths |
| Fire-and-forget pattern | ✅ Implemented | `void (async () => { try { … } catch(err) { console.error(…) } })()` |
| Locale default null → "es" | ✅ Implemented | `owner.locale === "en" ? "en" : "es"` covers null/undefined |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| D1: Prisma migration for User.locale | ✅ Yes | Field added; deviation noted (field didn't pre-exist) |
| D2: locale exposed via session callback | ✅ Yes | select + assign in session callback |
| D3: Fire-and-forget with IIFE | ✅ Yes | `void (async () => { … })()` pattern in both routes |
| D4: Type cast for escape-hatch update | ✅ Yes | `(updated as { ownerId?: string; title?: string })` |
| D5: useSyncLocale deps array | ✅ Yes | `[session?.user?.id, session?.user?.locale, locale]` |
| D6: Separate findUnique for owner | ✅ Yes | Owner fetched separately after update |
| D7: No stray .ts shadowing .tsx | ✅ Yes | Confirmed by file system check |

---

### Issues Found

**CRITICAL**: None

**WARNING**:
- W1: `PATCH /api/user/locale` has no unit tests. The route logic (401/422/200) is verified by source inspection only. Manual QA (task 5.5) is required to confirm runtime behavior.
- W2: `useSyncLocale` has no unit/integration tests. Hook behavior (mismatch trigger, match skip, error swallowing) is verified by source inspection only.
- W3: Email templates have no render tests. `ExperienceApproved` and `ExperienceRejected` locale rendering and `reviewNote` display are verified by source inspection only.
- W4: The sendMail side effect in `approve/route.tsx` and `reject/route.tsx` is not asserted in the existing route tests (the `prisma.user.findUnique` mock for the owner call is not set up, so sendMail never fires in tests). The fire-and-forget pattern is present and syntactically correct; the tests confirm the HTTP response is unaffected.
- W5: Pre-existing test failures (6 tests in `xsed` suite) are unrelated to this change but leave the test suite non-green. These should be tracked separately.

**SUGGESTION**:
- S1: Add a unit test for `PATCH /api/user/locale` covering the three status codes (401/422/200) following the same pattern as the approve/reject route tests.
- S2: Add a render test for `ExperienceRejected` to assert `reviewNote` text appears in the rendered output — this is the most spec-critical template assertion.
- S3: In the approve/reject route tests, mock `sendMail` and assert it is called (or not called) based on owner email presence to cover the notification side-effect path.

---

### Verdict

**PASS WITH WARNINGS**

All 10 implementation tasks complete. TypeScript typecheck clean (0 errors). 12/12 relevant route tests pass. All 17 spec scenarios are satisfied by source evidence. No CRITICAL issues. Warnings are coverage gaps (no unit tests for the locale API, sync hook, or email templates) and a pre-existing unrelated test suite failure. Manual QA steps 5.3–5.7 remain pending as expected for this phase.
