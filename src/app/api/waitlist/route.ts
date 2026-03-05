import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;

function validateBody(body: unknown): { email: string; name: string | null; lastName: string | null } | null {
  if (!body || typeof body !== 'object' || !('email' in body) || typeof (body as { email?: unknown }).email !== 'string') {
    return null;
  }
  const { email, name, lastName } = body as { email: string; name?: unknown; lastName?: unknown };
  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) return null;
  const normalizedName = typeof name === 'string' ? name.trim() || null : null;
  const normalizedLastName = typeof lastName === 'string' ? lastName.trim() || null : null;
  if (normalizedName !== null && normalizedName.length > MAX_NAME_LENGTH) return null;
  if (normalizedLastName !== null && normalizedLastName.length > MAX_NAME_LENGTH) return null;
  return { email: trimmedEmail, name: normalizedName, lastName: normalizedLastName };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateBody(body);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { email, name, lastName } = parsed;

    await prisma.waitlistEntry.upsert({
      create: { email, lastName, name },
      update: { lastName, name },
      where: { email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return NextResponse.json({ error: 'Could not join waitlist' }, { status: 500 });
  }
}
