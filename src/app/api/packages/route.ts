import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/packages - Get all packages for a tripper
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripperId = searchParams.get('tripperId');
    const type = searchParams.get('type');
    const level = searchParams.get('level');

    if (!tripperId) {
      return NextResponse.json(
        { error: 'tripperId is required' },
        { status: 400 },
      );
    }

    // Build where clause
    const where: any = {
      ownerId: tripperId,
      isActive: true,
    };

    if (type) where.type = type;
    if (level) where.level = level;

    const packages = await prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            tripperSlug: true,
          },
        },
      },
    });

    return NextResponse.json({ packages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST /api/packages - Create a new package (tripper only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    // Check if user is a tripper
    if (user.role !== 'TRIPPER') {
      return NextResponse.json(
        { error: 'Only trippers can create packages' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      type,
      level,
      minNights,
      maxNights,
      minPax,
      maxPax,
      title,
      teaser,
      description,
      heroImage,
      tags,
      highlights,
      destinationCountry,
      destinationCity,
      hotels,
      activities,
      itinerary,
      inclusions,
      exclusions,
      basePriceUsd,
      displayPrice,
    } = body;

    // Validate required fields
    if (!type || !level || !title || !destinationCountry || !destinationCity) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: type, level, title, destinationCountry, destinationCity',
        },
        { status: 400 },
      );
    }

    const packageData = {
      ownerId: user.id,
      type,
      level,
      minNights: minNights || 1,
      maxNights: maxNights || 7,
      minPax: minPax || 1,
      maxPax: maxPax || 8,
      title,
      teaser: teaser || '',
      description: description || '',
      heroImage: heroImage || '',
      tags: tags || [],
      highlights: highlights || [],
      destinationCountry,
      destinationCity,
      hotels: hotels || null,
      activities: activities || null,
      itinerary: itinerary || null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      basePriceUsd: basePriceUsd || 0,
      displayPrice: displayPrice || '',
      status: 'DRAFT' as const,
    };

    const newPackage = await prisma.package.create({
      data: packageData,
    });

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
