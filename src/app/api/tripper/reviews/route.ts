// ============================================================================
// GET /api/tripper/reviews - Get tripper reviews and NPS metrics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTripperReviews } from '@/lib/db/tripper-queries';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they are a tripper
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'TRIPPER') {
      return NextResponse.json(
        { error: 'Forbidden - Tripper access only' },
        { status: 403 },
      );
    }

    const reviews = await getTripperReviews(user.id);

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching tripper reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
