'use client';

import { XsedHero } from '@/components/app/xsed/XsedHero';
import { useDictionary, useLocale } from '@/hooks/useDictionary';
import { pathForLocale } from '@/lib/i18n/pathForLocale';
import type { Locale } from '@/lib/i18n/config';

export function XsedUnavailablePage() {
  const unavailable = useDictionary((d) => d.xsedUnavailable);
  const xsedHero = useDictionary((d) => d.xsedPage.xsedHero);
  const locale = useLocale() as Locale;

  return (
    <XsedHero
      backHref={pathForLocale(locale, '/xsed/drops')}
      backLabel={unavailable.backLabel}
      content={{
        ...xsedHero,
        helper: unavailable.subheading,
        submitLabel: unavailable.notifyLabel,
        title: unavailable.heading,
      }}
    />
  );
}
