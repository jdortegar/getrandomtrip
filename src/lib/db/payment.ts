import { prisma } from '@/lib/prisma';
import type { PaymentStatus, Prisma } from '@prisma/client';
import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

export interface CreatePaymentData {
  userId: string;
  tripRequestId: string;
  provider: string;
  providerPreferenceId?: string;
  amount: number;
  currency?: string;
  mpExternalReference?: string;
  mpDescription?: string;
  mpStatementDescriptor?: string;
  expiresAt?: Date;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  statusDetail?: string;
  failureReason?: string;
  providerPaymentId?: string;
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
      providerPreferenceId: data.providerPreferenceId,
      amount: data.amount,
      currency: data.currency || 'ARS',
      mpExternalReference: data.mpExternalReference,
      mpDescription: data.mpDescription,
      mpStatementDescriptor: data.mpStatementDescriptor,
      expiresAt: data.expiresAt,
      status: 'PENDING',
    },
  });
}

/**
 * Creates or updates the single `Payment` row for a trip (unique `tripRequestId`).
 * Used when the user starts checkout again — Mercado Pago gets a new preference id each time.
 */
export async function upsertPaymentForTripCheckout(data: CreatePaymentData) {
  const currency = data.currency || 'ARS';

  return prisma.payment.upsert({
    create: {
      amount: data.amount,
      currency,
      expiresAt: data.expiresAt,
      mpDescription: data.mpDescription,
      mpExternalReference: data.mpExternalReference,
      mpStatementDescriptor: data.mpStatementDescriptor,
      provider: data.provider,
      providerPreferenceId: data.providerPreferenceId,
      status: 'PENDING',
      tripRequestId: data.tripRequestId,
      userId: data.userId,
    },
    update: {
      amount: data.amount,
      currency,
      expiresAt: data.expiresAt,
      mpDescription: data.mpDescription,
      mpExternalReference: data.mpExternalReference,
      mpStatementDescriptor: data.mpStatementDescriptor,
      providerPreferenceId: data.providerPreferenceId,
      /** New Checkout Pro attempt — MP will assign a new payment id via webhook. */
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
 * Find payment by preference ID
 */
export async function findPaymentByPreferenceId(providerPreferenceId: string) {
  return await prisma.payment.findFirst({
    where: { providerPreferenceId },
    include: {
      user: true,
      tripRequest: true,
    },
  });
}

/** Mercado Pago payment API resource (snake_case and/or camelCase). */
export type MercadoPagoPaymentResource = Record<string, unknown>;

function stringFromMp(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/**
 * Resolves our `Payment` row from a Mercado Pago **payment** API resource.
 * Order: `providerPaymentId` → `mpExternalReference` (MP `external_reference`) → `providerPreferenceId`.
 */
export async function findPaymentForMercadoPagoResource(mp: unknown) {
  const resource = mp as MercadoPagoPaymentResource;
  const mpPaymentId = stringFromMp(resource.id);
  if (mpPaymentId) {
    const byProviderId = await findPaymentByProviderId(mpPaymentId);
    if (byProviderId) return byProviderId;
  }

  const externalRef =
    stringFromMp(resource.external_reference) ??
    stringFromMp(resource.externalReference);
  if (externalRef) {
    const byTrip = await prisma.payment.findFirst({
      include: {
        tripRequest: true,
        user: true,
      },
      where: { mpExternalReference: externalRef },
    });
    if (byTrip) return byTrip;
  }

  const preferenceId =
    stringFromMp(resource.preference_id) ??
    stringFromMp(
      (resource.metadata as Record<string, unknown> | undefined)
        ?.preference_id,
    ) ??
    stringFromMp(
      (resource.metadata as Record<string, unknown> | undefined)?.preferenceId,
    );
  if (preferenceId) {
    const byPref = await findPaymentByPreferenceId(preferenceId);
    if (byPref) return byPref;
  }

  return null;
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
 * Merges Mercado Pago **browser redirect** query params into `providerResponse`
 * under `mpCheckoutReturn` (does not replace MP API payloads from webhooks).
 */
export async function mergeCheckoutReturnIntoProviderResponse(
  paymentId: string,
  checkoutReturn: MercadoPagoCheckoutReturnParams,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { providerResponse: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const raw = payment.providerResponse;
  const prev =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};

  const merged = JSON.parse(
    JSON.stringify({
      ...prev,
      mpCheckoutReturn: checkoutReturn,
      mpCheckoutReturnAt: new Date().toISOString(),
    }),
  ) as Prisma.InputJsonValue;

  return prisma.payment.update({
    where: { id: paymentId },
    data: { providerResponse: merged },
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
 * Update payment from Mercado Pago **payment** API resource (e.g. `Payment.get()` after webhook).
 * Resolves DB row even when `providerPaymentId` was not set yet (matches `external_reference` / preference).
 */
export async function updatePaymentFromWebhook(
  mercadoPagoPaymentResource: unknown,
  webhookPayload?: unknown,
) {
  const mp = mercadoPagoPaymentResource as MercadoPagoPaymentResource;

  const payment = await findPaymentForMercadoPagoResource(mp);

  if (!payment) {
    const mpId = stringFromMp(mp.id);
    throw new Error(
      `Payment not found for Mercado Pago payment id=${mpId ?? 'unknown'}`,
    );
  }

  const order = mp.order as { id?: string | number } | undefined;
  const card = mp.card as
    | {
        last_four_digits?: string;
        lastFourDigits?: string;
        cardholder?: { name?: string };
      }
    | undefined;

  // Map MercadoPago status to our PaymentStatus
  const statusMap: Record<string, PaymentStatus> = {
    approved: 'APPROVED',
    pending: 'PENDING_WAITING_PAYMENT',
    in_process: 'IN_PROCESS',
    in_mediation: 'IN_MEDIATION',
    rejected: 'REJECTED',
    cancelled: 'CANCELLED',
    refunded: 'REFUNDED',
    charged_back: 'CHARGEBACK',
  };

  const statusRaw = typeof mp.status === 'string' ? mp.status : undefined;
  const statusDetail =
    (typeof mp.status_detail === 'string' ? mp.status_detail : undefined) ??
    (typeof mp.statusDetail === 'string' ? mp.statusDetail : undefined);
  const orderId = order?.id;
  const paymentMethod =
    (typeof mp.payment_method_id === 'string' ? mp.payment_method_id : undefined) ??
    (typeof mp.paymentMethodId === 'string' ? mp.paymentMethodId : undefined);
  const last4 =
    card?.last_four_digits ?? card?.lastFourDigits;
  const cardBrand = card?.cardholder?.name;

  const existingRaw = payment.providerResponse;
  const existingObj =
    existingRaw !== null &&
    typeof existingRaw === 'object' &&
    !Array.isArray(existingRaw)
      ? (existingRaw as Record<string, unknown>)
      : {};

  const mergedPlain = {
    ...existingObj,
    ...mp,
  };

  if ('mpCheckoutReturn' in existingObj) {
    mergedPlain.mpCheckoutReturn = existingObj.mpCheckoutReturn;
  }
  if ('mpCheckoutReturnAt' in existingObj) {
    mergedPlain.mpCheckoutReturnAt = existingObj.mpCheckoutReturnAt;
  }

  const mergedProviderResponse = JSON.parse(
    JSON.stringify(mergedPlain),
  ) as Prisma.InputJsonValue;

  const mpPaymentIdForRow = stringFromMp(mp.id);

  const updateData: UpdatePaymentData = {
    cardBrand,
    cardLast4: last4,
    paidAt: statusRaw === 'approved' ? new Date() : undefined,
    paymentMethod,
    providerMerchantOrderId:
      orderId !== undefined && orderId !== null
        ? String(orderId)
        : undefined,
    providerPaymentId: mpPaymentIdForRow ?? payment.providerPaymentId ?? undefined,
    providerResponse: mergedProviderResponse,
    status: statusRaw ? statusMap[statusRaw] || 'PENDING' : 'PENDING',
    statusDetail,
    webhookData:
      (webhookPayload as MercadoPagoPaymentResource | undefined) ?? mp,
  };

  // Update trip status based on payment status
  if (updateData.status === 'APPROVED') {
    await prisma.tripRequest.update({
      where: { id: payment.tripRequestId },
      data: { status: 'CONFIRMED' },
    });
  }

  return await updatePayment(payment.id, updateData);
}
