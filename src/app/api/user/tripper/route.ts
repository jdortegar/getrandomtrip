import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bio,
      heroImage,
      location,
      tierLevel,
      destinations,
      tripperSlug,
      commission,
      availableTypes,
    } = body;

    // Validate required fields for trippers
    if (!tripperSlug || !commission || !availableTypes?.length) {
      return NextResponse.json(
        { error: 'Missing required tripper fields' },
        { status: 400 },
      );
    }

    // Check if tripperSlug is already taken by another user
    const existingTripper = await prisma.user.findFirst({
      where: {
        tripperSlug,
        id: { not: session.user.id },
      },
    });

    if (existingTripper) {
      return NextResponse.json(
        { error: 'Tripper slug already taken' },
        { status: 400 },
      );
    }

    // Update user with tripper data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio,
        heroImage,
        location,
        tierLevel,
        destinations,
        tripperSlug,
        commission,
        availableTypes,
        role: 'TRIPPER', // Ensure role is set to TRIPPER
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        bio: true,
        heroImage: true,
        location: true,
        tierLevel: true,
        destinations: true,
        tripperSlug: true,
        commission: true,
        availableTypes: true,
        interests: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating tripper profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
