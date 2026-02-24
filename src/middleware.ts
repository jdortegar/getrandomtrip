import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { handleI18n } from '@/lib/i18n/middleware';
import { pathWithoutLocale } from '@/lib/i18n/pathForLocale';
import { LOCALES } from '@/lib/i18n/config';

// Variantes -> canónico (solo para path sin locale o con locale)
const CANON_MAP: Record<string, string> = {
  families: 'family',
  familia: 'family',
};

function applyCanonRedirect(req: NextRequest): NextResponse | null {
  const pathname = pathWithoutLocale(req.nextUrl.pathname);
  if (!pathname.startsWith('/packages/by-type/')) return null;

  const url = req.nextUrl.clone();
  const { search, hash } = url;
  const parts = pathname.split('/').filter(Boolean);
  // pathname can be /packages/by-type/X or /en/packages/by-type/X - pathWithoutLocale gives /packages/by-type/X
  const typeIndex = parts.indexOf('by-type') + 1;
  const type = parts[typeIndex];
  if (!type) return null;

  const target = CANON_MAP[type];
  if (!target || target === type) return null;

  parts[typeIndex] = target;
  const newPath = '/' + parts.join('/');
  // If request had locale prefix, preserve it
  const first = req.nextUrl.pathname.split('/').filter(Boolean)[0];
  const hasLocale = first && LOCALES.includes(first as 'es' | 'en');
  url.pathname = hasLocale ? `/${first}${newPath}` : newPath;
  url.search = search;
  url.hash = hash;
  return NextResponse.redirect(url, 308);
}

export function middleware(req: NextRequest) {
  const i18nResponse = handleI18n(req);
  if (i18nResponse) return i18nResponse;

  const canonResponse = applyCanonRedirect(req);
  if (canonResponse) return canonResponse;

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon\\.png|.*\\..*).*)'],
};
