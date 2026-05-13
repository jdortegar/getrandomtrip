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

const BENEFIT_SELECT = {
  id: true,
  type: true,
  sortOrder: true,
  name: true,
  providerName: true,
  address: true,
  city: true,
  state: true,
  googleMapsUrl: true,
  customerVisibleNotes: true,
  internalNotes: true,
  confirmationStatus: true,
  reservationCode: true,
} as const;

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id: experienceId } = await props.params;
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const type = body.type as string | undefined;
    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    const maxOrder = await prisma.xsedComponent.aggregate({
      _max: { sortOrder: true },
      where: { experienceId },
    });

    const benefit = await prisma.xsedComponent.create({
      data: {
        experienceId,
        type: type as never,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        name: (body.name as string) || null,
        providerName: (body.providerName as string) || null,
        address: (body.address as string) || null,
        city: (body.city as string) || null,
        state: (body.state as string) || null,
        googleMapsUrl: (body.googleMapsUrl as string) || null,
        customerVisibleNotes: (body.customerVisibleNotes as string) || null,
        internalNotes: (body.internalNotes as string) || null,
        reservationCode: (body.reservationCode as string) || null,
      },
      select: BENEFIT_SELECT,
    });

    return NextResponse.json({ benefit });
  } catch (error) {
    console.error('[admin/xsed/[id]/benefits] POST', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
