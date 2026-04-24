import Link from 'next/link';
import { Heart, HelpCircle, MapPin, Users } from 'lucide-react';
import type { MarketingDictionary } from '@/lib/types/dictionary';
import type { Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

type NotFoundCopy = MarketingDictionary['notFound'];

interface NotFoundStatusPageExtrasProps {
  locale: Locale;
  nf: NotFoundCopy;
}

export function NotFoundStatusExploreAndTip({ locale, nf }: NotFoundStatusPageExtrasProps) {
  return (
    <>
      <div className="border-t border-neutral-200 pt-8">
        <p className="mb-4 text-sm text-gray-600">{nf.exploreSections}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-primary/10 hover:text-primary"
            href={pathForLocale(locale, '/experiences/by-type/solo')}
          >
            <MapPin className="h-4 w-4" />
            {nf.linkSolo}
          </Link>
          <Link
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-primary/10 hover:text-primary"
            href={pathForLocale(locale, '/experiences/by-type/couple')}
          >
            <Heart className="h-4 w-4" />
            {nf.linkCouple}
          </Link>
          <Link
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-primary/10 hover:text-primary"
            href={pathForLocale(locale, '/experiences/by-type/family')}
          >
            <Users className="h-4 w-4" />
            {nf.linkFamily}
          </Link>
          <Link
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-primary/10 hover:text-primary"
            href={pathForLocale(locale, '/trippers')}
          >
            <Users className="h-4 w-4" />
            {nf.linkTrippers}
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
          <span>
            <strong>{nf.tipLabel}</strong> {nf.tipText}
          </span>
        </p>
      </div>
    </>
  );
}

export function NotFoundStatusHelpLine({ locale, nf }: NotFoundStatusPageExtrasProps) {
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-gray-600">
      <HelpCircle className="h-4 w-4" />
      {nf.needHelp}{' '}
      <Link className="text-primary underline hover:text-primary/80" href={pathForLocale(locale, '/contact')}>
        {nf.contactUs}
      </Link>
    </p>
  );
}
