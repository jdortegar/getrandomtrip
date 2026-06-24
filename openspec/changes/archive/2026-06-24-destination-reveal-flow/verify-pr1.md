# Verify Report: destination-reveal-flow — PR 1

**Change:** destination-reveal-flow  
**Scope:** Phases 1–5 (backend only)  
**Verified:** 2026-06-23  
**Verdict:** PASS WITH WARNINGS

---

## Completeness Table

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | 1.1 Schema field + enum | COMPLETE | `destinationAssignmentNotifiedAt DateTime?` on TripRequest; `ADMIN` in NotificationAudience |
| 1 | 1.2 Prisma generate | COMPLETE | Prisma Client v7.8.0 regenerated |
| 1 | 1.3 TripRevealDict / dictionary keys | DEFERRED | Intentionally deferred to PR 2 |
| 1 | 1.4 Schema type assertion | COMPLETE | Covered by typecheck + route tests |
| 2 | 2.1 getRevealCountdown.ts | COMPLETE | All 5 exports present |
| 2 | 2.2 Tests | COMPLETE | 15 tests, all green |
| 3 | 3.1 DestinationAssignmentReminder.tsx | COMPLETE | es/en copy, `subjects` export present |
| 3 | 3.2 sendDestinationAssignmentReminder | COMPLETE | Queries `prisma.user.findMany({ where: { roles: { has: "ADMIN" } } })` |
| 3 | 3.3 DestinationRevealed.tsx tripId prop | COMPLETE | `tripId` prop added; CTA points to `/${locale}/dashboard/trips/${tripId}/reveal` |
| 3 | 3.4 sendDestinationRevealed updated | COMPLETE | Passes `tripId: tripRequestId`; admin route caller is compatible |
| 4 | 4.1 route.ts + isAuthorized guard | COMPLETE | Guard copied from xsed pattern |
| 4 | 4.2 runPass1 | COMPLETE | Idempotency via `destinationAssignmentNotifiedAt IS NULL` query filter |
| 4 | 4.3 runPass2 | COMPLETE | `updateMany({ where: { id, status: "CONFIRMED" } })` guard present |
| 4 | 4.4 Tests | COMPLETE | 12 tests, all green |
| 5 | 5.1 netlify function | COMPLETE | Schedule `0 * * * *`, correct target URL, correct log prefix |

---

## Build / Test Evidence

| Check | Result |
|-------|--------|
| `npm run typecheck` | 0 errors |
| `npm run test` (PR 1 files only) | 27 passed (15 countdown + 12 route) |
| `npm run test` (full suite) | 6 failures in pre-existing xsed tests — NOT introduced by PR 1 |

**Pre-existing failures** (unrelated to PR 1):
- `src/lib/xsed/__tests__/notifications.test.ts` — 2 failures (last touched before destination-reveal-flow work)
- `src/app/api/admin/xsed/__tests__/route.test.ts` — 4 failures (same)

These failures exist on `develop` independent of this change. No new test regressions introduced.

---

## Spec Compliance Matrix

### Phase 1 — Schema

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `destinationAssignmentNotifiedAt DateTime?` on TripRequest | `prisma/schema.prisma` line 131 | PASS |
| `ADMIN` in NotificationAudience enum | `prisma/schema.prisma` line 472 | PASS |

### Phase 2 — Countdown Helper

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `getRevealAt` exported | `src/lib/helpers/getRevealCountdown.ts` line 23 | PASS |
| `getNotifyAt` exported | line 31 | PASS |
| `isInRevealWindow` exported | line 39 | PASS |
| `isInNotifyWindow` exported | line 48 | PASS |
| `getRevealCountdown` exported | line 61 | PASS |
| Tests: future reveal → `revealed: false` with correct d/h | getRevealCountdown.test.ts | PASS |
| Tests: past reveal time → `revealed: true` | getRevealCountdown.test.ts | PASS |
| Tests: exactly at boundary → `revealed: true` | getRevealCountdown.test.ts | PASS |
| Tests: UTC timezone correctness | getRevealCountdown.test.ts | PASS |

### Phase 3 — Email Layer

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `DestinationAssignmentReminder.tsx` exists with es/en copy | `src/emails/DestinationAssignmentReminder.tsx` | PASS |
| `subjects` export present | line 44–47 | PASS |
| Email contains trip ID, client name, departure date | Lines 66–78 (summaryPanel) | PASS |
| CTA links to admin trip management view for that trip | CTA points to `/${locale}/dashboard` — NOT trip-specific | WARNING |
| `sendDestinationAssignmentReminder` uses `prisma.user.findMany({ where: { roles: { has: "ADMIN" } } })` | `src/lib/email/index.ts` lines 488–491 | PASS |
| `DestinationRevealed.tsx` has `tripId` prop | line 11 | PASS |
| `DestinationRevealed` CTA points to `/${locale}/dashboard/trips/${tripId}/reveal` | line 59 | PASS |
| `sendDestinationRevealed` signature compatible with admin route caller | `src/app/api/admin/trip-requests/[id]/route.ts` line 121: `sendDestinationRevealed(tripRequest.id, tripRequest.userId)` — unchanged signature | PASS |

