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

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (!body.titleInternal || typeof body.titleInternal !== 'string') {
      return NextResponse.json({ error: 'titleInternal is required' }, { status: 400 });
    }

    const experience = await prisma.xsedExperience.create({
      data: {
        titleInternal: body.titleInternal as string,
        slug: (body.slug as string | undefined) || null,
        status: (body.status as string | undefined) === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
        titlePublicTeaser: (body.titlePublicTeaser as string | undefined) || null,
        heroImage: (body.heroImage as string | undefined) || null,
        destinationCity: (body.destinationCity as string | undefined) || null,
        destinationState: (body.destinationState as string | undefined) || null,
        originCity: (body.originCity as string | undefined) || null,
        originCountry: (body.originCountry as string | undefined) || null,
        distanceKmFromOrigin: body.distanceKmFromOrigin != null ? Number(body.distanceKmFromOrigin) : null,
        tripDate: body.tripDate ? new Date(body.tripDate as string) : null,
        revealAt: body.revealAt ? new Date(body.revealAt as string) : null,
        pricePerPerson: body.pricePerPerson != null ? Number(body.pricePerPerson) : null,
        currency: (body.currency as string | undefined) || 'USD',
        maxSpots: body.maxSpots != null ? Number(body.maxSpots) : null,
        minSpots: body.minSpots != null ? Number(body.minSpots) : null,
        costEstimateTotal: body.costEstimateTotal != null ? Number(body.costEstimateTotal) : null,
        targetMarginPercent: body.targetMarginPercent != null ? Number(body.targetMarginPercent) : null,
        included: (body.included as string | undefined) || null,
        notIncluded: (body.notIncluded as string | undefined) || null,
        generalConditions: (body.generalConditions as string | undefined) || null,
        cancellationPolicy: (body.cancellationPolicy as string | undefined) || null,
        weatherPolicy: (body.weatherPolicy as string | undefined) || null,
        accessibilityNotes: (body.accessibilityNotes as string | undefined) || null,
        safetyNotes: (body.safetyNotes as string | undefined) || null,
        revealCopy: (body.revealCopy as string | undefined) || null,
        preRevealCopy: (body.preRevealCopy as string | undefined) || null,
        packingHints: (body.packingHints as string | undefined) || null,
        whatsappMessageTemplate: (body.whatsappMessageTemplate as string | undefined) || null,
        adminNotes: (body.adminNotes as string | undefined) || null,
        supplierNotes: (body.supplierNotes as string | undefined) || null,
        createdById: admin.id,
        updatedById: admin.id,
      },
      select: { id: true },
    });

    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    console.error('[admin/xsed] POST', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
