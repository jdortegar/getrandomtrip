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

    const body = (await request.json()) as { isApproved?: unknown; isPublic?: unknown };
    const data: { isApproved?: boolean; isPublic?: boolean } = {};
    if (typeof body.isApproved === 'boolean') data.isApproved = body.isApproved;
    if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic;
    if (!('isApproved' in data) && !('isPublic' in data)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const review = await prisma.review.update({
      data,
      select: {
        id: true,
        isApproved: true,
        isPublic: true,
      },
      where: { id: params.id },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('[admin/reviews/[id]] PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
