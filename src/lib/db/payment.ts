import { prisma } from '@/lib/prisma';
import type { PaymentStatus, Prisma } from '@prisma/client';

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
      currency: data.currency ?? 'USD',
      expiresAt: data.expiresAt,
      status: 'PENDING',
    },
  });
}

/**
 * Creates or updates the single `Payment` row for a trip (unique `tripRequestId`).
 * Used when the user starts checkout again — resets to PENDING with new Stripe PaymentIntent.
 */
export async function upsertPaymentForTripCheckout(data: CreatePaymentData) {
  const currency = data.currency ?? 'USD';

  return prisma.payment.upsert({
    create: {
      amount: data.amount,
      currency,
      expiresAt: data.expiresAt,
      provider: data.provider,
      stripePaymentIntentId: data.stripePaymentIntentId,
      status: 'PENDING',
      tripRequestId: data.tripRequestId,
      userId: data.userId,
    },
    update: {
      amount: data.amount,
      currency,
      expiresAt: data.expiresAt,
      stripePaymentIntentId: data.stripePaymentIntentId,
      /** New checkout attempt — provider will assign a new payment id via webhook. */
      providerPaymentId: null,
      status: 'PENDING',
    },
    where: { tripRequestId: data.tripRequestId },
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
export async function findPaymentByStripeIntentId(stripePaymentIntentId: string) {
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
    orderBy: { createdAt: 'desc' },
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

  // Prevent late/duplicate events from overwriting a terminal status
  const TERMINAL_STATUSES: PaymentStatus[] = ['APPROVED', 'COMPLETED', 'REFUNDED'];
  if (
    TERMINAL_STATUSES.includes(payment.status) &&
    updateData.status !== undefined &&
    !TERMINAL_STATUSES.includes(updateData.status)
  ) {
    return payment;
  }

  const existingRaw = payment.providerResponse;
  const existingObj =
    existingRaw !== null &&
    typeof existingRaw === 'object' &&
    !Array.isArray(existingRaw)
      ? (existingRaw as Record<string, unknown>)
      : {};

  const mergedProviderResponse = JSON.parse(
    JSON.stringify({ ...existingObj, ...(webhookPayload ?? {}) }),
  ) as Prisma.InputJsonValue;

  const finalData: UpdatePaymentData = {
    ...updateData,
    providerResponse: mergedProviderResponse,
    webhookData: (webhookPayload as UpdatePaymentData['webhookData']) ?? undefined,
  };

  if (finalData.status === 'APPROVED') {
    await prisma.tripRequest.update({
      where: { id: payment.tripRequestId },
      data: { status: 'CONFIRMED' },
    });
  }

  return await updatePayment(payment.id, finalData);
}
