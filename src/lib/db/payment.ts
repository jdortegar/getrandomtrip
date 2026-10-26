import { sendAdminNewBooking, sendBookingConfirmed, sendPaymentFailed } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import type { PaymentMode, PaymentStatus, Prisma } from "@prisma/client";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";
import { runSaleNotificationBatch } from "@/lib/db/runSaleNotificationBatch";

export interface CreatePaymentData {
  userId: string;
  tripRequestId: string;
  provider: string;
  amount: number;
  currency?: string;
  stripePaymentIntentId?: string;
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
  /** Checkout promo code from PaymentIntent metadata, for campaign attribution. */
  promoCode?: string;
  /** Stripe promotion code id (`promo_...`) from PaymentIntent metadata. */
  stripePromotionCodeId?: string;
  /** Promo discount in major USD units (e.g. `30.5` = USD 30.50), from PaymentIntent metadata. */
  promoDiscountUsd?: number;
  providerResponse?: any;
  webhookData?: any;
}

/** Promo columns copied from a verified PaymentIntent's checkout metadata. */
export type PromoAttribution = Pick<
  UpdatePaymentData,
  "promoCode" | "stripePromotionCodeId" | "promoDiscountUsd"
>;

/**
 * Reads checkout promo attribution from PaymentIntent metadata. Checkout writes
 * `""` / `"0"` when no promo applies, so empty or non-positive values stay
 * unset; `discountAmountUsd` must be a finite positive number string.
 */
export function promoAttributionFromMetadata(
  metadata: Record<string, string> | null | undefined,
): PromoAttribution {
  const raw = metadata?.discountAmountUsd;
  const discount = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  return {
    promoCode: metadata?.promoCode || undefined,
    stripePromotionCodeId: metadata?.promoCodeId || undefined,
    promoDiscountUsd: Number.isFinite(discount) && discount > 0 ? discount : undefined,
  };
}

/**
 * Create a new payment record
 */
export async function createPayment(data: CreatePaymentData) {
  return await prisma.payment.create({
    data: {
      userId: data.userId,
      tripRequestId: data.tripRequestId,
      provider: data.provider,
      stripePaymentIntentId: data.stripePaymentIntentId,
      amount: data.amount,
      currency: data.currency ?? "USD",
      expiresAt: data.expiresAt,
      status: "PENDING",
    },
  });
}

/** INDIVIDUAL checkout: what the organizer pays now and each companion owes. */
export interface CheckoutSplit {
  /** USD cents charged on the organizer's intent. */
  organizerCents: number;
  /** One per adult companion, in roster order; emails are normalized. */
  companions: { email: string; amountCents: number }[];
}

/**
 * Creates or updates the single `Payment` row for a trip (unique `tripRequestId`).
 * Used when the user starts checkout again — resets to PENDING with new Stripe PaymentIntent.
 * With `split`, `amount` is the trip bill and the organizer's intent is also
 * recorded as their `PaymentShare`; companion rows and their pending shares are
 * rebuilt from `split.companions`. A trip leaving INDIVIDUAL mode drops them.
 */
export async function upsertPaymentForTripCheckout(data: CreatePaymentData & {
  expectedTripUpdatedAt: Date;
  level: string;
  paxDetails: PaxDetails;
  previousPayment: { id: string; stripePaymentIntentId: string | null } | null;
  previousPaymentMode?: PaymentMode;
  split?: CheckoutSplit;
}) {
  const currency = data.currency ?? "USD";
  const paymentMode: PaymentMode = data.split ? "INDIVIDUAL" : "TOTAL";
  return prisma.$transaction(async (tx) => {
    const conflict = () => Object.assign(new Error("Checkout changed, please retry"), { status: 409 });
    const party = data.paxDetails;
    const changed = await tx.tripRequest.updateMany({
      where: { id: data.tripRequestId, userId: data.userId, updatedAt: data.expectedTripUpdatedAt,
        status: { in: ["SAVED", "PENDING_PAYMENT"] } },
      data: { status: "PENDING_PAYMENT", level: data.level, pax: party.adults + party.minors, paxDetails: { ...party },
        ...(data.split || data.previousPaymentMode === "INDIVIDUAL" ? { paymentMode } : {}) },
    });
    if (changed.count !== 1) throw conflict();
    const fields = {
      amount: data.amount, currency, expiresAt: data.expiresAt, provider: data.provider,
      stripePaymentIntentId: data.stripePaymentIntentId, status: "PENDING" as const,
    };
    if (data.previousPayment) {
      const updated = await tx.payment.updateMany({
        where: { id: data.previousPayment.id, stripePaymentIntentId: data.previousPayment.stripePaymentIntentId,
          status: { in: [...RETRYABLE_PAYMENT_STATUSES] } },
        data: { ...fields, providerPaymentId: null },
      });
      if (updated.count !== 1) throw conflict();
      await syncCheckoutSplit(tx, data, data.previousPayment.id, currency);
      return;
    }
    const created = await tx.payment.create({ data: { ...fields, tripRequestId: data.tripRequestId, userId: data.userId } });
    await syncCheckoutSplit(tx, data, created.id, currency);
  });
}

