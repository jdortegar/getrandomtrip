import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const body = (await request.json()) as {
      isActive?: unknown;
      isFeatured?: unknown;
    };
    const data: { isActive?: boolean; isFeatured?: boolean } = {};
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (typeof body.isFeatured === 'boolean') data.isFeatured = body.isFeatured;
    if (!('isActive' in data) && !('isFeatured' in data)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const experience = await prisma.package.update({
      data,
      select: {
        id: true,
        isActive: true,
        isFeatured: true,
        updatedAt: true,
      },
      where: { id: params.id },
    });

    return NextResponse.json({ experience });
  } catch (error) {
    console.error('[admin/experiences/[id]] PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
