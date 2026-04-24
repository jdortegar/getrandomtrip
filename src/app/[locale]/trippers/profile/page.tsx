import type { Metadata } from 'next';
import SecureRoute from '@/components/auth/SecureRoute';
import { TripperProfileClient } from '@/components/app/tripper/tripper-profile/TripperProfileClient';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';

type LocaleParams = { params: { locale?: string | string[] } };

function resolveLocale(raw: string | string[] | undefined): Locale {
  const localeStr = typeof raw === 'string' ? raw : raw?.[0];
  return hasLocale(localeStr) ? localeStr : 'es';
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const meta = dict.tripperProfilePage.meta;
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

export default async function TripperProfilePage({ params }: LocaleParams) {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  return (
    <SecureRoute>
      <TripperProfileClient copy={dict.tripperProfilePage} locale={locale} />
    </SecureRoute>
  );
}
