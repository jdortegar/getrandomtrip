import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { attachPaymentsToTrips } from '@/lib/utils/trip-relations';
import {
  normalizeJourneyFilterValue,
  normalizeMaxTravelTimeKey,
  normalizeTransportId,
} from '@/lib/helpers/transport';

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
    const trips = await prisma.tripRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const paymentEntries = await Promise.all(
      trips.map(async (trip) => {
        const payment = await prisma.payment.findUnique({
          where: { tripRequestId: trip.id },
        });

        return payment ? { payment, tripId: trip.id } : null;
      }),
    );
    const paymentsByTripRequestId: Record<string, Record<string, unknown>> = {};
    for (const entry of paymentEntries) {
      if (!entry) continue;
      paymentsByTripRequestId[entry.tripId] =
        entry.payment as Record<string, unknown>;
    }
    const hydratedTrips = attachPaymentsToTrips(trips, paymentsByTripRequestId);
    console.log('Trips found:', trips.length);

    return NextResponse.json({ trips: hydratedTrips }, { status: 200 });
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
      originCountry: country,
      originCity: city,
      startDate,
      endDate,
      nights,
      pax,
      transport,
      accommodationType,
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
      originCountry: country,
      originCity: city,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      nights: nights || 1,
      pax: pax || 1,
      transport: normalizeTransportId(transport) || 'plane',
      accommodationType: normalizeJourneyFilterValue(accommodationType) || 'any',
      climate: normalizeJourneyFilterValue(climate) || 'any',
      maxTravelTime: normalizeMaxTravelTimeKey(maxTravelTime) || 'no-limit',
      departPref: normalizeJourneyFilterValue(departPref) || 'any',
      arrivePref: normalizeJourneyFilterValue(arrivePref) || 'any',
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
      trip = await prisma.tripRequest.update({
        where: { id },
        data: tripData,
      });
      console.log('Trip updated:', trip.id);
    } else {
      // Create new trip
      console.log('Creating new trip for user:', user.id);
      trip = await prisma.tripRequest.create({
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
