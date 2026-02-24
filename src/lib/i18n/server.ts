// ============================================================================
// Server-side locale – getLocaleFromCookies() for RSC
// ============================================================================

import { cookies } from 'next/headers';
import { COOKIE_LOCALE, DEFAULT_LOCALE, hasLocale, type Locale } from './config';

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const nextLocale = cookieStore.get(COOKIE_LOCALE)?.value;
  if (hasLocale(nextLocale)) return nextLocale;
  return DEFAULT_LOCALE;
}
