// ============================================================================
// Locale-aware paths – default locale has no prefix, others use /en, /es
// ============================================================================

import { DEFAULT_LOCALE, LOCALES, type Locale } from './config';

/**
 * Returns the path for a given locale.
 * - Default locale: path as-is (no prefix), e.g. pathForLocale('es', '/blog') => '/blog'
 * - Other locales: prefix with locale, e.g. pathForLocale('en', '/blog') => '/en/blog'
 */
export function pathForLocale(locale: Locale, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) {
    return normalizedPath;
  }
  return `/${locale}${normalizedPath}`;
}

/**
 * Strips the locale prefix from pathname if present.
 * e.g. '/en/blog' => '/blog', '/blog' => '/blog'
 */
export function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && LOCALES.includes(first as Locale)) {
    return '/' + segments.slice(1).join('/') || '/';
  }
  return pathname;
}