### Phase 4 — Cron Route

| Requirement | Evidence | Status |
|-------------|----------|--------|
| Route exists at `src/app/api/internal/destination-reveal/route.ts` | Confirmed | PASS |
| Auth guard rejects without valid `CRON_SECRET` bearer token | `isAuthorized()` function; test covers 401 on bad/missing secret | PASS |
| `runPass1` uses `destinationAssignmentNotifiedAt: null` for idempotency | route.ts line 32 | PASS |
| `runPass2` uses `where: { id, status: "CONFIRMED" }` guard | `updateMany({ where: { id: trip.id, status: "CONFIRMED" }, ... })` line 185–191 | PASS |
| `runPass2` blocked when `experienceId IS NULL` | Query filter `experienceId: { not: null }` at line 152 | PASS |
| Tests: 401 on bad secret | route.test.ts | PASS |
| Tests: Pass 1 stamps and notifies | route.test.ts | PASS |
| Tests: Pass 1 idempotency | route.test.ts | PASS |
| Tests: Pass 2 reveals and sends email | route.test.ts | PASS |
| Tests: Pass 2 skips trips without experienceId | route.test.ts | PASS |
| Tests: already-REVEALED trip skipped | route.test.ts | PASS |
| Tests: per-row error accumulated, not thrown | route.test.ts | PASS |

### Phase 5 — Netlify Function

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `netlify/functions/destination-reveal.ts` exists | Confirmed | PASS |
| Schedule `0 * * * *` | `config.schedule = "0 * * * *"` line 5 | PASS |
| Calls `POST /api/internal/destination-reveal` with Bearer token | line 17–20 | PASS |
| Missing env vars → HTTP 500 "misconfigured" | lines 12–14 | PASS |
| Returns upstream status + body unchanged | lines 22–25 | PASS |

---

## Issues

### WARNING

**W1 — DestinationAssignmentReminder CTA is too generic**

- **Where:** `src/emails/DestinationAssignmentReminder.tsx` line 57
- **Current:** `ctaHref = \`${BASE_URL}/${locale}/dashboard\``
- **Spec says:** "a CTA linking to the admin trip management view for that trip"
- **Reference pattern:** `AdminNewBooking.tsx` uses `${BASE_URL}/es/admin/trip-requests` (the trip-request list)
- **Impact:** Admins land on the general dashboard, not the trip list or a trip-specific view. Not blocking, but inconsistent with spec intent and the existing admin email pattern.
- **Suggested fix:** Change to `${BASE_URL}/${locale}/dashboard/admin` or include `tripId` in the URL path once a per-trip admin detail page exists. Minimum viable fix: point to the admin trip-requests list (`/dashboard/admin`).

**W2 — Task 3.1 prop mismatch (`originCity`, `tripType`, `ctaHref` listed but not implemented)**

- **Where:** `src/emails/DestinationAssignmentReminder.tsx`
- **Detail:** Task 3.1 spec'd `originCity`, `tripType`, `ctaHref` as props. The implementation omits these. The spec requirement (not the task) only mandates trip ID, client name, departure date, and CTA — which are all present.
- **Impact:** No functional regression. Task is over-specified vs the actual spec requirement. Low severity.

---

### SUGGESTION

**S1 — Re-escalation logic in Pass 1 is re-stamping `destinationAssignmentNotifiedAt`**

The re-escalation loop (trips already notified, inside T-48h, no experience) re-stamps `destinationAssignmentNotifiedAt = now`. This means a re-escalated trip would not be caught by the original Pass 1 query on the next cron tick (since it's now NOT NULL), but would still be caught by the re-escalation query (which filters `destinationAssignmentNotifiedAt: { not: null }`). The behavior is correct — this is intentional. Documenting it here for clarity.

**S2 — Route test mock uses `prisma.tripRequest.update` patched inline**

The Pass 1 test patches `prismaMock.tripRequest.update` directly inside the test body after the initial mock setup. This works but is fragile. A shared mock factory would be cleaner. Not a blocking issue.

---

## Final Verdict

**PASS WITH WARNINGS**

- 0 CRITICAL issues
- 2 WARNINGs (W1 is the meaningful one — CTA URL in admin email)
- 2 SUGGESTIONS

PR 1 is ready to merge. W1 (admin email CTA URL) should be addressed before or in PR 2 alongside the full reveal page implementation.

**Next recommended phase:** `sdd-apply` (PR 2) or address W1 before archiving PR 1.
