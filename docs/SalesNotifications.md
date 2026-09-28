# Deliver paid-sale notifications to Slack

The first accepted **live-mode** Stripe payment approval queues a durable notification for
Randomtrip `#sales` (`C0C4U5RU86N`). Failed, duplicate, stale-intent and legacy
repair-only events do not queue sales. Accepted payment approval still queues a
sale when the trip is already confirmed, revealed, completed or cancelled.
Test/unknown-mode intents settle normally but never enter this outbox. The mode
comes only from the signed webhook or authenticated Stripe retrieval, not from
browser input; a shared development database cannot leak test sales into Slack.

## Rollout

1. Review and apply **only** `prisma/rollouts/sale-notification-deliveries.sql`
   against the explicitly approved database before deploying this code. Do not
   run `npm run db:migrate`: this repository maps it to `prisma db push`, which
   could apply unrelated schema edits. The SQL intentionally fails if the table
   already exists; inspect an existing table rather than overwriting it.
2. Configure `SLACK_SALES_WEBHOOK_URL` as a **production-only secret**.
   Prefer Functions-only scope when the plan supports it. On Netlify Personal,
   use the default secret-compatible scopes: Builds, Functions and Runtime;
   exclude Post processing. Custom scopes require Pro or Enterprise
   ([Netlify scope documentation](https://docs.netlify.com/build/environment-variables/overview/#scopes)).
   Authorize the incoming webhook for Randomtrip `#sales` only. Also configure
   the existing `CRON_SECRET` for both the scheduled function and Next.js worker;
   Netlify supplies `URL` (fallback: `NEXT_PUBLIC_SITE_URL`). Never enable the
   production webhook in previews/local development or print its URL in logs.
3. Deploy. The application awaits one immediate bounded delivery attempt after
   payment commit; the Netlify function retries due work every five minutes.
   Verify the scheduled function is enabled and review sanitized `[sales]` logs.
4. With explicit approval, verify a controlled production sale and its outbox
   row's `sentAt`. No historical sales are backfilled; enabling the credential
   later delivers events accumulated since this code was deployed.

## Delivery contract

- Payment approval and the immutable non-PII notification snapshot commit in
  one database transaction. Unique payment/intent keys prevent duplicate events.
  Enqueue failure rolls back settlement so the payment provider can retry.
- Delivery is **at-least-once, not exactly-once**. A timeout or crash after Slack
  accepted a message but before `sentAt` was saved can produce a duplicate post.
  Internal payment references let operators recognize these duplicates.
- Workers claim at most three jobs with `FOR UPDATE SKIP LOCKED`, a one-minute
  lease and a unique lease token. Remote I/O happens outside transactions.
  Each send has a three-second deadline; the worker uses a twenty-second budget
  and bounded database transactions, leaving unprocessed claims for recovery.
- Failed delivery retries with exponential backoff (one minute to one day),
  honoring bounded Slack rate-limit delays. Missing/invalid configuration never
  drops events. Monitor unsent rows, their age, attempts and sanitized lastError;
  permanent rejection needs operator repair. No automatic dead-letter deletion.
- Slack receives only amount/currency, internal booking/payment references and
  a fixed `https://getrandomtrip.com` admin link. No names, emails, passenger,
  card, destination or provider payloads are sent. Message blocks are plain text.
  Webhook transport accepts only HTTPS `hooks.slack.com/services/...`, follows
  no redirects and treats only HTTP 200 with `ok` as acknowledged delivery.

## Rollback and review

Remove the Slack secret to pause sending (events remain retryable). Roll back
application code before removing any schema; retain the outbox for reconciliation.
Do not delete sent rows or reset payment statuses to trigger another notification.
Restore configuration to resume; backoff may delay recovery up to one day.

Review `src/lib/db/payment.ts` first for preserved settlement guards, then the
outbox worker, transport and focused tests. No existing email delivery, customer
UI, refund flow or legacy MercadoPago behavior is changed. A future payment
provider must enqueue the same first-paid event atomically with its settlement.
