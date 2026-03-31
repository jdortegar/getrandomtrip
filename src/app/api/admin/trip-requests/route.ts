import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || !hasRoleAccess(user.role, 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    const tripRequests = await prisma.tripRequest.findMany({
      include: {
        package: {
          select: {
            excuseKey: true,
            id: true,
            level: true,
            title: true,
            type: true,
          },
        },
        payment: {
          select: {
            amount: true,
            currency: true,
            status: true,
          },
        },
        user: {
          select: {
            email: true,
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tripRequests });
  } catch (error) {
    console.error('Error fetching admin trip requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
