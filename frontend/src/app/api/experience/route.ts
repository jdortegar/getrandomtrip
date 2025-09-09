import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Experience API endpoint' });
}

export async function POST(request: Request) {
  return NextResponse.json({ message: 'Experience API endpoint' });
}
