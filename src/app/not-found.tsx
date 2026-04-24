import Link from 'next/link';
import { Home, MapPin, Plane } from 'lucide-react';
import { FullPageStatusLayout } from '@/components/layout/FullPageStatusLayout';
import {
  NotFoundStatusExploreAndTip,
  NotFoundStatusHelpLine,
} from '@/components/layout/NotFoundStatusPageExtras';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getLocaleFromCookies } from '@/lib/i18n/server';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

export async function generateMetadata() {
  const locale = await getLocaleFromCookies();
  const dict = await getDictionary(locale);
  return {
    description: dict.notFound.metaDescription,
    title: dict.notFound.metaTitle,
  };
}

export default async function NotFoundPage() {
  const locale = await getLocaleFromCookies();
  const dict = await getDictionary(locale);
  const nf = dict.notFound;

  return (
    <FullPageStatusLayout
      actions={
        <>
          <Link
            className="group relative flex transform items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-xl"
            href={pathForLocale(locale, '/')}
          >
            <Home className="h-5 w-5" />
            <span className="relative z-10">{nf.goHome}</span>
            <div className="absolute inset-0 rounded-xl bg-primary opacity-0 blur transition-opacity duration-300 group-hover:opacity-75" />
          </Link>

          <Link
            className="group flex transform items-center justify-center gap-2 rounded-xl border-2 border-primary/20 px-8 py-4 font-semibold text-primary transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:bg-primary/5"
            href={pathForLocale(locale, '/experiences')}
          >
            <Plane className="h-5 w-5" />
            {nf.viewPackages}
          </Link>
        </>
      }
      cardFooter={<NotFoundStatusExploreAndTip locale={locale} nf={nf} />}
      code="404"
      leadIcon={<MapPin className="h-10 w-10 text-white" strokeWidth={2} />}
      pageFooter={<NotFoundStatusHelpLine locale={locale} nf={nf} />}
      subtitle={nf.subtitle}
      title={nf.title}
    />
  );
}
