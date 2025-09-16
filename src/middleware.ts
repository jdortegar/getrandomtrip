import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Variantes -> canónico
const CANON_MAP: Record<string, string> = {
  families: 'family',
  familia: 'family',
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname, search, hash } = url;

  // Sólo intervenir en /packages/by-type/...
  if (!pathname.startsWith('/packages/by-type/')) {
    return NextResponse.next();
  }

  // ["packages","by-type","<type>", ...]
  const parts = pathname.split('/').filter(Boolean);
  const type = parts[2];
  if (!type) return NextResponse.next();

  const target = CANON_MAP[type];
  if (!target || target === type) {
    return NextResponse.next();
  }

  // Reescribe solo el segmento <type>, preservando subrutas, query y hash
  parts[2] = target;
  url.pathname = '/' + parts.join('/');
  url.search = search;
  url.hash = hash;

  // 308 para redirección única y cacheable
  return NextResponse.redirect(url, 308);
}

// Limita el alcance del middleware
export const config = {
  matcher: ['/packages/by-type/:path*'],
};
