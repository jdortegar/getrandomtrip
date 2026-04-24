import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { attachAdminTripRequestRelations } from '@/lib/admin/trip-requests';
import type {
  AdminTripPackage,
  AdminTripPayment,
  AdminTripUser,
} from '@/lib/admin/types';
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
      select: { id: true, roles: true },
    });

    if (!user || !hasRoleAccess(user, 'admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 });
    }

    const tripRequests = await prisma.tripRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const packageIds = Array.from(
      new Set(
        tripRequests.flatMap((tripRequest) =>
          tripRequest.packageId ? [tripRequest.packageId] : [],
        ),
      ),
    );
    const userIds = Array.from(
      new Set(tripRequests.map((tripRequest) => tripRequest.userId)),
    );

    const [packageEntries, paymentEntries, userEntries] = await Promise.all([
      Promise.all(
        packageIds.map(async (packageId) => {
          const pkg = await prisma.package.findUnique({
            select: {
              excuseKey: true,
              id: true,
              level: true,
              title: true,
              type: true,
            },
            where: { id: packageId },
          });

          return pkg ? { packageId, pkg } : null;
        }),
      ),
      Promise.all(
        tripRequests.map(async (tripRequest) => {
          const payment = await prisma.payment.findUnique({
            select: {
              amount: true,
              currency: true,
              status: true,
            },
            where: { tripRequestId: tripRequest.id },
          });

          return payment ? { payment, tripRequestId: tripRequest.id } : null;
        }),
      ),
      Promise.all(
        userIds.map(async (userId) => {
          const adminUser = await prisma.user.findUnique({
            select: {
              email: true,
              id: true,
              name: true,
            },
            where: { id: userId },
          });

          return adminUser ? { adminUser, userId } : null;
        }),
      ),
    ]);

    const packagesById: Record<string, AdminTripPackage> = {};
    for (const entry of packageEntries) {
      if (!entry) continue;
      packagesById[entry.packageId] = entry.pkg;
    }

    const paymentsByTripRequestId: Record<string, AdminTripPayment> = {};
    for (const entry of paymentEntries) {
      if (!entry) continue;
      paymentsByTripRequestId[entry.tripRequestId] = entry.payment;
    }

    const usersById: Record<string, AdminTripUser> = {};
    for (const entry of userEntries) {
      if (!entry) continue;
      usersById[entry.userId] = entry.adminUser;
    }
    const hydratedTripRequests = attachAdminTripRequestRelations(
      tripRequests,
      usersById,
      packagesById,
      paymentsByTripRequestId,
    );

    return NextResponse.json({ tripRequests: hydratedTripRequests });
  } catch (error) {
    console.error('Error fetching admin trip requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
