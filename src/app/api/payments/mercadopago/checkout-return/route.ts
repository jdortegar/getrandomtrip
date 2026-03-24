import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mergeCheckoutReturnIntoProviderResponse } from '@/lib/db/payment';
import { prisma } from '@/lib/prisma';
import type { MercadoPagoCheckoutReturnParams } from '@/lib/types/MercadoPagoCheckoutReturnParams';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      checkoutReturn?: MercadoPagoCheckoutReturnParams;
    };

    const checkoutReturn = body.checkoutReturn;
    const externalReference = checkoutReturn?.externalReference?.trim();

    if (!checkoutReturn || !externalReference) {
      return NextResponse.json(
        { error: 'Missing checkoutReturn with externalReference' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        mpExternalReference: externalReference,
        userId: user.id,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await mergeCheckoutReturnIntoProviderResponse(payment.id, checkoutReturn);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('checkout-return persist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
