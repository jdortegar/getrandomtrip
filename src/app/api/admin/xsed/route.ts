import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const caller = await prisma.user.findUnique({
    select: { id: true, roles: true },
    where: { id: session.user.id },
  });
  return caller && hasRoleAccess(caller, 'admin') ? caller : null;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const experiences = await prisma.xsedExperience.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        accessibilityNotes: true,
        adminNotes: true,
        cancellationPolicy: true,
        costEstimateTotal: true,
        createdAt: true,
        currency: true,
        destinationCity: true,
        destinationState: true,
        distanceKmFromOrigin: true,
        generalConditions: true,
        heroImage: true,
        id: true,
        included: true,
        maxSpots: true,
        minSpots: true,
        notIncluded: true,
        originCity: true,
        originCountry: true,
        packingHints: true,
        preRevealCopy: true,
        pricePerPerson: true,
        revealAt: true,
        revealCopy: true,
        safetyNotes: true,
        slug: true,
        status: true,
        supplierNotes: true,
        targetMarginPercent: true,
        titleInternal: true,
        titlePublicTeaser: true,
        tripDate: true,
        updatedAt: true,
        weatherPolicy: true,
        whatsappMessageTemplate: true,
        _count: {
          select: {
            tripRequests: {
              where: {
                status: { in: ['CONFIRMED', 'REVEALED', 'COMPLETED'] },
              },
            },
          },
        },
      },
    });

    const data = experiences.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      revealAt: e.revealAt?.toISOString() ?? null,
      soldCount: e._count.tripRequests,
      tripDate: e.tripDate?.toISOString() ?? null,
      updatedAt: e.updatedAt.toISOString(),
    }));

    return NextResponse.json({ experiences: data });
  } catch (error) {
    console.error('[admin/xsed] GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
