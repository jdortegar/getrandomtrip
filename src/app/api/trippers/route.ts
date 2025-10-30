import { NextResponse } from 'next/server';
import { getAllTrippers } from '@/lib/db/tripper-queries';

export async function GET() {
  try {
    const trippers = await getAllTrippers();
    return NextResponse.json(trippers);
  } catch (error) {
    console.error('Error fetching trippers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trippers' },
      { status: 500 },
    );
  }
}
