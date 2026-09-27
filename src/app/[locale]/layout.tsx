import type { Metadata } from "next";
import { headers } from "next/headers";
import { routeMetadata } from "@/lib/seo/routeMetadata";
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import BackToTopButton from "@/components/chrome/BackToTopButton";
import { GlobalAuthModal } from "@/components/providers/GlobalAuthModal";
import SessionProvider from "@/components/providers/SessionProvider";
import SetLocaleLang from "@/components/providers/SetLocaleLang";
import SyncLocale from "@/components/providers/SyncLocale";
import AppTracking from "@/components/tracking/AppTracking";
import { Toaster } from "@/components/ui/toaster";
import { GateAwareChrome } from "@/components/waitlist/GateAwareChrome";
import { AttributionModeBanner } from "@/components/tripper/AttributionModeBanner";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { isGateEnabled } from "@/lib/siteSettings";

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
  const [requestHeaders, dict, gateEnabled] = await Promise.all([
    headers(),
    getDictionary(locale),
    isGateEnabled(),
  ]);
  return routeMetadata(
    requestHeaders.get("x-pathname") ?? "/__unresolved",
    locale,
    dict,
    gateEnabled,
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
  const gateEnabled = await isGateEnabled();

  return (
    <SessionProvider>
      <SetLocaleLang locale={localeTyped} />
      <SyncLocale />
      <Suspense fallback={null}>
        <AppTracking />
      </Suspense>
      <GateAwareChrome
        banner={
          <Suspense fallback={null}>
            <AttributionModeBanner copy={dict.tripperAttribution} />
          </Suspense>
        }
        dict={dict}
        gateEnabled={gateEnabled}
        locale={localeTyped}
      >
        {children}
      </GateAwareChrome>
      <GlobalAuthModal dict={dict} />
      <BackToTopButton />
      <Toaster />
    </SessionProvider>
  );
}
