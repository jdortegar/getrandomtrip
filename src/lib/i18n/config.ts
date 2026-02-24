// ============================================================================
// i18n config – locales, default, cookie, URL strategy
// ============================================================================

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

export const COOKIE_LOCALE = 'NEXT_LOCALE';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export function hasLocale(s: string | undefined): s is Locale {
  return LOCALES.includes(s as Locale);
}
