# Stripe Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MercadoPago with Stripe Elements (embedded) as the sole payment provider, with the card form living inside the existing `/checkout` page.

**Architecture:** The user fills the contact form → submits → server creates a Stripe PaymentIntent (amount computed server-side from DB trip data) → `<PaymentElement>` appears inline → user enters card details and confirms → webhook updates payment status and confirms the trip. A `stripePaymentIntentId` field is added to `Payment`; all MP-specific DB fields are removed.

**Tech Stack:** `stripe` (Node SDK), `@stripe/stripe-js`, `@stripe/react-stripe-js`, Prisma, Next.js 14 App Router, NextAuth, TypeScript strict

---

## Task 1: Install packages and update env

**Files:**
- Modify: `package.json`
- Modify: `env.example`

- [ ] **Step 1: Install Stripe packages and remove MercadoPago**

```bash
cd /Users/jdortega/repos/getrandomtrip
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm uninstall mercadopago
```

Expected: packages installed/removed with no errors.

- [ ] **Step 2: Update `env.example`**

Replace the MP and old Stripe block with:

```
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Remove these lines:
```
STRIPE_PUBLIC_KEY="your-stripe-public-key"
MERCADOPAGO_TEST_ACCESS_TOKEN="your-mercadopago-test-access-token"
MERCADOPAGO_TEST_PUBLIC_KEY="your-mercadopago-test-public-key"
MERCADOPAGO_TEST_PAYER_EMAIL=""
MERCADOPAGO_LIVE_ACCESS_TOKEN="your-mercadopago-live-access-token"
MERCADOPAGO_LIVE_PUBLIC_KEY="your-mercadopago-live-public-key"
```

- [ ] **Step 3: Add Stripe keys to your local `.env.local`**

Add the three Stripe vars (use test keys from your Stripe dashboard):
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json env.example
git commit -m "chore: swap mercadopago for stripe packages"
```

---

## Task 2: Update Prisma schema and run migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Edit the `Payment` model**

In `prisma/schema.prisma`, find the `Payment` model. Make these changes:

Remove the `// MercadoPago Specific` block (lines ~220–224):
```prisma
  // MercadoPago Specific
  mpExternalReference   String? // External reference sent to MP
  mpDescription         String? // Payment description
  mpStatementDescriptor String? // Statement descriptor
  mpMetadata            Json?   // Additional MP metadata
```

Remove `providerPreferenceId` from the `// Provider Information` block:
```prisma
  providerPreferenceId    String? // MP preference ID
```

Add `stripePaymentIntentId` after `providerPaymentId` in the `// Provider Information` block:
```prisma
  stripePaymentIntentId   String? @unique // Stripe PaymentIntent ID for fast webhook lookup
```

The `// Provider Information` block should now read:
```prisma
  // Provider Information
  provider                String  // 'stripe'
  providerPaymentId       String? // Stripe PaymentIntent ID
  stripePaymentIntentId   String? @unique // Stripe PaymentIntent ID for fast webhook lookup
  providerMerchantOrderId String? // MP merchant order ID (legacy, kept for historical rows)
  providerSessionId       String? // Session/token for provider
```

- [ ] **Step 2: Run migration**

```bash
npm run db:migrate
```

When prompted for a migration name, enter: `remove_mp_add_stripe`

Expected output includes: `The following migration(s) have been applied` and `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
npm run db:generate
npm run typecheck
```

Expected: `npm run typecheck` exits with no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: update Payment schema — add stripePaymentIntentId, remove MP fields"
```

---

## Task 3: Update `src/lib/db/payment.ts`

**Files:**
- Modify: `src/lib/db/payment.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { prisma } from '@/lib/prisma';
import type { PaymentStatus } from '@prisma/client';
import type Stripe from 'stripe';

