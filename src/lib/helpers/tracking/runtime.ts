"use client";

import {
  ANALYTICS_HOSTNAME,
  GA_MEASUREMENT_ID,
  GTM_ID,
} from "@/lib/constants/tracking/service-keys";
import { isIndexablePath } from "@/lib/seo/urls";
import { analyticsPage, type AnalyticsPage } from "./privacy";
import { readAnalyticsConsent } from "./consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let defaultsSet = false;
let activePath: string | null = null;
let activePage: AnalyticsPage | null = null;

function googleCommand(...args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  // Google consumes the same array-like command shape used by gtag().
  void args;
  window.dataLayer.push(arguments);
}

const DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
};

export function isAnalyticsProduction(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" &&
    window.location.hostname === ANALYTICS_HOSTNAME &&
    /^GTM-[A-Z0-9]+$/.test(GTM_ID) &&
    /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)
  );
}

export function configureAnalytics(
  pathname: string,
  waitlistVisible = false,
): AnalyticsPage | null {
  const page = analyticsPage(pathname);
  const allowed =
    isAnalyticsProduction() &&
    readAnalyticsConsent() === "granted" &&
    !!page &&
    (!waitlistVisible || isIndexablePath(pathname));
  window.dataLayer = window.dataLayer ?? [];
  if (!defaultsSet) {
    googleCommand("consent", "default", DENIED);
    defaultsSet = true;
  }
  (window as unknown as Record<string, unknown>)[
    `ga-disable-${GA_MEASUREMENT_ID}`
  ] = !allowed;
  activePath = allowed ? pathname : null;
  activePage = allowed
    ? waitlistVisible
      ? {
          ...analyticsPage(page!.language === "en" ? "/en" : "/")!,
          page_title: "Waitlist",
        }
      : page
    : null;
  const {
    purchaseOnly: _purchaseOnly,
    commerceOnly: _commerceOnly,
    ...fields
  } = activePage ?? {
    ...analyticsPage("/")!,
  };
  window.dataLayer.push({
    user_id: null,
    user_type: null,
    user_properties: null,
    method: null,
    percent: null,
    trip_type: null,
    transaction_id: null,
    value: null,
    currency: null,
    items: null,
    payment_type: null,
    ...fields,
    rt_analytics_allowed: allowed,
  });
  googleCommand("consent", "update", {
    ...DENIED,
    analytics_storage: allowed ? "granted" : "denied",
  });
  return activePage;
}

export function currentAnalyticsPage(): AnalyticsPage | null {
  if (
    !isAnalyticsProduction() ||
    readAnalyticsConsent() !== "granted" ||
    window.location.pathname !== activePath
  )
    return null;
  return activePage;
}

export function loadAnalyticsContainer() {
  if (!currentAnalyticsPage() || document.getElementById("rt-gtm")) return;
  window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "rt-gtm";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}
