# Email campaigns admin

## Objective

Add an Email Campaigns section to the admin to manage contacts (waitlist + friends & family), create and send campaigns through Resend with an optional Stripe promotion code, and measure deliveries, opens, clicks and — above all — conversions (who paid with the campaign's code). Immediate goal: send FUNDADOR30 to the waitlist and AMIGOS30 to friends & family, and compare which converts better.

## Problem / why

Source spec: "Randomtrip — Sección de Email Marketing en el Admin" (2026-10-12). Build in-house instead of Mailchimp: the campaign and its promo code are intertwined, the code lives in Stripe/our checkout, and a single source of truth avoids reconciling two systems by hand.

Exploration found the spec's premise "Stripe validates the code's rules in checkout" is false here: checkout uses PaymentIntents with in-house discount math (`src/lib/payments/checkout-quote.ts:165-198`), so Stripe never redeems codes and max uses / one-per-customer are not enforced. The used code only lives in PaymentIntent metadata and `Payment.webhookData` JSON.

## Decisions (interview, 2026-10-17)

1. **Promo enforcement (option A):** keep PaymentIntent checkout; enforce the Stripe promotion code rules at apply time (`expires_at`, `max_redemptions` counted against our succeeded `Payment` rows, `restrictions.first_time_transaction`, `restrictions.minimum_amount`). Add promo code columns on `Payment` for attribution. Migrating to Checkout Sessions rejected (too risky for ~10 contacts).
2. **Contacts:** new `Contact` table keyed by unique email, optional `userId` (linked by email). v1 sources: `WAITLIST` (backfill from `WaitlistEntry` + auto-create on new waitlist signup) and `FRIENDS_FAMILY` (manual add in admin). Registered users are NOT included in v1 (no marketing opt-in exists).
3. **Content:** one fixed branded react-email template. Admin edits subject, preheader, title, markdown body (bold, links, lists), CTA text + URL. Promo code block + expiry auto-injected. Admin preview + test send to self.
4. **Locale:** one locale (`es` | `en`) per campaign; template fixed copy localized inside the template like other `src/emails/*`. `Contact.locale` (default `es`) is a segment filter.
5. **Promo linking:** codes are created manually in the Stripe dashboard. Admin types the code; backend looks it up (`stripe.promotionCodes.list({ code })`), stores `stripePromotionCodeId` + code and shows its rules for confirmation. Promo is optional per campaign. Creating codes from admin deferred.
6. **Unsubscribe:** per-contact HMAC-signed token link to public `/{locale}/unsubscribe?token=…` (confirm button, no login) → `UNSUBSCRIBED`. `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058 one-click) headers; extend `sendMail` to accept headers. Admin can resubscribe manually.
7. **Tracking:** `/api/webhooks/resend` with Svix signature verification records `delivered`, `bounced`, `complained`, `opened`, `clicked` as `EmailEvent` linked to the send by Resend message id. `complained` → contact `UNSUBSCRIBED`; permanent bounce → contact `BOUNCED`. Opens are inflated by Apple Mail Privacy Protection; clicks and conversions are the reliable metrics.
8. **Sending:** no scheduling. Campaign `DRAFT → SENDING → SENT | PARTIAL`. "Send now" confirms the recipient count. Send rows pre-created with unique (campaignId, contactId); retries only resend failed rows. Resend batch API (≤100 per call). Segment = source (`WAITLIST` / `FRIENDS_FAMILY` / both) + locale, subscribed only.
9. **Conversions & metrics:** conversion = succeeded `Payment` whose promo code id equals the campaign's. Attributed if the payer's email matches a send of that campaign; otherwise counted separately as "shared code". Per campaign: sent, delivered, bounced, unique opens, unique clicks, conversions (attributed / shared), revenue, total discount. Recipient table: status, opened, clicked, bought. Campaign list doubles as comparison.

## Out of scope (v1)

Automations, visual template editor, behavioral segmentation, scheduling, creating Stripe coupons/codes from the admin, registered users as contacts (needs a marketing opt-in first), multi-locale campaigns.

## Constraints

- Admin pages under `src/app/[locale]/(secure)/dashboard/admin/`, nav in `src/components/app/dashboard/config/adminNav.ts` (+ headings, page metadata, tests). Admin API routes use `src/lib/admin/requireAdmin.ts`.
- All admin UI copy in `src/dictionaries/{es,en}.json` + types in `src/lib/types/dictionary.ts`; email template copy es/en inside the template file.
- Types in `src/types/`; UI never imports `@prisma/client`.
- Schema: hand-written additive SQL in `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql` mirrored in `prisma/schema.prisma`; applied in production by `db:migrate-if-outdated`. No SQL applied to any database without explicit user approval of the target.
- New env vars: `RESEND_WEBHOOK_SECRET`, `EMAIL_UNSUBSCRIBE_SECRET` (documented in `env.example`).
- Manual ops (documented, not automated): enable open/click tracking on the Resend domain; register the Resend webhook endpoint; create the coupon + FUNDADOR30 / AMIGOS30 codes in Stripe.
- Commits only after the user approves each one (standing user rule). Push, PR and merge are user decisions.

## Tasks

- [ ] T1 — Schema: enums + `Contact`, `Campaign`, `CampaignSend`, `EmailEvent`; `Payment.promoCode` / `Payment.stripePromotionCodeId`; migration SQL; domain types in `src/types/`. Stripe webhook persists promo columns from PaymentIntent metadata on `payment_intent.succeeded`.
- [ ] T2 — Promo enforcement in `checkout-quote.ts`: expiry, max redemptions (succeeded payments with that code id), first-time transaction, minimum amount; localized error reasons. Test-first.
- [ ] T3 — Contacts backend: idempotent waitlist → Contact backfill script (dry-run default); waitlist signup also upserts a Contact; admin contacts API (list/filter, add F&F, edit, resubscribe).
- [ ] T4 — Unsubscribe: HMAC token util, public unsubscribe page + API (GET confirm page, POST one-click), `sendMail` headers support.
- [ ] T5 — Campaign template + CRUD: react-email campaign template (markdown → email, promo block, unsubscribe footer), promo lookup admin API, campaign create/update/get/list API, test send.
- [ ] T6 — Sending: segment resolution, idempotent send rows, Resend batch send with per-recipient headers, status transitions (`SENDING` / `SENT` / `PARTIAL`), retry failed.
- [ ] T7 — Resend webhook: Svix verification, `EmailEvent` recording, auto actions (complaint → unsubscribed, hard bounce → bounced), send status updates.
- [ ] T8 — Metrics: conversion attribution query (attributed vs shared), campaign metrics + recipients API.
- [ ] T9 — Admin UI: nav entry, Contacts page, Campaigns list (comparison), campaign editor with preview + promo lookup + test send + send confirm, campaign detail metrics + recipients table; es/en dictionaries.
- [ ] T10 — Ops docs: env vars, Resend webhook + tracking setup, Stripe code setup, backfill run.

## Checks

Per task: test-first Vitest where a deterministic unit exists (observe RED → GREEN), `npm run typecheck`, `npm run lint`, `npm run test`. Before PR: manual QA of the admin flow with a test send to own inbox (Resend in nonproduction mode prefixes `[TEST]`), unsubscribe link + one-click, webhook via Resend test event, promo enforcement on checkout with a Stripe test code. Responsive at 360px / 1280px.

## Delivery

- Forecast: ~3,000 authored changed lines across 10 tasks.
- Strategy: `single-pr` (user choice, 2026-10-17) — one branch `feature/email-campaigns`, one work-unit commit per task, one PR into `develop` at the end.
- Branch: `feature/email-campaigns` cut from `origin/develop` (`f9f99892`), no upstream set.

## Progress

- 2026-10-17: exploration + interview done; plan written. Next: choose chain strategy, cut branch, start T1.

### T1 — Schema (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `prisma/schema.prisma` (5 enums, `Contact`, `Campaign`, `CampaignSend`, `EmailEvent`, User back-relations, `Payment.promoCode` / `stripePromotionCodeId` + index), `prisma/migrations/20261017120000_email_campaigns/migration.sql` (additive, idempotent, names verified against `prisma migrate diff`), `src/types/emailCampaign.ts`, `src/lib/db/payment.ts`, `src/app/api/stripe/webhook/route.ts`, tests in `src/lib/db/__tests__/stripeWebhookPayment.test.ts` and `src/app/api/stripe/webhook/__tests__/route.test.ts`.
- Extra: when `confirm-payment` settles first, the webhook backfills only the promo columns (guarded `updateMany`, no emails).
- RED: 2 new tests failed before implementation. GREEN: webhook + payment tests 49/49 (parent re-run); writer also ran confirm-payment tests 54/54 total, `prisma validate`, `prisma generate`, typecheck, lint — all pass.
- Not done: migration never applied to a real database.
- Commit: `52e9966c`. Assessment: high risk, RDD off (global) → independent verifier: PASS (migration matches `prisma migrate diff`, idempotent, backfill guarded; 409 tests + typecheck green). Low notes: legacy payments found via `providerPaymentId` with null intent id are not backfilled.
- Note: unrelated uncommitted review/notification edits exist in this checkout from another session — stage task paths only.

### T2 — Promo enforcement (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `src/lib/payments/promo-rules.ts` (pure `evaluatePromoRules`, order expired → max_redemptions_reached → already_used → first_time_only → minimum_amount), `src/types/payments.ts`, `src/lib/payments/checkout-quote.ts` (`checkPromoRules` counts APPROVED/COMPLETED payments excluding the current trip; rejection via existing `rejectPromo` + `errorCode: PROMO_<REASON>`), `src/app/[locale]/(secure)/checkout/page.tsx` (maps errorCode to dictionary copy), `journey.checkout.errors.promo.*` in es/en + dictionary type, tests in `src/lib/payments/__tests__/promo-rules.test.ts` and `src/app/api/stripe/payment-intent/__tests__/route.test.ts`.
- RED: rules test (module missing) + 7 route tests failed before implementation. GREEN: payments + stripe 80/80 (parent re-run); writer: 134 incl. checkout page/hook tests, typecheck, lint pass.
- Known limits: max_redemptions only counts settled payments (concurrent unsettled checkouts can exceed it); coupon-level max not enforced; refunded payments free the use; unknown-code message still English-only (pre-existing).
- Commit: `64837247`. Assessment: high risk, RDD off → independent verifier: no blockers (201 tests + typecheck green, no bypass path). Mediums: one-use-per-user is a product rule (from spec), not Stripe's; quote-time race on limits; promo columns only set by the webhook, so payments settled via the confirm-payment fallback are uncounted until the webhook arrives → proposed follow-up fix in confirm-payment.

### T3 — Contacts backend (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `src/lib/email-campaigns/contactRules.ts` (pure, script-safe), `src/lib/email-campaigns/contacts.ts` (`upsertWaitlistContact`, `listContacts`, `createFriendsFamilyContact`, `updateContact`, `ContactError`), `src/lib/validation/emailCampaigns.ts`, `src/app/api/admin/email-campaigns/contacts/route.ts` (GET/POST), `.../contacts/[id]/route.ts` (PATCH), `src/app/api/waitlist/route.ts` (best-effort contact upsert), `scripts/backfill-waitlist-contacts.ts` + `db:backfill-waitlist-contacts`, `src/types/emailCampaign.ts`, 5 test files.
- RED: 5/5 new test files failed (modules missing). GREEN: 163/163 across email-campaigns, admin contacts API, scripts (parent re-run); typecheck + lint pass (writer).
- Notes: waitlist signup test lives in `src/lib/email-campaigns/__tests__/waitlistSignup.test.ts`; concurrent duplicate signup may log a unique-constraint error (backfill heals). Backfill not run anywhere.
- Commit: `c84f4fa2`. Assessment: high risk, RDD off → independent verifier: PASS (auth, no-resubscribe, normalization, backfill dry-run safety; 163 tests + typecheck). Lows: unbounded `page` → 500 (fixed below, uncommitted); joined waitlist name can exceed 120 chars (accepted, harmless).
- Follow-up fix (inline): `positiveInt` rejects non-finite values; test `src/lib/validation/__tests__/emailCampaigns.test.ts` (written after the fix — no RED observed), 19/19 pass. Uncommitted, awaiting approval.

### T2b — Promo attribution on confirm-payment fallback (route: inline; one mechanical file + test)

- `src/app/api/stripe/confirm-payment/route.ts` sets `promoCode` / `stripePromotionCodeId` from verified intent metadata (empty → unset), so fallback-settled payments count immediately.
- RED: "stores the checkout promo code from the verified intent metadata" failed. GREEN: stripe + db 418/418, typecheck, eslint pass.
- Commit: `b5d13987`. Paging bound fix: `295996cd`.

### T4 — Unsubscribe (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `src/lib/email-campaigns/unsubscribeToken.ts` (HMAC-SHA256 `EMAIL_UNSUBSCRIBE_SECRET`, `buildUnsubscribeUrl(contactId, locale)` via `canonicalUrl`, `buildUnsubscribeHeaders(contactId)` → API URL + one-click), `unsubscribeContact` in `contacts.ts` (conditional `updateMany`, BOUNCED untouched), `src/app/api/email/unsubscribe/route.ts` (POST, token from query or JSON), `src/app/[locale]/unsubscribe/page.tsx` (noindex), `src/components/app/email-campaigns/UnsubscribeClient.tsx` (moved by parent from `src/components/email-campaigns/` per component-patterns), `sendMail` `headers` passthrough, `emailUnsubscribe` dictionary section es/en + type, `env.example`.
- Parent addition: `/unsubscribe` in `GATE_EXEMPT_ROUTES` (`src/components/waitlist/GateAwareChrome.tsx`) — the marketing gate is client-side; middleware is `src/proxy.ts` and skips `/api`. RED: 2 new gate tests failed, then GREEN.
- RED (writer): 5 test files failed before implementation. GREEN: 52/52 across gate, email-campaigns, unsubscribe API, sendMail (parent re-run); typecheck + lint pass.
- Notes: rotating `EMAIL_UNSUBSCRIBE_SECRET` invalidates sent links; ~820 authored lines (mostly tests) — over the advisory heuristic, kept as one coherent unit.
- Commit: `27e03f22`. Assessment: high risk, RDD off → independent verifier: PASS (forgery-proof tokens, RFC 8058 POST unblocked, atomic transitions, exact gate exemption; 52 tests + typecheck). Lows: secret length not enforced; base64url-leniency makes one tamper test incidental.

### T5 — Campaign template, CRUD, promo lookup, preview, test send (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `src/lib/email-campaigns/markdown.ts` (in-house subset parser → tree, React-escaped, only http(s)/mailto links; no new deps), `src/emails/CampaignEmail.tsx` (on `EmailLayout`, es/en fixed copy), `render.ts` (`renderCampaignEmail` → subject/html/text), `promo.ts` (`lookupPromotionCode`, `discountLabel`, `toEmailPromo`), `campaigns.ts` (repository + `CampaignError`), `unsubscribeToken.ts` (`buildUnsubscribePageUrl`), validation schemas, routes `promo-lookup`, `campaigns` (GET/POST), `campaigns/[id]` (GET/PATCH/DELETE, DRAFT-only via conditional write), `[id]/preview` (`text/html`, CSP sandbox), `[id]/test-send` (admin's own email, `[TEST]` prefix only in production since sendMail adds it elsewhere), tests.
- Parent cleanup: shared `SETTLED_PAYMENT_STATUSES` in `src/lib/payments/settledStatuses.ts`, used by `checkout-quote.ts` and `promo.ts`.
- RED: 8 test files failed on missing modules. GREEN: 274/274 across email-campaigns, templates, validation, admin API, payments, stripe, checkout (parent re-run); typecheck + lint pass.
- Notes for later tasks: PATCH must send `ctaLabel` + `ctaUrl` together (T9); preview/test send reload the promo from Stripe per render — T6 must load once per campaign; preview must be shown in an iframe (T9). ~2,500 lines, mostly tests — kept as one coherent unit.
- Commit: `82f982e4`. Assessment: high risk, RDD off → independent verifier: PASS (XSS-safe markdown/links, preview CSP sandbox, admin-only, test-send only to own email, DRAFT race-safe; 165 tests). Low: promo lookup lacked checkout's `active` preference → fixed with T6 (prefer active, fall back to inactive to show its rules; RED → GREEN).

### T6 — Sending (route: delegated writer; resumed once after a rate limit)

- Files: `src/lib/helpers/sendMail.ts` (shared gating/prefix/sender helpers + `sendMailBatch`, ≤100, idempotency key, headers, tags, per-message results), `src/lib/email-campaigns/sending.ts` (`getCampaignAudienceCount`, `sendCampaign`: atomic claim DRAFT|PARTIAL|stale SENDING>10min, rows created once, retry only QUEUED/FAILED, unsubscribed rows deleted, promo loaded once, per-recipient unsubscribe URL + headers, chunked batch, updatedAt heartbeat, final SENT|PARTIAL), `campaigns.ts` (`campaign_not_sendable` 409, `campaign_empty_audience` 400), routes `[id]/audience` (GET) and `[id]/send` (POST), tests.
- Writer decisions: BOUNCED rows count as sent; an unresolvable/inactive promo blocks the send (400 `invalid_promo_code`); disabled delivery marks the chunk FAILED → PARTIAL.
- RED: sendMailBatch, sending module and routes failed before implementation. GREEN: 151/151 email-campaigns + admin API + sendMail (parent re-run incl. promo fix); eslint clean; tsc clean except an unrelated in-progress file from another session (`DashboardRoleShell.tsx`).
- Safety finding: `sendMail` has NO nonproduction recipient restriction (only a `[TEST]` subject prefix) → a campaign sent from develop/preview reaches real subscribed contacts. Proposed guard pending user decision.
- Risks: synchronous send inside the request (fine at ~10 contacts; Netlify timeout for large audiences); a batch is all-or-nothing per chunk; relation filter in `deleteMany` only exercised against mocks.
- Commit: `0908aef9` (includes the promo lookup `active` preference fix).

### T6b — Nonproduction recipient guard (route: inline; one file + test, user-approved)

- `sending.ts`: outside production the audience is limited to `EMAIL_TEST_RECIPIENTS` (comma-separated, lowercased; empty → nobody), and pending rows for other addresses are deleted before sending. Production unchanged. Documented in `env.example`.
- RED: 3 nonproduction guard tests failed. GREEN: 155/155 email-campaigns + admin API + sendMail; eslint clean; tsc clean except the other session's in-progress file.
- Commit: `aebde1b2`. Assessment (range 82f982e4..aebde1b2): high risk, RDD off → independent verifier: PASS (claim race-safe via @updatedAt, rows once, allowlist fails closed for `in: []`/`notIn: []`, sendMail behaviour unchanged, Resend SDK types match; 155 tests + tsc clean). Lows accepted for ~10 contacts: idempotency key changes if chunk boundaries shift after a crash (possible double send of one chunk); live-run vs stale-reclaim overlap needs a >10 min stalled chunk; mid-run unsubscribes may still be mailed; finalize failure leaves SENDING until stale window.
### T7 — Resend webhook (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `src/lib/email-campaigns/resendWebhook.ts` (`verifyResendWebhook` via SDK `resend.webhooks.verify` — svix is a resend dependency, no new deps; `parseResendEvent`; `handleResendEvent` in one `$transaction`: EmailEvent insert keyed by svix-id + conditional side effects), `src/app/api/webhooks/resend/route.ts` (POST, raw body; 400 bad signature/JSON, 500 missing secret or DB error so Resend retries, 200 otherwise), `contacts.ts` (export `isUniqueViolation`), types, `env.example` (`RESEND_WEBHOOK_SECRET`, endpoint, 5 events, enable tracking), tests.
- Rules: delivered SENT→DELIVERED; bounced SENT|DELIVERED→BOUNCED and `Permanent` bounce → contact BOUNCED; complained → contact UNSUBSCRIBED; opened/clicked event only; duplicate svix-id → no repeated effects; non-campaign emails ignored. Metadata minimal (link, bounce type/subType).
- RED: both new test files failed (modules missing). GREEN: 177/177 email-campaigns + webhook + admin API (parent re-run); tsc + eslint clean (writer).
- Risks: hard bounce detection relies on the SES value `Permanent`; signature tests self-sign (no real Resend delivery verified yet).
- Commit: `99a3bd72`. Assessment: high risk, RDD off → independent verifier: PASS (raw body, svix via standardwebhooks ±300s, atomic P2002 dedupe, guarded transitions; 126 tests + tsc). Finding (low–medium): an event arriving before `sending.ts` persists `resendMessageId` is dropped with 200 → follow-up T7b. Lows: malformed secret logged as invalid signature; Svix retries any non-2xx.

### T8 — Metrics (route: delegated writer; trigger: 2+ non-trivial files)

- Files: `src/lib/email-campaigns/metrics.ts` (`getCampaignReport`/`Metrics`/`Recipients`/`Summaries`, `readDiscountAmountUsd`), `campaigns/[id]/metrics` route (GET `{ metrics, recipients }`), list route items gain `summary`, types with money-unit JSDoc, tests (in-memory fake applying real where filters).
- Rules: conversion = settled payment with the campaign's `stripePromotionCodeId` and `paidAt >= sentAt`; attributed by userId or case-insensitive payer email vs send/contact email, else shared; revenue = USD `Payment.amount` (non-USD counted in `otherCurrencyConversions`); discount from stored PaymentIntent metadata, null when absent; a code shared by two campaigns counts for both.
- RED: metrics test + metrics route failed (missing modules); 2 list-route tests failed. GREEN: 208/208 email-campaigns + admin API + webhooks (parent re-run); tsc + eslint clean.
- Risks: nested select/groupBy relation filters only exercised via fake; confirm-payment-settled payments carry no discount JSON; buyer with a different account/email counts as shared.
- Commit: `4a5ba074`. Independent verifier: PASS (conversion rules, Prisma 7 nested select `distinct`/`where` and `groupBy` relation filters valid on Postgres, ≤5 queries; 200 tests + tsc). Lows: `discountTotal` silently partial when the confirm-payment fallback settled first (decision pending: "known for X of Y" count vs a `Payment.discountAmountUsd` column); `paidAt` is intent creation time (pre-existing); summaries over-select JSON columns.

### T7b — Early webhook events (pending; after T8 to avoid overlapping `src/types/emailCampaign.ts`)

- Webhook falls back to `data.tags.send_id` (Resend includes tags in events) when `email_id` is unknown, backfilling `resendMessageId`; send transitions accept QUEUED (delivered from QUEUED|SENT, bounced from QUEUED|SENT|DELIVERED).
- `sending.ts` success write must not downgrade a row a webhook already moved (guarded update on pending statuses; still set `resendMessageId`/`sentAt`).
- Done (route: delegated writer; 2+ non-trivial files): `parseResendEvent` reads `send_id` (object or array tags); `findSend` falls back to the tagged send only when its `resendMessageId` is null or equal, backfilled with a guarded `updateMany` in the event transaction; webhook transitions accept QUEUED; `sending.ts` `resultWrites` guards SENT/FAILED on QUEUED|FAILED and fills `resendMessageId`/`sentAt` only where null.
- RED: 24 tests failed (6 webhook, 18 sending). GREEN: 221/221 email-campaigns + webhooks + admin API (parent re-run); tsc + eslint clean (writer).
- Risk: guarded writes only exercised via the in-memory fake.
- Commit: `bf147d15`.

### T8b — Persist promo discount on Payment (route: delegated writer; user chose column over a "known for X of Y" count)

- `Payment.promoDiscountUsd Float?` added to schema and to the still-unapplied `20261017120000_email_campaigns` migration (matches `prisma migrate diff`). Shared parser `promoAttributionFromMetadata` in `src/lib/db/payment.ts` (discount only for finite values > 0) used by the webhook and confirm-payment; the already-settled backfill fills promo ids and discount in separate null-guarded writes. Metrics: column first, JSON fallback for older rows, null when none; summaries no longer select JSON columns.
- RED: 6 tests failed. GREEN: 643/643 stripe + db + email-campaigns + admin API (parent re-run); prisma validate/generate, tsc, lint clean.
- Commit: `2e527dec`. Independent verifier (range 4a5ba074..2e527dec): no blockers — both race orders correct, migration matches `prisma migrate diff`, parser identical across paths, summaries skip JSON; 651 tests + tsc clean. Lows: early event may backfill an id onto a row a thrown batch call marked FAILED (cosmetic; retry returns same id); JSON fallback accepts a 0 discount (pre-existing).

### T9 — Admin UI (split into T9a and T9b)

- T9a (route: delegated writer): nav entry, contacts page, campaigns list/comparison. User approved extra surfaces `src/components/common/StatusIndicatorBadge.tsx` + its test for `email-contact` / `email-campaign` badge families. Pattern: `AdminUsersPageClient.tsx` (TableFilterToolbar, TableQueryBoundary).
- T9a done: badge families in `StatusIndicatorBadge.tsx`; nav tab "Email campaigns" (11 tabs) + headings (contacts own heading); pages `email-campaigns/page.tsx`, `email-campaigns/contacts/page.tsx`; components in `src/components/app/admin/email-campaigns/` (`EmailCampaignsSubnav`, `EmailCampaignsSectionHeader`, `CampaignsPageClient`, `CampaignsTable`, `ContactsPageClient`, `ContactsTable`, `AddContactForm`); copy `adminPages.emailCampaigns` + nav/heading keys in es/en, typed. RED: 12 tests + 2 missing-module files failed. GREEN: 69/69 targeted (parent re-run), 597/597 wider UI suites, tsc + lint clean (writer). Not done: manual responsive QA at 360/1280px; `/new` and `/[id]` links 404 until T9b. Status: uncommitted, awaiting user approval.
- T9b: campaign editor (form, promo lookup, preview iframe, test send, send confirm) + detail page (metrics, recipients).
- T9a commit: `18e6cab8`.
- T9b done (route: delegated writer): pages `email-campaigns/new` and `email-campaigns/[id]`; components `NewCampaignPageClient`, `CampaignDetailPageClient`, `CampaignEditorForm` (+ `CampaignContentFields`, `CampaignAudienceFields`, `campaignForm.ts`; PATCH sends only changed fields, CTA pair together), `PromoCodeLookup` + `PromoRulesSummary`, `CampaignPreviewPanel` (sandboxed iframe, test send), `CampaignSendPanel` (audience count → irreversible inline confirm → summary; retry PARTIAL), `CampaignMetricsPanel` + `CampaignKpiCard` + `CampaignRecipientsTable`, `CampaignDeleteControl` (inline confirm), `campaignApi.ts` error mapping; headings `emailCampaignsNew` / `emailCampaignDetail`; es/en copy + types. ~3,300 lines (≈1,060 tests, ≈300 copy) — one coherent unit.
- RED: 5 new test files + 3 heading/metadata tests failed. GREEN: 79/79 (parent re-run); tsc + lint clean (parent re-run).
- Gaps: recipient status badge uses the `payment` family (TODO) — proper `email-send` family needs `StatusIndicatorBadge.tsx`; preview iframe relies on the admin session cookie (manual check); manual QA (360/1280px, contrast, end-to-end create → promo → preview → test send → send → metrics) pending.
- Status: uncommitted, awaiting user approval.
- Remaining after T9: T10 ops docs.

- Remaining: T8 metrics, T7b, T9 admin UI, T10 ops docs.