export interface CreatePaymentData {
  userId: string;
  tripRequestId: string;
  provider: string;
  stripePaymentIntentId?: string;
  providerPaymentId?: string;
  amount: number;
  currency?: string;
  expiresAt?: Date;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  statusDetail?: string;
  failureReason?: string;
  providerPaymentId?: string;
  stripePaymentIntentId?: string;
  providerMerchantOrderId?: string;
  paymentMethod?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiryMonth?: number;
  cardExpiryYear?: number;
  cardholderName?: string;
  netAmount?: number;
  feeAmount?: number;
  taxAmount?: number;
  paidAt?: Date;
  providerResponse?: unknown;
  webhookData?: unknown;
}

/**
 * Creates or updates the single `Payment` row for a trip (unique `tripRequestId`).
 * Resets to PENDING on each new checkout attempt.
 */
export async function upsertPaymentForTripCheckout(data: CreatePaymentData) {
  const currency = data.currency ?? 'USD';

  return prisma.payment.upsert({
    create: {
      amount: data.amount,
      currency,
      expiresAt: data.expiresAt,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      status: 'PENDING',
      tripRequestId: data.tripRequestId,
      userId: data.userId,
    },
    update: {
      amount: data.amount,
      currency,
      expiresAt: data.expiresAt,
      providerPaymentId: data.providerPaymentId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      /** New checkout attempt — reset so webhook assigns new payment id. */
      status: 'PENDING',
    },
    where: { tripRequestId: data.tripRequestId },
  });
}

/**
 * Update payment status and details
 */
export async function updatePayment(paymentId: string, data: UpdatePaymentData) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Find payment by Stripe PaymentIntent ID (primary webhook lookup path).
 */
export async function findPaymentByStripePaymentIntentId(stripePaymentIntentId: string) {
  return prisma.payment.findUnique({
    where: { stripePaymentIntentId },
    include: { user: true, tripRequest: true },
  });
}

/**
 * Find payment by providerPaymentId (generic fallback lookup).
 */
export async function findPaymentByProviderId(providerPaymentId: string) {
  return prisma.payment.findFirst({
    where: { providerPaymentId },
    include: { user: true, tripRequest: true },
  });
}

/**
 * Find payment by preference ID (kept for legacy compatibility).
 */
