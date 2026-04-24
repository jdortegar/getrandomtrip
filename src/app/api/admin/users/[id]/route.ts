import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRoleAccess } from '@/lib/auth/roleAccess';
import { buildUserRoleUpdate, parseUserRolesPayload } from '@/lib/auth/prismaUserRoles';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['CLIENT', 'TRIPPER', 'ADMIN'] as const;
type AdminRoleToken = (typeof VALID_ROLES)[number];

function isValidRoleToken(value: unknown): value is AdminRoleToken {
  return value === 'CLIENT' || value === 'TRIPPER' || value === 'ADMIN';
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

    const caller = await prisma.user.findUnique({
      select: { id: true, roles: true },
      where: { id: session.user.id },
    });

    if (!caller || !hasRoleAccess(caller, 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as { role?: unknown; roles?: unknown };
    let nextRoles: UserRole[] | null = parseUserRolesPayload(body.roles);
    if (!nextRoles && isValidRoleToken(body.role)) {
      nextRoles = [body.role];
    }

    if (!nextRoles) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!nextRoles.includes('CLIENT')) {
      return NextResponse.json({ error: 'Invalid roles' }, { status: 400 });
    }

    // Prevent admins from demoting themselves
    if (params.id === caller.id && !nextRoles.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 },
      );
    }

    const { roles } = buildUserRoleUpdate(nextRoles);

    const updated = await prisma.user.update({
      data: { roles: { set: roles } },
      select: { id: true, roles: true },
      where: { id: params.id },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[admin/users/[id]] PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
