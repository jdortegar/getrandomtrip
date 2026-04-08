import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADDRESS_MERGE_KEYS = [
  'city',
  'country',
  'idDocument',
  'state',
  'street',
  'zipCode',
] as const;

function recordFromAddressJson(val: unknown): Record<string, string> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  const o = val as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ADDRESS_MERGE_KEYS) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim();
  }
  return out;
}

/** Merge PATCH `address` onto existing JSON so omitted keys (e.g. idDocument) are preserved. */
function mergeAddressPatch(
  existingJson: unknown,
  incoming: unknown,
): Prisma.InputJsonValue | null | undefined {
  if (incoming === undefined) return undefined;
  if (incoming === null) return null;
  if (typeof incoming !== 'object' || Array.isArray(incoming)) return undefined;

  const base = recordFromAddressJson(existingJson);
  const inc = incoming as Record<string, unknown>;

  for (const key of ADDRESS_MERGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(inc, key)) continue;
    const v = inc[key];
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (t) base[key] = t;
    else delete base[key];
  }

  return Object.keys(base).length > 0 ? base : null;
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

    if (address !== undefined) {
      const existing = await prisma.user.findUnique({
        select: { address: true },
        where: { email: session.user.email },
      });
      const merged = mergeAddressPatch(existing?.address ?? null, address);
      if (merged !== undefined) {
        data.address = merged === null ? Prisma.DbNull : merged;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      data,
      where: { email: session.user.email },
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
