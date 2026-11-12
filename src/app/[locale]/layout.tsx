import AnalyticsConsent from "@/components/tracking/AnalyticsConsent";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { routeMetadata } from "@/lib/seo/routeMetadata";
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import BackToTopButton from "@/components/chrome/BackToTopButton";
import { GlobalAuthModal } from "@/components/providers/GlobalAuthModal";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import SetLocaleLang from "@/components/providers/SetLocaleLang";
import SyncLocale from "@/components/providers/SyncLocale";
import { Toaster } from "@/components/ui/toaster";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AttributionModeBanner } from "@/components/tripper/AttributionModeBanner";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, type Locale } from "@/lib/i18n/config";

/** Avoid SSG so SessionProvider/useSession have request context (no "auth" destructure error during prerender). */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  if (!hasLocale(locale)) notFound();
  const [requestHeaders, dict] = await Promise.all([
    headers(),
    getDictionary(locale),
  ]);
  return routeMetadata(
    requestHeaders.get("x-pathname") ?? "/__unresolved",
    locale,
    dict,
  );
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { children } = props;

  const locale = params.locale;
  if (!hasLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const localeTyped = locale as Locale;

  return (
    <SessionProvider>
      <SetLocaleLang locale={localeTyped} />
      <SyncLocale />
      <CurrencyProvider locale={localeTyped}>
        <SiteChrome
          banner={
            <Suspense fallback={null}>
              <AttributionModeBanner copy={dict.tripperAttribution} />
            </Suspense>
          }
          dict={dict}
          locale={localeTyped}
        >
          {children}
        </SiteChrome>
      </CurrencyProvider>
      <AnalyticsConsent copy={dict.analyticsConsent} />
      <GlobalAuthModal dict={dict} />
      <BackToTopButton />
      <Toaster />
    </SessionProvider>
  );
}
