import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (url.pathname === '/packages/by-type/family') {
    url.pathname = '/packages/by-type/families';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/packages/by-type/family'],
};
