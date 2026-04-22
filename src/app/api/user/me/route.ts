import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UserProfileAddress } from '@/lib/types/UserProfileAddress';
import type { UserProfileMe } from '@/lib/types/UserProfileMe';

function toAddress(val: unknown): UserProfileAddress | null {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return null;
  }
  const o = val as Record<string, unknown>;
  const street = typeof o.street === 'string' ? o.street : '';
  const city = typeof o.city === 'string' ? o.city : '';
  const state = typeof o.state === 'string' ? o.state : '';
  const zipCode = typeof o.zipCode === 'string' ? o.zipCode : '';
  const country = typeof o.country === 'string' ? o.country : '';
  const idDocument =
    typeof o.idDocument === 'string' && o.idDocument.trim()
      ? o.idDocument.trim()
      : undefined;
  const hasAny = street || city || state || zipCode || country || idDocument;
  if (!hasAny) return null;
  return {
    city,
    country,
    ...(idDocument ? { idDocument } : {}),
    state,
    street,
    zipCode,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const u = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        travelerType: true,
        interests: true,
        dislikes: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!u) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user: UserProfileMe = {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: toAddress(u.address),
      createdAt: u.createdAt.toISOString(),
      travelerType: u.travelerType,
      interests: u.interests,
      dislikes: u.dislikes,
      role: u.role,
      avatarUrl: u.avatarUrl,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 },
    );
  }
}
