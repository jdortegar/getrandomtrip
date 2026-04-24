import { TripRequestStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { attachAdminTripRequestRelations } from '@/lib/admin/trip-requests';
import { prisma } from '@/lib/prisma';

function parseStatus(status: unknown): TripRequestStatus | null {
  if (typeof status !== 'string') return null;
  const normalized = status.toUpperCase();
  if (Object.values(TripRequestStatus).includes(normalized as TripRequestStatus)) {
    return normalized as TripRequestStatus;
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const nextStatus = parseStatus(body?.status);
    const actualDestination =
      typeof body?.actualDestination === 'string' ? body.actualDestination.trim() : undefined;

    if (!nextStatus && actualDestination === undefined) {
      return NextResponse.json(
        { error: 'Nothing to update. Provide status or actualDestination.' },
        { status: 400 },
      );
    }

    const data: {
      actualDestination?: string | null;
      completedAt?: Date | null;
      destinationRevealedAt?: Date | null;
      status?: TripRequestStatus;
    } = {};

    if (nextStatus) {
      data.status = nextStatus;
      if (nextStatus === 'COMPLETED') {
        data.completedAt = new Date();
      }
      if (nextStatus === 'REVEALED') {
        data.destinationRevealedAt = new Date();
      }
    }

    if (actualDestination !== undefined) {
      data.actualDestination = actualDestination || null;
      if (actualDestination && !data.destinationRevealedAt) {
        data.destinationRevealedAt = new Date();
      }
    }

    const tripRequest = await prisma.tripRequest.update({
      where: { id: params.id },
      data,
    });

    const [pkg, payment, tripUser] = await Promise.all([
      tripRequest.packageId
        ? prisma.package.findUnique({
            select: {
              excuseKey: true,
              id: true,
              level: true,
              title: true,
              type: true,
            },
            where: { id: tripRequest.packageId },
          })
        : Promise.resolve(null),
      prisma.payment.findUnique({
        select: {
          amount: true,
          currency: true,
          status: true,
          tripRequestId: true,
        },
        where: { tripRequestId: tripRequest.id },
      }),
      prisma.user.findUnique({
        select: {
          email: true,
          id: true,
          name: true,
        },
        where: { id: tripRequest.userId },
      }),
    ]);

    const [hydratedTripRequest] = attachAdminTripRequestRelations(
      [tripRequest],
      tripUser ? { [tripUser.id]: tripUser } : {},
      pkg ? { [pkg.id]: pkg } : {},
      payment
        ? {
            [payment.tripRequestId]: {
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
            },
          }
        : {},
    );

    return NextResponse.json({ tripRequest: hydratedTripRequest });
  } catch (error) {
    console.error('Error updating admin trip request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    await prisma.tripRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting admin trip request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