/**
 * Rebuilds the pre-payment split. Only runs while the payment is retryable, so
 * every unclaimed ADULT row was created here (the paid roster comes later).
 */
async function syncCheckoutSplit(
  tx: Prisma.TransactionClient,
  data: { tripRequestId: string; userId: string; stripePaymentIntentId?: string;
    previousPaymentMode?: PaymentMode; split?: CheckoutSplit },
  paymentId: string,
  currency: string,
) {
  if (!data.split && data.previousPaymentMode !== "INDIVIDUAL") return;
  await tx.paymentShare.deleteMany({ where: { paymentId, status: { in: [...RETRYABLE_PAYMENT_STATUSES] } } });
  await tx.tripTraveler.deleteMany({
    where: { tripRequestId: data.tripRequestId, kind: "ADULT", userId: null },
  });
  if (!data.split) return;
  await tx.paymentShare.create({
    data: { paymentId, userId: data.userId, kind: "SHARE", currency,
      amount: data.split.organizerCents / 100, stripePaymentIntentId: data.stripePaymentIntentId },
  });
  for (const companion of data.split.companions) {
    const traveler = await tx.tripTraveler.create({
      data: { tripRequestId: data.tripRequestId, kind: "ADULT", email: companion.email },
    });
    await tx.paymentShare.create({
      data: { paymentId, travelerId: traveler.id, kind: "SHARE", currency,
        amount: companion.amountCents / 100 },
    });
  }
}

/**
 * Update payment status and details
 */
