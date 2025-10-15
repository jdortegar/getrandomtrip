import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/trips - Get all trips for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/trips called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user?.email) {
      console.log('No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    console.log('Finding user by email:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log('User found:', user);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all trips for this user
    console.log('Fetching trips for userId:', user.id);
    const trips = await prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        payment: true,
      },
    });
    console.log('Trips found:', trips.length);

    return NextResponse.json({ trips }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trips:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// POST /api/trips - Create or update a trip
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    console.log('Finding user by email:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error('User not found:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.id);
    const body = await request.json();
    console.log('Trip data received:', body);
    const {
      id, // If provided, update existing trip
      from,
      type,
      level,
      country,
      city,
      startDate,
      endDate,
      nights,
      pax,
      transport,
      climate,
      maxTravelTime,
      departPref,
      arrivePref,
      avoidDestinations,
      addons,
      basePriceUsd,
      displayPrice,
      filtersCostUsd,
      addonsCostUsd,
      totalPerPaxUsd,
      totalTripUsd,
      status,
    } = body;

    // Validate required fields
    if (!type || !level || !country || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: type, level, country, city' },
        { status: 400 },
      );
    }

    // Create or update trip
    const tripData = {
      userId: user.id,
      from: from || '',
      type,
      level,
      country,
      city,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      nights: nights || 1,
      pax: pax || 1,
      transport: transport || 'avion',
      climate: climate || 'indistinto',
      maxTravelTime: maxTravelTime || 'sin-limite',
      departPref: departPref || 'indistinto',
      arrivePref: arrivePref || 'indistinto',
      avoidDestinations: avoidDestinations || [],
      addons: addons || [],
      basePriceUsd: basePriceUsd || 0,
      displayPrice: displayPrice || '',
      filtersCostUsd: filtersCostUsd || 0,
      addonsCostUsd: addonsCostUsd || 0,
      totalPerPaxUsd: totalPerPaxUsd || 0,
      totalTripUsd: totalTripUsd || 0,
      status: status || 'SAVED',
    };

    let trip;
    if (id) {
      // Update existing trip
      console.log('Updating trip:', id);
      trip = await prisma.trip.update({
        where: { id },
        data: tripData,
      });
      console.log('Trip updated:', trip.id);
    } else {
      // Create new trip
      console.log('Creating new trip for user:', user.id);
      trip = await prisma.trip.create({
        data: tripData,
      });
      console.log('Trip created:', trip.id);
    }

    return NextResponse.json({ trip }, { status: id ? 200 : 201 });
  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
