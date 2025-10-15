import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { travelerType, interests, dislikes } = await request.json();

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        travelerType: travelerType || undefined,
        interests: interests || undefined,
        dislikes: dislikes || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        travelerType: updatedUser.travelerType,
        interests: updatedUser.interests,
        dislikes: updatedUser.dislikes,
      },
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 },
    );
  }
}
