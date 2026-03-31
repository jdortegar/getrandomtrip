import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/layout/LegalDocumentPage';
import { hasLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';

type LocaleParams = { params: { locale?: string | string[] } };

function resolveLocale(raw: string | string[] | undefined): Locale {
  const localeStr = typeof raw === 'string' ? raw : raw?.[0];
  return hasLocale(localeStr) ? localeStr : 'es';
}

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const meta = dict.legalPrivacy.meta;
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

export default async function PrivacyPage({ params }: LocaleParams) {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  return <LegalDocumentPage document={dict.legalPrivacy} locale={locale} />;
}