export async function findPaymentByPreferenceId(providerPreferenceId: string) {
  return prisma.payment.findFirst({
    where: { providerPaymentId: providerPreferenceId },
    include: { user: true, tripRequest: true },
  });
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: string, limit = 10) {
  return prisma.payment.findMany({
    where: { userId },
    include: {
      tripRequest: {
        select: {
          id: true,
          type: true,
          level: true,
          startDate: true,
          endDate: true,
          originCountry: true,
          originCity: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get trip payment
 */
export async function getTripPayment(tripRequestId: string) {
  return prisma.payment.findUnique({
    where: { tripRequestId },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

const STRIPE_STATUS_MAP: Record<string, PaymentStatus> = {
  succeeded: 'APPROVED',
  processing: 'PROCESSING',
  canceled: 'CANCELLED',
  requires_payment_method: 'FAILED',
  requires_action: 'PENDING',
  requires_confirmation: 'PENDING',
};

/**
 * Updates Payment row and TripRequest status from a Stripe PaymentIntent event.
 * Called by the webhook handler for payment_intent.succeeded/payment_failed/canceled.
 */
export async function updatePaymentFromStripeEvent(
  event: Stripe.Event,
): Promise<void> {
  const intent = event.data.object as Stripe.PaymentIntent;

  const resolvedPayment =
    (await findPaymentByStripePaymentIntentId(intent.id)) ??
    (await findPaymentByProviderId(intent.id));

  if (!resolvedPayment) {
    console.error('updatePaymentFromStripeEvent: no payment found for intent', intent.id);
    return;
  }

  const newStatus: PaymentStatus = STRIPE_STATUS_MAP[intent.status] ?? 'PENDING';

  await prisma.payment.update({
    where: { id: resolvedPayment.id },
    data: {
      status: newStatus,
      providerPaymentId: intent.id,
      stripePaymentIntentId: intent.id,
      paidAt: intent.status === 'succeeded' ? new Date() : undefined,
      providerResponse: JSON.parse(JSON.stringify(intent)),
      webhookData: JSON.parse(JSON.stringify(event)),
      updatedAt: new Date(),
    },
  });

  if (newStatus === 'APPROVED') {
    await prisma.tripRequest.update({
      where: { id: resolvedPayment.tripRequestId },
      data: { status: 'CONFIRMED' },
    });
  }
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/payment.ts
git commit -m "feat: replace MP payment DB layer with Stripe — add updatePaymentFromStripeEvent"
```

---

## Task 4: Create `/api/stripe/payment-intent` route

**Files:**
- Create: `src/app/api/stripe/payment-intent/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { calculatePaymentTotals } from '@/lib/helpers/payment-totals';
import { getPricePerPerson } from '@/lib/data/traveler-types';
import { upsertPaymentForTripCheckout } from '@/lib/db/payment';
import type { AddonSelection, Filters, Logistics } from '@/store/slices/journeyStore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { tripId?: string };
    const { tripId } = body;
    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const trip = await prisma.tripRequest.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    if (trip.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Compute total server-side — never trust client-supplied amount
    const pax = trip.pax || 1;
    const basePriceUsd = getPricePerPerson(trip.type, trip.level, pax);
    const filters: Filters = {
      accommodationType: trip.accommodationType,
      arrivePref: trip.arrivePref,
      avoidDestinations: trip.avoidDestinations,
      climate: trip.climate,
      departPref: trip.departPref,
      maxTravelTime: trip.maxTravelTime,
      transport: trip.transport,
    };
    const logistics: Logistics = {
      city: trip.originCity,
      country: trip.originCountry,
      nights: trip.nights,
      pax,
    };
    const addons = { selected: (trip.addons as AddonSelection[] | null) ?? [] };
    const { totalTrip } = calculatePaymentTotals({
      addons,
      avoidCount: trip.avoidDestinations.length,
      basePriceUsd,
      filters,
      logistics,
    });
    const amountInCents = Math.round(totalTrip * 100);

    // Idempotency: reuse existing PENDING PaymentIntent if still valid
    const existingPayment = await prisma.payment.findUnique({
      where: { tripRequestId: tripId },
    });
    if (existingPayment?.stripePaymentIntentId && existingPayment.status === 'PENDING') {
      try {
        const existing = await stripe.paymentIntents.retrieve(
          existingPayment.stripePaymentIntentId,
        );
        if (
          existing.status === 'requires_payment_method' ||
          existing.status === 'requires_confirmation' ||
          existing.status === 'requires_action'
        ) {
          return NextResponse.json({
            clientSecret: existing.client_secret,
            paymentIntentId: existing.id,
          });
        }
      } catch {
        // PaymentIntent not found or expired — fall through to create new
      }
    }

    // Create new PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { tripId, userId: user.id },
    });

    await upsertPaymentForTripCheckout({
      userId: user.id,
      tripRequestId: tripId,
      provider: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      providerPaymentId: paymentIntent.id,
      amount: totalTrip,
      currency: 'USD',
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('stripe payment-intent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/payment-intent/route.ts
git commit -m "feat: add POST /api/stripe/payment-intent with server-side pricing and idempotency"
```

---

## Task 5: Create `/api/stripe/webhook` route

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updatePaymentFromStripeEvent } from '@/lib/db/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  // Must read raw text — request.json() corrupts the body and breaks signature verification
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await updatePaymentFromStripeEvent(event);
        break;
      default:
        // Not an event we act on — still return 200 so Stripe doesn't retry
        break;
    }
  } catch (error) {
    console.error('Stripe webhook processing error:', { eventType: event.type, error });
    // Return 200 anyway — Stripe retries on non-2xx which causes duplicate processing
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat: add POST /api/stripe/webhook with signature verification"
```

---

## Task 6: Create `src/lib/stripe-client.ts`

**Files:**
- Create: `src/lib/stripe-client.ts`

- [ ] **Step 1: Create the file**

```typescript
import { loadStripe } from '@stripe/stripe-js';

/**
 * Module-level singleton — import this instead of calling loadStripe() in components
 * to avoid re-initializing Stripe on every render.
 */
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stripe-client.ts
git commit -m "feat: add Stripe client singleton"
```

---

## Task 7: Create `StripePaymentForm` component

**Files:**
- Create: `src/components/app/checkout/StripePaymentForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { hasLocale } from '@/lib/i18n/config';

interface StripePaymentFormProps {
  /** Called when user clicks Back to return to the contact form step. */
  onCancel: () => void;
}

export function StripePaymentForm({ onCancel }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const params = useParams();
  const locale = hasLocale(params?.locale as string) ? (params?.locale as string) : 'es';

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success`,
      },
      // For non-3DS cards: resolves here without redirect.
      // For 3DS cards: redirects to return_url, which is /checkout/success.
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    // Non-3DS success — navigate to success page
    window.location.href = `/${locale}/checkout/success`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          disabled={isProcessing}
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={!stripe || isProcessing}
          type="submit"
        >
          {isProcessing ? 'Processing...' : 'Pay now'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/app/checkout/StripePaymentForm.tsx
git commit -m "feat: add StripePaymentForm with PaymentElement and confirmPayment"
```

---

## Task 8: Update `src/hooks/usePayment.ts`

**Files:**
- Modify: `src/hooks/usePayment.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import {
  calculatePaymentTotals,
  type PaymentTotalsInput,
  type PaymentTotalsResult,
} from '@/lib/helpers/payment-totals';

/**
 * Hook for payment calculations and Stripe PaymentIntent creation.
 * Amount is computed server-side; this hook only triggers the intent creation.
 */
export function usePayment(paymentData: PaymentTotalsInput) {
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateTotals = (): PaymentTotalsResult =>
    calculatePaymentTotals(paymentData);

  /**
   * Creates a Stripe PaymentIntent for the given trip.
   * Returns the client secret needed to mount <PaymentElement>.
   */
  const createPaymentIntent = async (
    tripId: string,
  ): Promise<{ clientSecret: string }> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to create payment intent');
      }

      const { clientSecret } = (await response.json()) as { clientSecret: string };
      return { clientSecret };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    calculateTotals,
    createPaymentIntent,
  };
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors. If `checkout/page.tsx` errors on `initiatePayment` not existing, that is expected and will be fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePayment.ts
git commit -m "feat: replace usePayment MP logic with Stripe createPaymentIntent"
```

---

## Task 9: Update `src/app/[locale]/(secure)/checkout/page.tsx`

**Files:**
- Modify: `src/app/[locale]/(secure)/checkout/page.tsx`

- [ ] **Step 1: Add new imports at the top of the file**

After the existing imports, add:
```typescript
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe-client';
import { StripePaymentForm } from '@/components/app/checkout/StripePaymentForm';
```

- [ ] **Step 2: Add `clientSecret` state inside `CheckoutContent`**

Find the block of `useState` declarations. Add after `const [showPromocodeInput, setShowPromocodeInput] = useState(false);`:

```typescript
const [clientSecret, setClientSecret] = useState<string | null>(null);
```

- [ ] **Step 3: Update the `usePayment` destructure**

Find:
```typescript
const { isProcessing, calculateTotals, initiatePayment } = usePayment(
```

Replace with:
```typescript
const { isProcessing, calculateTotals, createPaymentIntent } = usePayment(
```

- [ ] **Step 4: Replace `payNow` with `createPayment`**

Find the entire `payNow` function:
```typescript
  const payNow = async (payer?: { email?: string; name?: string }) => {
    if (!trip?.id) return;
    try {
      await persistCheckoutTravelers(paxDetails);
      await initiatePayment(trip.id, payer);
    } catch (err) {
      console.error('Error initiating payment:', err);
      toast.error(dict?.journey?.checkout?.errors?.connectionTryAgain);
    }
  };
```

Replace with:
```typescript
  const createPayment = async () => {
    if (!trip?.id) return;
    try {
      await persistCheckoutTravelers(paxDetails);
      const { clientSecret: secret } = await createPaymentIntent(trip.id);
      setClientSecret(secret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      toast.error(dict?.journey?.checkout?.errors?.connectionTryAgain);
    }
  };
```

- [ ] **Step 5: Update `handleSubmit` to call `createPayment`**

Find in `handleSubmit`:
```typescript
      await payNow({
        email: payerEmail,
        name: saveJson.user?.name ?? formData.name.trim(),
      });
```

Replace with:
```typescript
      await createPayment();
```

- [ ] **Step 6: Add Stripe Elements panel in the JSX return**

Find the closing `</div>` of the grid inside `<div className="container mx-auto px-4 py-12 md:px-20">` — it's right before `<ChatFab />`. Add the Stripe payment panel inside the container div, after the grid:

```tsx
        {clientSecret && (
          <div className="mt-8 mx-auto max-w-xl">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                {dict?.journey?.checkout?.paymentTitle ?? 'Payment'}
              </h2>
              <Elements
                options={{ clientSecret, appearance: { theme: 'stripe' } }}
                stripe={stripePromise}
              >
                <StripePaymentForm onCancel={() => setClientSecret(null)} />
              </Elements>
            </div>
          </div>
        )}
```

Place this immediately after the `</div>` that closes the grid (`lg:grid-cols-2` div), before `<ChatFab />`.

- [ ] **Step 7: Add `paymentTitle` key to dictionaries**

In `src/dictionaries/en.json`, find `"journey"` → `"checkout"` and add:
```json
"paymentTitle": "Complete your payment",
```

In `src/dictionaries/es.json`, find `"journey"` → `"checkout"` and add:
```json
"paymentTitle": "Completar pago",
```

In `src/lib/types/dictionary.ts`, find the `checkout` interface inside `journey` and add:
```typescript
paymentTitle: string;
```

- [ ] **Step 8: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/\[locale\]/\(secure\)/checkout/page.tsx src/dictionaries/en.json src/dictionaries/es.json src/lib/types/dictionary.ts
git commit -m "feat: wire Stripe Elements into checkout page"
```

---

## Task 10: Update `CheckoutResultSuccess.tsx`

**Files:**
- Modify: `src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Confetti from '@/components/feedback/Confetti';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import HeaderHero from '@/components/journey/HeaderHero';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface CheckoutResultSuccessProps {
  hero: Dictionary['confirmation']['hero'];
  labels: Dictionary['confirmation']['page'];
  locale: string;
  /** Stripe redirect params parsed server-side from searchParams. */
  stripeReturn?: { paymentIntent: string | null; redirectStatus: string | null } | null;
}

export default function CheckoutResultSuccess({
  hero,
  labels,
  locale,
  stripeReturn,
}: CheckoutResultSuccessProps) {
  const searchParams = useSearchParams();
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');

  // Prefer server-parsed params; fall back to client URL for non-3DS in-page navigations
  const redirectStatus =
    stripeReturn?.redirectStatus ?? searchParams.get('redirect_status');
  const hasFailed = redirectStatus === 'requires_payment_method';

  const [loading, setLoading] = useState(false);
  const showSuccess = !hasFailed;

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <HeaderHero
          description={hero.description}
          fallbackImage="/images/hero-image-1.jpeg"
          subtitle={hero.subtitle}
          title={labels.errorTitle}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <main className="flex-grow">
          <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
            <div className="flex w-full max-w-3xl flex-col items-center space-y-4 rounded-lg bg-white px-6 py-10 text-center shadow-lg sm:px-8 sm:py-14">
              <p className="max-w-[80%] font-barlow text-base leading-relaxed text-gray-700 md:text-lg">
                {labels.errorTitle}
              </p>
              <Button
                className="mt-4"
                onClick={() => window.history.back()}
                size="lg"
                variant="default"
              >
                {labels.retry}
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <HeaderHero
          description={hero.description}
          fallbackImage="/images/hero-image-1.jpeg"
          subtitle={hero.subtitle}
          title={hero.title}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <main className="flex-grow">
          <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
            <div className="w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
              <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
                {labels.body}
              </p>
              <p className="text-center font-barlow text-base font-semibold leading-relaxed text-gray-800 md:text-lg">
                {labels.messageApproved}
              </p>
              <div className="flex justify-center pt-2">
                <Button asChild size="lg" variant="default">
                  <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
                </Button>
              </div>
              <div className="flex justify-center pt-2">
                <Button asChild size="default" variant="link">
                  <Link className="text-gray-500 hover:text-gray-700" href={`/${locale}`}>
                    {labels.ctaHome}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
      {showSuccess && <Confetti delay={200} duration={350} speed={3} />}
    </>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(secure)/checkout/CheckoutResultSuccess.tsx"
git commit -m "feat: simplify CheckoutResultSuccess for Stripe — remove MP param handling"
```

---

## Task 11: Update `CheckoutResultPending.tsx` and `CheckoutResultFailure.tsx`

**Files:**
- Modify: `src/app/[locale]/(secure)/checkout/CheckoutResultPending.tsx`
- Modify: `src/app/[locale]/(secure)/checkout/CheckoutResultFailure.tsx`

- [ ] **Step 1: Replace `CheckoutResultPending.tsx`**

```tsx
'use client';

import Link from 'next/link';
import HeaderHero from '@/components/journey/HeaderHero';
import { Button } from '@/components/ui/Button';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface CheckoutResultPendingProps {
  labels: Dictionary['paymentPending'];
  locale: string;
}

export default function CheckoutResultPending({
  labels,
  locale,
}: CheckoutResultPendingProps) {
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <HeaderHero
        description={labels.body}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={labels.subtitle}
        title={labels.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
          <div className="w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
            <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
              {labels.body}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" variant="default">
                <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${locale}`}>{labels.ctaHome}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Replace `CheckoutResultFailure.tsx`**

```tsx
'use client';

import Link from 'next/link';
import HeaderHero from '@/components/journey/HeaderHero';
import { Button } from '@/components/ui/Button';
import { DEFAULT_LOCALE, hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Dictionary } from '@/lib/i18n/dictionaries';

interface CheckoutResultFailureProps {
  labels: Dictionary['paymentFailure'];
  locale: string;
  /** tripId to pre-fill the retry link. */
  tripId?: string | null;
}

export default function CheckoutResultFailure({
  labels,
  locale,
  tripId,
}: CheckoutResultFailureProps) {
  const safeLocale: Locale = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const myTripsHref = pathForLocale(safeLocale, '/dashboard');
  const tryAgainHref = tripId
    ? pathForLocale(safeLocale, `/checkout?tripId=${encodeURIComponent(tripId)}`)
    : pathForLocale(safeLocale, '/journey');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <HeaderHero
        description={labels.body}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={labels.subtitle}
        title={labels.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
          <div className="w-full max-w-3xl space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
            <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
              {labels.body}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link href={tryAgainHref}>{labels.ctaTryAgain}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={myTripsHref}>{labels.ctaMyTrips}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(secure)/checkout/CheckoutResultPending.tsx" "src/app/[locale]/(secure)/checkout/CheckoutResultFailure.tsx"
git commit -m "feat: remove MP params from CheckoutResultPending and CheckoutResultFailure"
```

---

## Task 12: Update server page files

**Files:**
- Modify: `src/app/[locale]/(secure)/checkout/success/page.tsx`
- Modify: `src/app/[locale]/(secure)/checkout/failure/page.tsx`
- Modify: `src/app/[locale]/(secure)/checkout/pending/page.tsx`

- [ ] **Step 1: Replace `success/page.tsx`**

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CheckoutResultSuccess from '../CheckoutResultSuccess';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    return { title: 'Confirmation' };
  }
  const dict = await getDictionary(params.locale);
  return {
    description: dict.confirmation.page.metaDescription,
    title: dict.confirmation.page.title,
  };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!hasLocale(params.locale)) {
    notFound();
  }

  const dict = await getDictionary(params.locale);

  // Parse Stripe 3DS redirect params from the URL
  const raw = (key: string) => {
    const v = searchParams[key];
    return typeof v === 'string' ? v : (Array.isArray(v) ? v[0] : null) ?? null;
  };
  const stripeReturn = {
    paymentIntent: raw('payment_intent'),
    redirectStatus: raw('redirect_status'),
  };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      }
    >
      <CheckoutResultSuccess
        hero={dict.confirmation.hero}
        labels={dict.confirmation.page}
        locale={params.locale}
        stripeReturn={stripeReturn}
      />
    </Suspense>
  );
}
```

- [ ] **Step 2: Replace `failure/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import CheckoutResultFailure from '../CheckoutResultFailure';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    return { title: 'Payment' };
  }
  const dict = await getDictionary(params.locale);
  return {
    description: dict.paymentFailure.metaDescription,
    title: dict.paymentFailure.title,
  };
}

export default async function CheckoutFailurePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!hasLocale(params.locale)) {
    notFound();
  }

  const dict = await getDictionary(params.locale);
  const tripId =
    typeof searchParams.tripId === 'string' ? searchParams.tripId : null;

  return (
    <CheckoutResultFailure
      labels={dict.paymentFailure}
      locale={params.locale}
      tripId={tripId}
    />
  );
}
```

- [ ] **Step 3: Replace `pending/page.tsx`**

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CheckoutResultPending from '../CheckoutResultPending';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    return { title: 'Payment' };
  }
  const dict = await getDictionary(params.locale);
  return {
    description: dict.paymentPending.metaDescription,
    title: dict.paymentPending.title,
  };
}

export default async function CheckoutPendingPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    notFound();
  }

  const dict = await getDictionary(params.locale);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      }
    >
      <CheckoutResultPending
        labels={dict.paymentPending}
        locale={params.locale}
      />
    </Suspense>
  );
}
```

- [ ] **Step 4: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(secure)/checkout/success/page.tsx" "src/app/[locale]/(secure)/checkout/failure/page.tsx" "src/app/[locale]/(secure)/checkout/pending/page.tsx"
git commit -m "feat: update checkout result server pages — remove MP, pass Stripe redirect params"
```

---

## Task 13: Dictionary cleanup

**Files:**
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/es.json`
- Modify: `src/lib/types/dictionary.ts`

- [ ] **Step 1: Remove MP keys from `src/dictionaries/en.json`**

Find and remove these 12 lines from the `"paymentFailure"` section (they are consecutive, lines ~1653–1664):
```json
    "mpDetailsTitle": "Mercado Pago details",
    "mpExternalReference": "External reference",
    "mpPreferenceId": "Preference ID",
    "mpPaymentId": "Payment ID",
    "mpStatus": "Status",
    "mpCollectionId": "Collection ID",
    "mpCollectionStatus": "Collection status",
    "mpPaymentType": "Payment type",
    "mpMerchantOrderId": "Merchant order ID",
    "mpSiteId": "Site",
    "mpProcessingMode": "Processing mode",
    "mpMerchantAccountId": "Merchant account ID"
```

The `"paymentFailure"` section should end with `"ctaMyTrips"` and `"subtitle"` / `"title"` keys only.

- [ ] **Step 2: Remove MP keys from `src/dictionaries/es.json`**

Find and remove the same 12 keys from the `"paymentFailure"` section (same line range, ~1653–1664):
```json
    "mpDetailsTitle": "Detalles (Mercado Pago)",
    "mpExternalReference": "Referencia externa",
    "mpPreferenceId": "ID de preferencia",
    "mpPaymentId": "ID de pago",
    "mpStatus": "Estado",
    "mpCollectionId": "ID de colección",
    "mpCollectionStatus": "Estado de colección",
    "mpPaymentType": "Tipo de pago",
    "mpMerchantOrderId": "ID orden comercio",
    "mpSiteId": "Sitio",
    "mpProcessingMode": "Modo de procesamiento",
    "mpMerchantAccountId": "ID cuenta comercio"
```

- [ ] **Step 3: Remove MP fields from `src/lib/types/dictionary.ts`**

In the `paymentFailure` interface, remove these 12 fields:
```typescript
    mpCollectionId: string;
    mpCollectionStatus: string;
    mpDetailsTitle: string;
    mpExternalReference: string;
    mpMerchantAccountId: string;
    mpMerchantOrderId: string;
    mpPaymentId: string;
    mpPaymentType: string;
    mpPreferenceId: string;
    mpProcessingMode: string;
    mpSiteId: string;
    mpStatus: string;
```

- [ ] **Step 4: Verify types**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/dictionaries/en.json src/dictionaries/es.json src/lib/types/dictionary.ts
git commit -m "chore: remove MP-specific dictionary keys from paymentFailure"
```

---

## Task 14: Delete MP files

**Files to delete:**
- `src/app/api/mercadopago/preference/route.ts`
- `src/app/api/mercadopago/webhook/route.ts`
- `src/app/api/payments/confirm/route.ts`
- `src/app/api/payments/mercadopago/checkout-return/route.ts`
- `src/lib/helpers/confirm-mercadopago-payment-from-return.ts`
- `src/lib/helpers/persist-mercadopago-checkout-return.ts`
- `src/lib/types/MercadoPagoCheckoutReturnParams.ts`
- `src/lib/helpers/mercadopago-checkout-params.ts`

- [ ] **Step 1: Delete the files**

```bash
rm src/app/api/mercadopago/preference/route.ts
rm src/app/api/mercadopago/webhook/route.ts
rm src/app/api/payments/confirm/route.ts
rm src/app/api/payments/mercadopago/checkout-return/route.ts
rm src/lib/helpers/confirm-mercadopago-payment-from-return.ts
rm src/lib/helpers/persist-mercadopago-checkout-return.ts
rm src/lib/types/MercadoPagoCheckoutReturnParams.ts
rm src/lib/helpers/mercadopago-checkout-params.ts
# Remove empty directories
rmdir src/app/api/mercadopago/preference src/app/api/mercadopago/webhook src/app/api/mercadopago 2>/dev/null || true
rmdir src/app/api/payments/mercadopago/checkout-return src/app/api/payments/mercadopago 2>/dev/null || true
```

- [ ] **Step 2: Verify no dangling imports**

```bash
npm run typecheck
```

Expected: no errors. If there are missing import errors, search for remaining references:

```bash
grep -r "mercadopago-checkout-params\|MercadoPagoCheckoutReturnParams\|confirm-mercadopago\|persist-mercadopago\|mercadopago/preference\|mercadopago/webhook\|payments/confirm" src/ --include="*.ts" --include="*.tsx"
```

Expected: no output (all references removed in earlier tasks).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete all MercadoPago files and routes"
```

---

## Task 15: Final verification and lint

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors, no warnings about raw `<img>` tags or unused imports.

- [ ] **Step 3: Fix any lint issues**

If lint reports unused imports, remove them. Re-run `npm run lint` until clean.

- [ ] **Step 4: Register Stripe webhook in Stripe dashboard or CLI**

For local testing, run the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:3010/api/stripe/webhook
```

Copy the webhook signing secret it prints (`whsec_...`) into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

For production, register `https://your-domain.com/api/stripe/webhook` in the Stripe Dashboard → Developers → Webhooks, selecting events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

- [ ] **Step 5: Start dev server and smoke test**

```bash
npm run dev
```

Test the golden path:
1. Open `http://localhost:3010/es/checkout?tripId=<a-valid-trip-id>`
2. Fill the contact form and click "Pay Now"
3. Confirm the `<PaymentElement>` card form appears inline
4. Enter Stripe test card `4242 4242 4242 4242`, exp `12/34`, CVC `123`
5. Click "Pay now"
6. Confirm redirect to `/checkout/success` with confetti
7. Check DB: `Payment.status = APPROVED`, `TripRequest.status = CONFIRMED`

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and lint fixes for Stripe migration"
```
