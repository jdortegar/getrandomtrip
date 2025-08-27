
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  console.log('Booking request received:', body);

  // Simulate a successful booking creation
  const bookingId = crypto.randomUUID();

  return NextResponse.json({ id: bookingId }, { status: 201 });
}
