import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/trips/[id] - Get a specific trip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get trip
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        payment: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify ownership
    if (trip.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ trip }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get trip
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify ownership
    if (trip.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete trip
    await prisma.trip.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Trip deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
