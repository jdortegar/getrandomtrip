import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/trip-requests - Get all trip requests for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/trip-requests called');
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

    // Get all trip requests for this user
    console.log('Fetching trip requests for userId:', user.id);
    const tripRequests = await prisma.tripRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        payment: true,
        package: true,
      },
    });
    console.log('Trip requests found:', tripRequests.length);

    return NextResponse.json({ tripRequests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trip requests:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}

// POST /api/trip-requests - Create or update a trip request
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
    console.log('Trip request data received:', body);
    const {
      id, // If provided, update existing trip request
      from,
      type,
      level,
      originCountry,
      originCity,
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
      status,
    } = body;

    // Validate required fields
    if (!type || !level || !originCountry || !originCity) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: type, level, originCountry, originCity',
        },
        { status: 400 },
      );
    }

    // Create or update trip request
    const tripRequestData = {
      userId: user.id,
      from: from || 'admin',
      type,
      level,
      originCountry,
      originCity,
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
      status: status || 'DRAFT',
    };

    let tripRequest;
    if (id) {
      // Update existing trip request
      console.log('Updating trip request:', id);
      tripRequest = await prisma.tripRequest.update({
        where: { id },
        data: tripRequestData,
      });
      console.log('Trip request updated:', tripRequest.id);
    } else {
      // Create new trip request
      console.log('Creating new trip request for user:', user.id);
      tripRequest = await prisma.tripRequest.create({
        data: tripRequestData,
      });
      console.log('Trip request created:', tripRequest.id);
    }

    return NextResponse.json({ tripRequest }, { status: id ? 200 : 201 });
  } catch (error) {
    console.error('Error saving trip request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
