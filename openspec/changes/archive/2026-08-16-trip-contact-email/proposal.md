# Proposal: Trip Contact Email

**All product forks were resolved in a `/grill-me` interview (2026-08-11) and are FINAL.** `sdd-spec`, `sdd-design`, and `sdd-tasks` must treat the Resolved Decisions below as settled input and must not reopen them.

## Intent

On `/dashboard/admin/trip-requests/[id]` the "Contact traveler" action is a raw `mailto:` link (`TripFulfillmentHeader.tsx:70-73`). It hands the admin off to their OS mail client, so the message leaves the platform unbranded, in whatever locale the admin happens to type, with no record that it ever happened. Support and dispute lookups have nothing to read. Replace it with an in-app compose modal that sends a real branded, traveler-localized email through the app's own Resend pipeline and writes an audit row per attempt.

## Scope

### In Scope

| # | Deliverable |
|---|---|
| 1 | New Prisma model `TripContactMessage` — `subject`, `body`, sending admin (`adminId` FK, `onDelete: SetNull`, matching `TripDocument.uploadedById`, **plus** a denormalized `adminEmail` string captured at send time so the record survives admin deletion), `status` enum (`SENT` \| `FAILED`), optional `error`, `createdAt`, FK to `TripRequest` with `onDelete: Cascade` (matches `TripDocument`/`Payment`, schema.prisma:195/325). Write-only. |
| 2 | New email template `src/emails/AdminTripContactMessage.tsx` — `subjects` export + default component wrapping `EmailLayout`, per `AdminNewBooking.tsx`. Body rendered as paragraphs split on newlines. |
| 3 | New send function in `src/lib/email/index.ts` that is **`await`-able and throws** — unlike all 23 existing `send*` functions, which are `void (async () => …)` fire-and-forget. Resolves the traveler's locale via the module-private `resolveLocale(user.locale)` and sets `replyTo` to the sending admin's own email. |
| 4 | New route `POST /api/admin/trip-requests/[id]/contact`, guarded by `requireAdmin()`, awaiting the send and persisting the audit row on both success and failure. Returns a real success/failure result to the caller. |
| 5 | New `ContactTravelerModal` under `src/components/app/admin/trip-fulfillment/`, built from existing `Modal` / `FormField` / `TextAreaInput` primitives (per `UserRoleModal.tsx`). Prefilled localized subject + body; the header `<a>` becomes a `<button>` keeping the same `Mail` icon, label, and position. |
| 6 | es/en dictionary entries + `src/lib/types/dictionary.ts` additions for all new copy (modal, prefill, results, email template). |

### Out of Scope

- Message-history UI, `GET` endpoint, or audit-log viewer — explicitly declined ("write-only for now"); the table is read by direct DB query only.
- Rate limiting / send throttling.
- Rich text, HTML input, attachments, CC/BCC, or templates library.
- Any status gating — the action stays available on every `TripRequest.status`, exactly like the `mailto:` it replaces.
- Retrofitting the other 23 `send*` functions to the awaitable shape.

## Capabilities

### New Capabilities
- `admin-traveler-messaging`: admin-composed, traveler-localized, branded transactional email sent synchronously from the trip fulfillment page, with a write-only per-attempt audit trail.

### Modified Capabilities
- `admin-dashboard-overview`: the trip fulfillment page's "Contact traveler" affordance changes from an OS `mailto:` handoff to an in-app compose-and-send flow.

## Approach

1. Schema first: `TripContactMessage` + back-relation on `TripRequest`, applied with `prisma db push` (this repo tracks no migration files — the artifact is the `schema.prisma` diff).
2. Template + awaitable send function next, so the route has something real to `await`.
3. Route composes `requireAdmin()` → resolve traveler (`email`, `name`, `locale`) and admin (`email`) → send → persist audit row in both branches. A failed send is a `TripContactMessage` with `status: FAILED` plus an error message, never a silent swallow.
4. Modal last — it is the consumer. `trip.user` (`AdminTripUser` = `{ id, name, email }`) already reaches the header, so no new client-side data fetching. Note `locale` is deliberately **not** in that type: locale resolution is server-side only.

