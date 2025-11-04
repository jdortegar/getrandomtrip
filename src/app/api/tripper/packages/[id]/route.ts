// ============================================================================
// GET /api/tripper/packages/[id] - Get a single package by ID for tripper
// PATCH /api/tripper/packages/[id] - Update a package by ID for tripper
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const packageId = params.id;

    // Fetch the package and verify ownership
    const packageData = await prisma.package.findFirst({
      where: {
        id: packageId,
        ownerId: user.id,
      },
      select: {
        id: true,
        title: true,
        teaser: true,
        description: true,
        type: true,
        level: true,
        status: true,
        destinationCountry: true,
        destinationCity: true,
        minNights: true,
        maxNights: true,
        minPax: true,
        maxPax: true,
        basePriceUsd: true,
        displayPrice: true,
        heroImage: true,
        tags: true,
        highlights: true,
        excuseKey: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found or access denied' },
        { status: 404 },
      );
    }

    return NextResponse.json({ package: packageData });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const packageId = params.id;

    // Verify package exists and belongs to user
    const existingPackage = await prisma.package.findFirst({
      where: {
        id: packageId,
        ownerId: user.id,
      },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found or access denied' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      type,
      level,
      title,
      teaser,
      description,
      heroImage,
      tags,
      highlights,
      destinationCountry,
      destinationCity,
      excuseKey,
      minNights,
      maxNights,
      minPax,
      maxPax,
      basePriceUsd,
      displayPrice,
      isActive,
      isFeatured,
      status,
      hotels,
      activities,
      itinerary,
      inclusions,
      exclusions,
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

    // Update package
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        type,
        level,
        title,
        teaser: teaser ?? '',
        description: description ?? '',
        heroImage: heroImage ?? '',
        tags: tags ?? [],
        highlights: highlights ?? [],
        destinationCountry,
        destinationCity,
        excuseKey: excuseKey || null,
        minNights: minNights ?? 1,
        maxNights: maxNights ?? 7,
        minPax: minPax ?? 1,
        maxPax: maxPax ?? 8,
        basePriceUsd: basePriceUsd ?? 0,
        displayPrice: displayPrice ?? '',
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        ...(status && { status }),
        ...(hotels !== undefined && { hotels }),
        ...(activities !== undefined && { activities }),
        ...(itinerary !== undefined && { itinerary }),
        ...(inclusions !== undefined && { inclusions }),
        ...(exclusions !== undefined && { exclusions }),
      },
    });

    return NextResponse.json({ package: updatedPackage });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

