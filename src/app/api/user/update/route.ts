import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADDRESS_KEYS = ['city', 'country', 'state', 'street', 'zipCode'] as const;

function normalizeStructuredAddress(raw: unknown): Prisma.InputJsonValue | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ADDRESS_KEYS) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim();
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { address, email, name, phone } = body as {
      address?: unknown;
      email?: string;
      name?: string;
      phone?: string | null;
    };

    const data: Prisma.UserUpdateInput = {};

    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      data.name = trimmed;
    }

    if (typeof email === 'string' && email.trim()) {
      data.email = email.trim();
    }

    if (phone !== undefined) {
      data.phone =
        typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    }

    const addr = normalizeStructuredAddress(address);
    if (addr !== undefined) {
      data.address = addr === null ? Prisma.DbNull : addr;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data,
    });

    return NextResponse.json({
      success: true,
      user: {
        address: updatedUser.address,
        email: updatedUser.email,
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}
