'use client';

import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n/config';

interface SetLocaleLangProps {
  locale: Locale;
}

export default function SetLocaleLang({ locale }: SetLocaleLangProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
