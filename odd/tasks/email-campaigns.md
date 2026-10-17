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
- Status: uncommitted, awaiting user approval.