Strict TDD: RED test before each unit (send function, route handler, modal).

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `prisma/schema.prisma` | New | `TripContactMessage` model, `TripContactStatus` enum, `TripRequest.contactMessages` back-relation, `User` audit back-relation |
| `src/emails/AdminTripContactMessage.tsx` | New | Branded template, `EmailLayout` shell, es/en subjects |
| `src/lib/email/index.ts` | Modified | Awaitable `sendAdminTripContactMessage` (throws on failure) |
| `src/app/api/admin/trip-requests/[id]/contact/route.ts` | New | `requireAdmin()`-guarded POST; sends + audits |
| `src/components/app/admin/trip-fulfillment/ContactTravelerModal.tsx` | New | Compose modal from existing UI primitives |
| `src/components/app/admin/trip-fulfillment/TripFulfillmentHeader.tsx` | Modified | `mailto:` `<a>` → modal-opening `<button>`, same icon/label/position |
| `src/dictionaries/{es,en}.json`, `src/lib/types/dictionary.ts` | Modified | New copy section (both locales, mandatory per `.claude/rules/i18n-and-types.md`) |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Admin-authored text reaches a traveler with no review step | Med | Accepted — identical to the `mailto:` it replaces. Plain text only, so no HTML/script injection surface exists to sanitize. |
| Resend latency blocks the request and the modal appears hung | Med | Explicit pending/disabled state on the submit control; surface the failure result rather than retrying silently. |
| Send succeeds but the audit write fails → email sent with no record | Low | Order the send before the audit write and log loudly; the audit row is support metadata, never an authorization or idempotency input. |
| `RESEND_API_KEY` unset in an environment (`sendMail` throws immediately) | Low | Route returns a `FAILED` result with the error surfaced in the modal; `status: FAILED` row still persisted. |
| Someone later reads `TripContactMessage` as authorization or delivery-confirmation state | Low | Document the model as write-only audit metadata in a schema comment, mirroring the `TripDocument.uploadedById` precedent. |

## Rollback Plan

Single commit / single PR — `git revert` restores the `mailto:` link. The new table, route, template, and modal are purely additive; nothing existing is deleted and no existing column changes. `TripContactMessage` can be dropped independently without touching trip data.

## Dependencies

- `prisma db push` against the target `DATABASE_URL` before the route works.
- `RESEND_API_KEY` + `EMAIL_FROM` already required by `sendMail` — no new env vars.
- `requireAdmin()` (`src/lib/admin/requireAdmin.ts`) and `resolveLocale` (module-private in `src/lib/email/index.ts`) already exist; compose them, do not re-express either.

## Success Criteria

- [ ] An admin opens the modal from the fulfillment header, sees a prefilled localized subject and body, edits both, and sends.
- [ ] The traveler receives a branded `EmailLayout` email in **their own** stored locale, not the admin's dashboard locale.
- [ ] The traveler's reply lands in the sending admin's inbox (`replyTo` = that admin's email).
- [ ] The modal shows a distinct success and failure state driven by the awaited send result.
- [ ] Every attempt writes exactly one `TripContactMessage` row, `SENT` or `FAILED` with an error detail.
- [ ] Deleting the `TripRequest` cascades its contact messages away.
- [ ] The action works on a `DRAFT` and on a `CANCELLED` trip — no status gating.
- [ ] Non-admin and unauthenticated `POST`s get `403` / `401` at the API, not just a hidden button.
- [ ] All new copy exists in both `es.json` and `en.json`; `npm run typecheck` and `npm run test` pass.

## Resolved Decisions (interview 2026-08-11 — FINAL, do not reopen)

| # | Decision |
|---|---|
| 1 | Branded via existing `EmailLayout`, same shell as every other transactional email. Not raw/unbranded. |
| 2 | Rendered in `resolveLocale(trip.user.locale)` — the traveler's stored preference, like `sendBookingConfirmed`. Not the admin's dashboard locale. |
| 3 | Plain text only, paragraphs split on newlines. No rich text, no HTML input — no sanitization work. Compose field is the existing `TextAreaInput`. |
| 4 | Subject **and** body are prefilled and localized (greeting uses `trip.user.name`, sign-off from "the GetRandomTrip team"). Nothing blank by default. |
| 5 | `replyTo` = the sending admin's own email (looked up from `adminId`), not a shared inbox. Mirrors the `mailto:` behavior being replaced. |
| 6 | Synchronous, `await`-ed send so the modal reports a real result. Deliberately diverges from the 23 fire-and-forget `send*` functions, which have nobody watching. |
| 7 | New Prisma model required; write-only audit. No GET endpoint, no history list, no viewer in this change. |
| 8 | No status restriction — available on every `TripRequest.status`. |
| 9 | Audit row denormalizes the sending admin's email as a plain string (captured at send time), in addition to the `adminId` FK (`onDelete: SetNull`, matching `TripDocument.uploadedById`). The record must stay fully readable for support/dispute lookups even if that admin account is later deleted. |
| 10 | The prefilled subject/body (Decision #4) is built in the **traveler's** locale, not the admin's dashboard locale — matching the `EmailLayout` shell's locale (Decision #2), so the whole email is coherent by default. This widens scope slightly: `AdminTripUser` (`src/lib/admin/types.ts`) gains a `locale: string \| null` field, and both admin trip-request GET routes (`src/app/api/admin/trip-requests/route.ts` and `.../[id]/route.ts`) add `locale: true` to their existing `prisma.user` select — purely additive, no existing consumer of `AdminTripUser` is affected. |

## Open Questions

**None.** All ten forks above were resolved in the interview.
