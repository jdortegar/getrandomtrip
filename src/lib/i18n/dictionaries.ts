// ============================================================================
// getDictionary(locale) – loads dictionaries/{locale}.json
// ============================================================================

import type { MarketingDictionary } from '@/lib/types/dictionary';
import { hasLocale } from './config';

export type Dictionary = MarketingDictionary;

export async function getDictionary(locale: string): Promise<Dictionary> {
  const safeLocale = hasLocale(locale) ? locale : 'es';
  const dict = await import(`@/dictionaries/${safeLocale}.json`);
  return dict.default as Dictionary;
}
