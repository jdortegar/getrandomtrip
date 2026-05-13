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

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Whitelist updatable fields
    const allowed = [
      'slug', 'status', 'titleInternal', 'titlePublicTeaser', 'heroImage',
      'destinationCity', 'destinationState', 'originCity', 'originCountry',
      'distanceKmFromOrigin', 'tripDate', 'revealAt', 'pricePerPerson',
      'currency', 'maxSpots', 'minSpots', 'costEstimateTotal',
      'targetMarginPercent', 'included', 'notIncluded', 'generalConditions',
      'cancellationPolicy', 'weatherPolicy', 'accessibilityNotes', 'safetyNotes',
      'revealCopy', 'preRevealCopy', 'packingHints', 'whatsappMessageTemplate',
      'adminNotes', 'supplierNotes',
    ] as const;

    const data = Object.fromEntries(
      allowed.filter((k) => k in body).map((k) => [k, body[k]]),
    );

    const updated = await prisma.xsedExperience.update({
      data,
      select: { id: true, status: true, updatedAt: true },
      where: { id },
    });

    return NextResponse.json({ experience: updated });
  } catch (error) {
    console.error('[admin/xsed/[id]] PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.xsedExperience.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/xsed/[id]] DELETE', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