export async function updatePayment(
  paymentId: string,
  data: UpdatePaymentData,
) {
  return await prisma.payment.update({
    where: { id: paymentId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Find payment by provider payment ID
 */
export async function findPaymentByProviderId(providerPaymentId: string) {
  return await prisma.payment.findFirst({
    where: { providerPaymentId },
    include: {
      user: true,
      tripRequest: true,
    },
  });
}

/**
 * Find payment by Stripe PaymentIntent ID
 */
export async function findPaymentByStripeIntentId(
  stripePaymentIntentId: string,
) {
  return await prisma.payment.findUnique({
    where: { stripePaymentIntentId },
    include: {
      user: true,
      tripRequest: true,
    },
  });
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: string, limit = 10) {
  return await prisma.payment.findMany({
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
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get trip payment
 */
export async function getTripPayment(tripRequestId: string) {
  return await prisma.payment.findUnique({
    where: { tripRequestId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Update payment from a Stripe PaymentIntent webhook event.
 * Resolves the DB row via `stripePaymentIntentId` → `providerPaymentId` fallback.
 */
export async function updatePaymentFromStripeWebhook(
  stripePaymentIntentId: string,
  updateData: UpdatePaymentData,
  webhookPayload?: unknown,
  liveMode = false,
) {
  // Try fast lookup via unique index first, then fall back to providerPaymentId
  const payment =
    (await findPaymentByStripeIntentId(stripePaymentIntentId)) ??
    (await findPaymentByProviderId(stripePaymentIntentId));

  if (!payment) {
    throw new Error(
      `Payment not found for Stripe PaymentIntent id=${stripePaymentIntentId}`,
    );
  }

  // Terminal Stripe outcomes cannot be reversed by an older or duplicate event.
  const TERMINAL_STATUSES: PaymentStatus[] = [
    "APPROVED",
    "COMPLETED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
    "CHARGEBACK",
    "CANCELLED",
  ];
  const repairsApprovedBooking = payment.status === "APPROVED" &&
    updateData.status === "APPROVED" &&
    ["DRAFT", "SAVED", "PENDING_PAYMENT"].includes(payment.tripRequest.status);
  if (
    (!repairsApprovedBooking && TERMINAL_STATUSES.includes(payment.status)) ||
    (!repairsApprovedBooking && payment.status === updateData.status) ||
    (payment.stripePaymentIntentId !== null && payment.stripePaymentIntentId !== stripePaymentIntentId)
  ) {
    // Older settlements (or a fallback that predates promo persistence) may
    // lack promo columns; the later webhook fills each one only while it is
    // still null on the same intent, so stored values are never overwritten.
    if (payment.stripePaymentIntentId === stripePaymentIntentId) {
      if (updateData.stripePromotionCodeId && payment.stripePromotionCodeId == null) {
        await prisma.payment.updateMany({
          where: { id: payment.id, stripePaymentIntentId, stripePromotionCodeId: null },
          data: {
            promoCode: updateData.promoCode,
            stripePromotionCodeId: updateData.stripePromotionCodeId,
          },
        });
      }
      if (updateData.promoDiscountUsd != null && payment.promoDiscountUsd == null) {
        await prisma.payment.updateMany({
          where: { id: payment.id, stripePaymentIntentId, promoDiscountUsd: null },
          data: { promoDiscountUsd: updateData.promoDiscountUsd },
        });
      }
    }
    return payment;
  }

  const existingRaw = payment.providerResponse;
  const existingObj =
    existingRaw !== null &&
    typeof existingRaw === "object" &&
    !Array.isArray(existingRaw)
      ? (existingRaw as Record<string, unknown>)
      : {};

  const mergedProviderResponse = JSON.parse(
    JSON.stringify({ ...existingObj, ...(webhookPayload ?? {}) }),
  ) as Prisma.InputJsonValue;

  const finalData: UpdatePaymentData = {
    ...updateData,
    stripePaymentIntentId,
    providerPaymentId: stripePaymentIntentId,
    providerResponse: mergedProviderResponse,
    webhookData:
      (webhookPayload as UpdatePaymentData["webhookData"]) ?? undefined,
  };

  // Match checkout's lock order: TripRequest before Payment. The provisional
  // promotion is invisible until commit and must roll back if the claim is lost.
  const lostClaim = new Error("Payment claim changed");
  const outcome = await prisma.$transaction(async (tx) => {
    const promoted = finalData.status === "APPROVED"
      ? await tx.tripRequest.updateMany({
          where: {
            id: payment.tripRequestId,
            status: { in: ["DRAFT", "SAVED", "PENDING_PAYMENT"] },
          },
          data: { status: "CONFIRMED" },
        })
      : { count: 0 };
    const { count } = await tx.payment.updateMany({
      where: {
        id: payment.id,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        ...(payment.stripePaymentIntentId === null ? { providerPaymentId: stripePaymentIntentId } : {}),
        ...(repairsApprovedBooking
          ? { status: "APPROVED" }
          : finalData.status === "APPROVED"
            ? { status: { notIn: TERMINAL_STATUSES } }
            : { status: payment.status, updatedAt: payment.updatedAt }),
      },
      data: { ...finalData, updatedAt: new Date() },
    });
    if (count === 0) throw lostClaim;
    // Mode comes from the verified provider intent, never the browser request.
    // Test/unknown mode still settles normally but cannot reach the sales outbox.
    const saleQueued = liveMode && finalData.status === "APPROVED" && !repairsApprovedBooking;
    if (saleQueued) {
      const settled = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        select: { amount: true, currency: true },
      });
      await tx.saleNotificationDelivery.create({
        data: { paymentId: payment.id, stripePaymentIntentId,
          tripRequestId: payment.tripRequestId, ...settled },
      });
    }
    return { changed: true, confirmed: promoted.count === 1, saleQueued };
  }).catch((error: unknown) => {
    if (error === lostClaim) return { changed: false, confirmed: false, saleQueued: false };
    throw error;
  });
  if (!outcome.changed) return payment;

  // External side effects only after commit and only for the winning promotion.
  if (outcome.confirmed) {
    sendBookingConfirmed(payment.tripRequestId, payment.userId);
    sendAdminNewBooking(payment.tripRequestId, payment.userId);
  }
  if (finalData.status === "FAILED") {
    sendPaymentFailed(payment.tripRequestId, payment.userId);
  }
  if (outcome.saleQueued) {
    // The durable event is already committed: Slack/worker failures must never
    // undo a paid booking. An hourly worker retries interrupted delivery.
    await runSaleNotificationBatch(payment.id).catch(() => {
      console.error("[sales] immediate delivery unavailable; queued for retry");
    });
  }

  return { ...payment, ...finalData };
}
