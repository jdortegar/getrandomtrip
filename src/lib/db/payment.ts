import { prisma } from '@/lib/prisma';
import type { PaymentStatus } from '@prisma/client';

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
 * Update payment from MercadoPago webhook
 */
export async function updatePaymentFromWebhook(
  providerPaymentId: string,
  webhookData: any,
) {
  const payment = await findPaymentByProviderId(providerPaymentId);

  if (!payment) {
    throw new Error(`Payment not found for provider ID: ${providerPaymentId}`);
  }

  const mpPayment = webhookData;

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

  const updateData: UpdatePaymentData = {
    status: statusMap[mpPayment.status] || 'PENDING',
    statusDetail: mpPayment.status_detail,
    providerMerchantOrderId: mpPayment.order?.id?.toString(),
    paymentMethod: mpPayment.payment_method_id,
    cardLast4: mpPayment.card?.last_four_digits,
    cardBrand: mpPayment.card?.cardholder?.name,
    paidAt: mpPayment.status === 'approved' ? new Date() : undefined,
    providerResponse: mpPayment,
    webhookData,
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
