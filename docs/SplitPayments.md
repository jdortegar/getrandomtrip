# Split payments ("Pay individually")

A group can pay a trip together (**Pay total**, the default) or let every adult
pay their own share (**Pay individually**). The organizer is the trip owner
(`TripRequest.userId`); companions are `TripTraveler` rows of kind `ADULT`.
Feature log and decisions: `odd/tasks/split-payments.md`.

## Data model

- `TripRequest.paymentMode` — `TOTAL | INDIVIDUAL` (default `TOTAL`).
- `TripRequest.status` adds `COLLECTING`: the organizer paid, companions are paying.
- `TripRequest.paymentDeadline` — end of collection (organizer payment + 72 h).
- `TripRequest.topUpDeadline` — end of the top-up grace period (deadline + 48 h);
  cleared once the grace period is closed.
- `Payment` stays the single trip bill (one per trip). `Payment.amount` is the
  bill, not what one person paid.
- `PaymentShare` — one charge against that bill: `SHARE` (initial share; the
  organizer's has `travelerId: null`), `TOP_UP` (re-split after drop-outs),
  `ORGANIZER_REMAINDER` (unpaid top-ups the organizer covers). Each share has its
  own Stripe PaymentIntent; `reminderSentAt` stamps the top-up reminder.

Migrations: `20261026120000_split_payments`, `20261027120000_payment_share_reminder`
(both additive). On the nonproduction database apply them with
`prisma db execute --file <migration.sql>` after `prisma migrate diff` shows only
the new objects (the database has no migration history).

## Flow

1. **Checkout** (`/checkout`): with more than one adult and a non-fixed party the
   buyer picks *Pay individually*, enters one email per companion and clicks
   *Calculate my share*. The payment form stays hidden until that share is quoted,
   and the disclaimer (deadline + maximum top-up) must be accepted. The organizer
   pays only their own share; a promo is split evenly across all shares.
   (`src/lib/payments/checkout-quote.ts`, `split-shares.ts`)
2. **Organizer settles** (Stripe webhook / confirm-payment): the trip moves to
   `COLLECTING` with `paymentDeadline`, companions get an invite with their share,
   deadline and maximum top-up. Booking-confirmed emails and the sale notification
   wait for the deadline.
3. **Companions pay** from the invite → `/checkout/share/[travelerId]`
   (`POST /api/stripe/share-intent`). Only the linked companion can pay their share.
4. **Deadline** (hourly job): open share intents are cancelled (or settled if
   Stripe already charged them), companions who did not pay are dropped, the trip
   is `CONFIRMED` for those who paid, per-trip costs are re-split into `TOP_UP`
   shares, payers are emailed, and the deferred booking emails and sale go out.
   If everyone paid there are no top-ups.
5. **Top-ups** (48 h): payers see a banner on `/dashboard/traveler` and pay in a
   modal, entering their card again (`POST /api/stripe/top-up-intent`). One
   reminder goes out in the last 24 h.
6. **Grace end** (hourly job): unpaid top-ups are folded into one
   `ORGANIZER_REMAINDER` for the organizer, who is emailed and pays it from the
   same dashboard banner. **The destination is not auto-revealed** while any
   top-up or the remainder is unpaid (an admin can still reveal manually).

Stripe webhooks route intents with `metadata.kind` in `SHARE | TOP_UP |
ORGANIZER_REMAINDER` to the share (`settleShareFromStripe`); all other intents
settle the trip `Payment` as before.

## Scheduled job

`netlify/functions/split-payment-deadline.ts` (hourly at :00, production only)
calls `POST /api/internal/split-payment-deadline` with `CRON_SECRET`. Passes, each
isolated so one failure does not skip the others: deadline, re-invite, top-up
reminder, organizer remainder. Every pass is idempotent and safe to re-run.

## Operations

- **Overpayment:** when the smaller group ends up cheaper per person (PAWS
  losing its multiplier, a fixed-amount promo over fewer people), payers keep the
  extra and `Payment.amount` records what was collected. The job logs
  `[split-deadline] collected more than the trip now costs; refund by hand if due`
  with the trip and amounts — refund from Stripe by hand when due.
- **Stuck collection:** a trip stays `COLLECTING` if a share intent is still
  `processing` or Stripe/the database is unavailable; the next hourly run retries.
- **Nonproduction:** the job does not run, so `INDIVIDUAL` trips stay
  `COLLECTING` there; call the internal route against a production-like
  environment to exercise it.

## Testing locally

The job route only runs in production. Locally (with `RT_DEPLOY_ENV=nonproduction`
and Stripe test keys) use the tick script, one trip at a time — the local `.env`
points at the shared develop database:

```
npm run split:tick                                          # list INDIVIDUAL trips (dry run)
npm run split:tick -- --trip <id> --now 2026-11-02T12:00:00Z  # run the steps due at that time
```

Run it once past the trip's `paymentDeadline`, then again past the printed
`topUpDeadline`. Forward Stripe webhooks with
`stripe listen --forward-to localhost:<port>/api/stripe/webhook`.
