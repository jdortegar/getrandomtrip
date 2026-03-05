import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import SessionProvider from '@/components/providers/SessionProvider';
import SetLocaleLang from '@/components/providers/SetLocaleLang';
import AppTracking from '@/components/tracking/AppTracking';
import { Toaster } from '@/components/ui/toaster';
import { GateAwareChrome } from '@/components/waitlist/GateAwareChrome';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale;
  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const localeTyped = locale as Locale;

  return (
    <SessionProvider>
      <SetLocaleLang locale={localeTyped} />
      <Suspense fallback={null}>
        <AppTracking />
      </Suspense>
      <GateAwareChrome dict={dict} locale={localeTyped}>
        {children}
      </GateAwareChrome>
      <Toaster />
    </SessionProvider>
  );
}
