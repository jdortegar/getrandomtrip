// ============================================================================
// i18n middleware – redirect/rewrite and set cookie (for use in root middleware)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import {
  COOKIE_LOCALE,
  DEFAULT_LOCALE,
  LOCALES,
  hasLocale,
  type Locale,
} from './config';
import { pathForLocale, pathWithoutLocale } from './pathForLocale';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getLocaleFromRequest(request: NextRequest): Locale {
  const cookie = request.cookies.get(COOKIE_LOCALE)?.value;
  if (hasLocale(cookie)) return cookie;

  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const negotiator = new Negotiator({
    headers: { 'accept-language': acceptLanguage },
  } as any);
  const preferred = negotiator.languages(LOCALES as unknown as string[]);
  const first = preferred?.[0];
  if (hasLocale(first)) return first;

  return DEFAULT_LOCALE;
}

export function handleI18n(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const { pathname, search, hash } = url;
  const pathnameLower = pathname.toLowerCase();

  // Skip API, _next, static assets
  if (
    pathnameLower.startsWith('/api') ||
    pathnameLower.startsWith('/_next') ||
    pathnameLower.includes('.') // favicon, etc.
  ) {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  const hasLocalePrefix = firstSegment && LOCALES.includes(firstSegment as Locale);

  if (hasLocalePrefix) {
    const locale = firstSegment as Locale;
    const pathWithout = pathWithoutLocale(pathname);

    if (locale === DEFAULT_LOCALE) {
      // /es/... -> redirect to /... (no prefix for default)
      url.pathname = pathWithout || '/';
      const res = NextResponse.redirect(url, 308);
      res.cookies.set(COOKIE_LOCALE, locale, {
        path: '/',
        maxAge: COOKIE_MAX_AGE,
        sameSite: 'lax',
      });
      return res;
    }

    // /en/... -> continue (other locales keep prefix)
    const res = NextResponse.next();
    res.cookies.set(COOKIE_LOCALE, locale, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // No locale in path: detect and either rewrite (default) or redirect (other)
  const locale = getLocaleFromRequest(request);

  if (locale === DEFAULT_LOCALE) {
    // Rewrite to /es/... so [locale] segment is "es"
    url.pathname = `/es${pathname === '/' ? '' : pathname}`;
    const res = NextResponse.rewrite(url);
    res.cookies.set(COOKIE_LOCALE, locale, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Redirect to /en/... (or other non-default)
  url.pathname = pathForLocale(locale, pathname || '/');
  url.search = search;
  url.hash = hash;
  const res = NextResponse.redirect(url, 308);
  res.cookies.set(COOKIE_LOCALE, locale, {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
  return res;
}
