// ============================================================================
// i18n middleware – redirect/rewrite and set cookie (for use in root middleware)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { COOKIE_LOCALE, DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
import { pathWithoutLocale } from "./pathForLocale";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function requestHeaders(request: NextRequest, locale: Locale): Headers {
  const headers = new Headers(request.headers);
  // Overwrite inbound values; metadata must describe the actual requested URL.
  headers.set("x-locale", locale);
  headers.set("x-pathname", request.nextUrl.pathname);
  return headers;
}

export function handleI18n(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const pathnameLower = pathname.toLowerCase();

  // Skip API, _next, static assets
  if (
    pathnameLower.startsWith("/api") ||
    pathnameLower.startsWith("/_next") ||
    pathnameLower.includes(".") // favicon, etc.
  ) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocalePrefix =
    firstSegment && LOCALES.includes(firstSegment as Locale);

  if (hasLocalePrefix) {
    const locale = firstSegment as Locale;
    const pathWithout = pathWithoutLocale(pathname);

    if (locale === DEFAULT_LOCALE) {
      // /es/... -> redirect to /... (no prefix for default)
      url.pathname = pathWithout || "/";
      const res = NextResponse.redirect(url, 308);
      res.cookies.set(COOKIE_LOCALE, locale, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
      });
      return res;
    }

    // /en/... -> continue (other locales keep prefix)
    const res = NextResponse.next({
      request: { headers: requestHeaders(request, locale) },
    });
    res.cookies.set(COOKIE_LOCALE, locale, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
    return res;
  }

  // URL, not a previous language cookie, determines canonical content.
  const locale = DEFAULT_LOCALE;

  // Rewrite to /es/... so [locale] resolves without redirecting the public URL.
  url.pathname = `/es${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.rewrite(url, {
    request: { headers: requestHeaders(request, locale) },
  });
  res.cookies.set(COOKIE_LOCALE, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}
