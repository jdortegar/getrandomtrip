import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({
      select: { id: true, roles: true },
      where: { id: session.user.id },
    });
    if (!caller || !hasRoleAccess(caller, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        amount: true,
        createdAt: true,
        currency: true,
        id: true,
        provider: true,
        status: true,
        tripRequestId: true,
        user: {
          select: {
            email: true,
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('[admin/payments] GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
