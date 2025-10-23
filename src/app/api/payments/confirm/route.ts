import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updatePaymentFromWebhook } from '@/lib/db/payment';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log('Payment confirmation request:', {
      session: session?.user?.email,
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, externalReference, merchantOrderId, status } =
      await request.json();

    console.log('Payment confirmation data:', {
      paymentId,
      externalReference,
      merchantOrderId,
      status,
    });

    if (!paymentId || !externalReference) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    console.log('User found:', { userId: user?.id, email: user?.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the payment by external reference (trip ID)
    const payment = await prisma.payment.findFirst({
      where: {
        mpExternalReference: externalReference,
        userId: user.id,
      },
      include: {
        trip: true,
      },
    });

    console.log('Payment found:', {
      paymentId: payment?.id,
      tripId: payment?.tripId,
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    const updateData = {
      status: status === 'approved' ? 'APPROVED' : 'PENDING',
      providerPaymentId: paymentId,
      providerMerchantOrderId: merchantOrderId,
      paidAt: status === 'approved' ? new Date() : undefined,
    };

    await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // Update trip status if payment is approved
    if (status === 'approved') {
      await prisma.trip.update({
        where: { id: payment.tripId },
        data: { status: 'CONFIRMED' },
      });
    }

    console.log('Payment confirmed:', {
      paymentId,
      externalReference,
      status,
      tripId: payment.tripId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
