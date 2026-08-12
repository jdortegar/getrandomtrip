# Tasks: Trip Contact Email

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~730-760 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | No — `delivery_strategy` is locked to `single-pr` per explicit user decision; not re-litigated |
| Suggested split | Single PR, reviewed phase-by-phase (schema → email → route → dict → modal → wiring) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

The scope itself is small (one model, one route, one template, one modal) per `state.yaml`'s `scope_guardrail`, but ~10 new files plus their RED tests push the raw diff past 400 lines even without scope creep. Per `single-pr` mapping: record `size:exception` before `sdd-apply` starts — do not split into chained PRs.

## Phase 1: Schema & Types Foundation

- [x] 1.1 Add `TripContactMessage` model + `TripContactStatus` enum to `prisma/schema.prisma` (after `TripDocument`, per design.md)
- [x] 1.2 Add back-relations: `TripRequest.contactMessages`, `User.tripContactMessagesSent`
- [x] 1.3 Run `npx prisma db push` + `npx prisma generate` against `DATABASE_URL` — done (user-confirmed Neon dev DB target, ran manually mid-session after Phase 1)
- [x] 1.4 Add `locale: string | null` to `AdminTripUser` in `src/lib/admin/types.ts`
- [x] 1.5 Add `locale: true` to `prisma.user` select in `src/app/api/admin/trip-requests/route.ts`
- [x] 1.6 Add `locale: true` to `prisma.user` select in `src/app/api/admin/trip-requests/[id]/route.ts` (both the GET select and the PATCH response-hydration select — both build `AdminTripUser` and now require `locale`)

## Phase 2: Email Template & Awaitable Send Function

- [x] 2.1 RED: `src/emails/__tests__/AdminTripContactMessage.test.tsx` — `toParagraphs` split/trim/drop-empty; `subjects.es !== subjects.en`
- [x] 2.2 GREEN: create `src/emails/AdminTripContactMessage.tsx` (`toParagraphs`, `subjects`, default component per `TripCancelled.tsx` pattern, no CTA)
- [x] 2.3 RED: `src/lib/email/__tests__/sendAdminTripContactMessage.test.ts` — `to`/`replyTo`/locale mapping, rejects on `sendMail` rejection (mock `sendMail` only)
- [x] 2.4 GREEN: implement `sendAdminTripContactMessage` in `src/lib/email/index.ts` (awaitable, throws, no try/catch)

## Phase 3: API Route

- [x] 3.1 RED: `src/app/api/admin/trip-requests/[id]/contact/__tests__/route.test.ts` — 401/403, 400×4 (subject/body length), 404, 200+SENT audit, 502+FAILED audit, CANCELLED trip still sends
- [x] 3.2 GREEN: create `src/app/api/admin/trip-requests/[id]/contact/route.ts` — `requireAdmin()` → validate (1-200/1-4000) → lookup trip+admin → `await sendAdminTripContactMessage` → `tripContactMessage.create` in both branches → respond per design.md contract

## Phase 4: Dictionary (i18n — both locales same task, per `.claude/rules/i18n-and-types.md`)

- [x] 4.1 Add `contactModal` block + `errors.send_failed` to `AdminTripFulfillmentDict` in `src/lib/types/dictionary.ts`
- [x] 4.2 Add matching `contactModal` + `errors.send_failed` strings to `src/dictionaries/es.json` AND `src/dictionaries/en.json` in the same commit; run `npm run typecheck`

## Phase 5: Modal & Helpers

- [x] 5.1 RED: `.../trip-fulfillment/__tests__/contactTravelerModalHelpers.test.ts` — `resolveContactLocale`, `{{userName}}` interpolation, `canSend` (blank/whitespace/sending states)
- [x] 5.2 GREEN: create `.../trip-fulfillment/contactTravelerModalHelpers.ts` (`resolveContactLocale`, prefill builder, `canSend`)
- [x] 5.3 Create `.../trip-fulfillment/ContactTravelerModal.tsx` using `Modal`/`FormField`/`TextAreaInput` (explicit `maxLength={200}`/`{4000}`), traveler-locale prefill, success/failure states, per `UserRoleModal.tsx` pattern

## Phase 6: Header & Page Wiring

- [x] 6.1 RED: update `.../trip-fulfillment/__tests__/TripFulfillmentHeader.test.tsx` — assert `<button>` not `<a href^="mailto:">`, invokes `onContactTraveler`
- [x] 6.2 GREEN: modify `.../trip-fulfillment/TripFulfillmentHeader.tsx` — add `"use client"`, `onContactTraveler` prop, `<a>` → `<button>`
- [x] 6.3 Modify `.../trip-requests/[id]/AdminTripFulfillmentPageClient.tsx` — add `contactOpen` state, pass `onContactTraveler`, render `<ContactTravelerModal>` with `traveler` (incl. `locale`)

## Phase 7: Verification

- [x] 7.1 Run `npm test` (vitest run) — all new/modified suites green
- [x] 7.2 Run `npm run typecheck` and `npm run lint` — typecheck clean; `npm run lint`/`npx eslint` confirmed broken pre-existing sandbox tooling issue (unrelated to this change, reproduces on clean `develop`)
- [x] 7.3 Manual QA — headless sandbox has no browser, so this was a full manual code-read QA pass of the send flow (header button → page state → modal prefill/validation/submit → API route → send fn → email template → audit write) instead of live-clicking DRAFT/CANCELLED trips; no status gate exists on the route (confirmed no status filter in the `tripRequest.findUnique` query), so DRAFT/CANCELLED both hit the same code path; audit row shape (SENT/FAILED + truncated error) verified by reading route.ts directly
