import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { EmailSignaturesClient } from '@/components/marketing/EmailSignaturesClient';
import { hasLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';

type LocaleParams = { params: { locale?: string | string[] } };

function resolveLocale(raw: string | string[] | undefined): Locale {
  const localeStr = typeof raw === 'string' ? raw : raw?.[0];
  return hasLocale(localeStr) ? localeStr : 'es';
}

function getPreviewOrigin(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) {
    return 'http://localhost:3010';
  }
  const proto =
    host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : (h.get('x-forwarded-proto') ?? 'https');
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const meta = dict.emailSignatures.meta;
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

export default async function EmailSignaturesPage({ params }: LocaleParams) {
  const locale = resolveLocale(params?.locale);
  const dict = await getDictionary(locale);
  const previewOrigin = getPreviewOrigin();
  const copyBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getrandomtrip.com').replace(/\/$/, '');

  return (
    <EmailSignaturesClient
      copy={dict.emailSignatures}
      copyBaseUrl={copyBaseUrl}
      previewOrigin={previewOrigin}
    />
  );
}
