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
  photos: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, altText: true, sortOrder: true },
  },
} as const;

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string; benefitId: string }> },
) {
  const { benefitId } = await props.params;
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    const allowed = [
      'type', 'sortOrder', 'name', 'providerName', 'address', 'city', 'state',
      'googleMapsUrl', 'customerVisibleNotes', 'internalNotes',
      'confirmationStatus', 'reservationCode',
    ] as const;

    const data = Object.fromEntries(
      allowed.filter((k) => k in body).map((k) => [k, body[k] === '' ? null : body[k]]),
    );

    const benefit = await prisma.xsedComponent.update({
      data,
      select: BENEFIT_SELECT,
      where: { id: benefitId },
    });

    return NextResponse.json({ benefit });
  } catch (error) {
    console.error('[admin/xsed/[id]/benefits/[benefitId]] PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string; benefitId: string }> },
) {
  const { benefitId } = await props.params;
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.xsedComponent.delete({ where: { id: benefitId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/xsed/[id]/benefits/[benefitId]] DELETE', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
