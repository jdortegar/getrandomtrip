'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { TripperProfilePageDict } from '@/lib/types/dictionary';
import type { Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

interface TripperProfileAccessDeniedProps {
  copy: TripperProfilePageDict['accessDenied'];
  locale: Locale;
}

export function TripperProfileAccessDenied({ copy, locale }: TripperProfileAccessDeniedProps) {
  const homePath = pathForLocale(locale, '/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-bold leading-[1.1] text-neutral-900">{copy.title}</h1>
          <p className="text-base leading-relaxed text-neutral-600">{copy.description}</p>
        </div>
        <Button
          asChild
          className="w-full sm:w-auto"
          size="md"
          variant="secondary"
        >
          <Link href={homePath}>{copy.ctaHome}</Link>
        </Button>
      </div>
    </div>
  );
}
