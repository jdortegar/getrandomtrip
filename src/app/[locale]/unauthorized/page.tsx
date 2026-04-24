import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Home, LayoutDashboard } from 'lucide-react';
import { FullPageStatusLayout } from '@/components/layout/FullPageStatusLayout';
import {
  NotFoundStatusExploreAndTip,
  NotFoundStatusHelpLine,
} from '@/components/layout/NotFoundStatusPageExtras';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';
import { pathForLocale } from '@/lib/i18n/pathForLocale';

type LocaleParams = { params: { locale?: string | string[] } };

function resolveLocale(raw: string | string[] | undefined): Locale {
  const localeStr = typeof raw === 'string' ? raw : raw?.[0];
  return hasLocale(localeStr) ? localeStr : 'es';
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const meta = dict.unauthorized.meta;
  return {
    description: meta.description,
    openGraph: {
      description: meta.openGraphDescription,
      title: meta.openGraphTitle,
      type: 'website',
    },
    title: meta.title,
  };
}

export default async function UnauthorizedPage({ params }: LocaleParams) {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const copy = dict.unauthorized;
  const nf = dict.notFound;
  const homePath = pathForLocale(locale, '/');
  const dashboardPath = pathForLocale(locale, '/dashboard');

  return (
    <FullPageStatusLayout
      actions={
        <>
          <Link
            className="group relative flex transform items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-xl"
            href={homePath}
          >
            <Home className="h-5 w-5" />
            <span className="relative z-10">{copy.cta.home}</span>
            <div className="absolute inset-0 rounded-xl bg-primary opacity-0 blur transition-opacity duration-300 group-hover:opacity-75" />
          </Link>

          <Link
            className="group flex transform items-center justify-center gap-2 rounded-xl border-2 border-primary/20 px-8 py-4 font-semibold text-primary transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:bg-primary/5"
            href={dashboardPath}
          >
            <LayoutDashboard className="h-5 w-5" />
            {copy.cta.dashboard}
          </Link>
        </>
      }
      cardFooter={<NotFoundStatusExploreAndTip locale={locale} nf={nf} />}
      code="403"
      leadIcon={<AlertTriangle aria-hidden className="h-10 w-10 text-white" strokeWidth={2} />}
      pageFooter={<NotFoundStatusHelpLine locale={locale} nf={nf} />}
      subtitle={copy.description}
      title={copy.title}
    />
  );
}
