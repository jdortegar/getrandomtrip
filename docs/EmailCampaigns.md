# Email campaigns: setup and operations

The admin **Email campaigns** section (`/dashboard/admin/email-campaigns`) sends campaigns to waitlist and friends & family contacts through Resend, attaches an optional Stripe promotion code, and measures deliveries, opens, clicks and conversions (paid checkouts that used the campaign's code). This guide covers the one-time setup and how to run a campaign safely.

## Quick path

1. Set the environment variables (below) in Netlify for production and nonproduction.
2. Apply the `20261017120000_email_campaigns` migration, then run the waitlist backfill.
3. In Resend: enable open/click tracking on the sending domain and register the webhook.
4. In Stripe: create the coupon and its promotion codes (e.g. `FUNDADOR30`, `AMIGOS30`).
5. In the admin: create a campaign, look up its code, preview, **send a test to yourself**, then send.

## 1. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `EMAIL_UNSUBSCRIBE_SECRET` | All environments | Signs unsubscribe links. Generate with `openssl rand -base64 32`. **Changing it breaks every link already sent.** |
| `RESEND_WEBHOOK_SECRET` | All environments with a registered webhook | `whsec_…` signing secret from the Resend webhook. |
| `EMAIL_TEST_RECIPIENTS` | Nonproduction only | Comma-separated addresses. Outside production a campaign reaches **only** these; empty means it reaches nobody. Ignored in production. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Already configured | Used by `sendMail` / `sendMailBatch`. |

> Develop and previews share one database that can hold real addresses, and `sendMail` adds only a `[TEST]` subject prefix outside production. `EMAIL_TEST_RECIPIENTS` is what keeps nonproduction campaigns from reaching real people.

## 2. Database

| Step | Command / note |
|---|---|
| Migration | `prisma/migrations/20261017120000_email_campaigns/migration.sql` (additive, idempotent, one transaction). Production applies it through `db:migrate-if-outdated` on the main build. For other databases, apply it only after confirming the target. |
| Waitlist backfill | `npm run db:backfill-waitlist-contacts` (dry run, prints counts) → `npm run db:backfill-waitlist-contacts -- --apply`. Safe to re-run; never changes existing contacts. |

New waitlist signups create their contact automatically. Friends & family are added by hand on the **Contacts** tab.

## 3. Resend

1. **Tracking:** enable open and click tracking for the sending domain.
2. **Webhook:** add endpoint `https://<site>/api/webhooks/resend` with events `email.delivered`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`. Copy its signing secret into `RESEND_WEBHOOK_SECRET`.
3. **Check:** send a Resend test event; the endpoint should answer `200`. A wrong secret answers `400`.

| Event | Effect |
|---|---|
| delivered | Send → `DELIVERED` |
| bounced | Send → `BOUNCED`; a `Permanent` bounce also marks the contact `BOUNCED` (no future sends) |
| complained | Contact → `UNSUBSCRIBED` |
| opened / clicked | Recorded for metrics only |

Transactional emails share the endpoint and are ignored.

## 4. Stripe promotion codes

Create one **coupon** (e.g. 30% off) and one **promotion code per campaign** on top of it, so each campaign's conversions are measured separately. Rules set on the code are enforced by our checkout (Stripe does not redeem codes on PaymentIntents):

| Rule on the code | Enforced at checkout |
|---|---|
| Expiry (`expires_at`, coupon `redeem_by`) | Yes |
| Max redemptions | Yes — counts our paid payments with that code |
| First-time transaction | Yes |
| Minimum amount (USD) | Yes |
| One use per customer | Always, for every code |
| Coupon-wide max redemptions | **No** |

## 5. Running a campaign

1. **New campaign:** subject, title, markdown body, optional CTA (https), one locale (`es` or `en`), segments, optional promo code → **Look up** to confirm its rules.
2. **Preview** and **Send test to me** (the preview's unsubscribe link has no token on purpose).
3. **Send now:** the confirmation shows the recipient count (subscribed contacts in the chosen segments and locale). Sending cannot be undone.
4. A `PARTIAL` result can be retried: only failed/queued recipients are resent, never new contacts.

## 6. Reading the metrics

| Metric | Meaning |
|---|---|
| Unique opens | Inflated by Apple Mail privacy preloading — treat as a rough signal. |
| Unique clicks | Reliable engagement signal. |
| Conversions — attributed | Paid payments with the campaign's code, after it was sent, by a recipient (matched by user or email). |
| Conversions — shared | Same code, buyer was not a recipient (the code was passed on). |
| Revenue / discount | USD amounts charged / discounted on those payments. |

A code reused by two campaigns counts its payments for both.

## Checklist

- [ ] `EMAIL_UNSUBSCRIBE_SECRET` set everywhere; `EMAIL_TEST_RECIPIENTS` set in nonproduction.
- [ ] Migration applied; backfill dry run reviewed, then applied.
- [ ] Resend tracking on, webhook registered, test event returns `200`.
- [ ] Stripe coupon + per-campaign promotion codes created.
- [ ] Test send received; unsubscribe link and one-click unsubscribe work.

## Limits worth knowing

- Sending runs inside the request: fine for small audiences; very large ones may hit the function time limit (the run can be retried after 10 minutes).
- Two people paying at the same moment can exceed a code's max redemptions (limits are checked when the price is quoted).
- Out of scope for now: scheduling, automations, creating Stripe codes from the admin, registered users as contacts (needs a marketing opt-in).
