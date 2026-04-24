import { NextResponse } from 'next/server';
import { getAllTrippers } from '@/lib/db/tripper-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const trippers = await getAllTrippers();
    return NextResponse.json(trippers);
  } catch (error) {
    const prismaCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : null;

    // During build or temporary DB outages, return an empty list instead of noisy failures.
    if (prismaCode === 'P1001') {
      return NextResponse.json([]);
    }

    console.error('Error fetching trippers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trippers' },
      { status: 500 },
    );
  }
}
