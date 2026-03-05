// ============================================================================
// getDictionary(locale) – loads dictionaries/{locale}.json
// ============================================================================

import type { MarketingDictionary } from '@/lib/types/dictionary';
import { hasLocale, type Locale } from './config';

export type Dictionary = MarketingDictionary;

export async function getDictionary(locale: string): Promise<Dictionary> {
  const safeLocale: Locale = hasLocale(locale) ? (locale as Locale) : 'es';
  const dict =
    safeLocale === 'en'
      ? ((await import('@/dictionaries/en.json')) as { default: Dictionary })
      : ((await import('@/dictionaries/es.json')) as { default: Dictionary });
  return dict.default;
}
