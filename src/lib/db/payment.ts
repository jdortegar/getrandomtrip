import { sendAdminNewBooking, sendBookingConfirmed, sendPaymentFailed } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus, Prisma } from "@prisma/client";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import { RETRYABLE_PAYMENT_STATUSES } from "@/lib/helpers/checkout-trip";

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
  providerResponse?: any;
  webhookData?: any;
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

/**
 * Creates or updates the single `Payment` row for a trip (unique `tripRequestId`).
 * Used when the user starts checkout again — resets to PENDING with new Stripe PaymentIntent.
 */
export async function upsertPaymentForTripCheckout(data: CreatePaymentData & {
  expectedTripUpdatedAt: Date;
  level: string;
  paxDetails: PaxDetails;
  previousPayment: { id: string; stripePaymentIntentId: string | null } | null;
}) {
  const currency = data.currency ?? "USD";
  return prisma.$transaction(async (tx) => {
    const conflict = () => Object.assign(new Error("Checkout changed, please retry"), { status: 409 });
    const party = data.paxDetails;
    const changed = await tx.tripRequest.updateMany({
      where: { id: data.tripRequestId, userId: data.userId, updatedAt: data.expectedTripUpdatedAt,
        status: { in: ["SAVED", "PENDING_PAYMENT"] } },
      data: { status: "PENDING_PAYMENT", level: data.level, pax: party.adults + party.minors, paxDetails: { ...party } },
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
      return;
    }
    await tx.payment.create({ data: { ...fields, tripRequestId: data.tripRequestId, userId: data.userId } });
  });
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
  if (
    TERMINAL_STATUSES.includes(payment.status) ||
    payment.status === updateData.status ||
    (payment.stripePaymentIntentId !== null && payment.stripePaymentIntentId !== stripePaymentIntentId)
  ) {
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

  // Lookup is only a snapshot: a quote or another webhook can replace it while
  // this request waits. Every outcome, not just success, must win this guard.
  const { count } = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      ...(payment.stripePaymentIntentId === null ? { providerPaymentId: stripePaymentIntentId } : {}),
      ...(finalData.status === "APPROVED"
        // Real settlement wins over nonterminal same-intent refresh/failure,
        // but never over a replacement intent or terminal outcome.
        ? { status: { notIn: TERMINAL_STATUSES } }
        : { status: payment.status, updatedAt: payment.updatedAt }),
    },
    data: { ...finalData, updatedAt: new Date() },
  });
  if (count === 0) return payment;

  if (finalData.status === "APPROVED") {
      await prisma.tripRequest.update({
        where: { id: payment.tripRequestId },
        data: { status: "CONFIRMED" },
      });
      sendBookingConfirmed(payment.tripRequestId, payment.userId);
      sendAdminNewBooking(payment.tripRequestId, payment.userId);
  }

  if (finalData.status === "FAILED") {
    sendPaymentFailed(payment.tripRequestId, payment.userId);
  }

  return { ...payment, ...finalData };
}
