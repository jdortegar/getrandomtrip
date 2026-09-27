"use client";

export const CONSENT_KEY = "rt-analytics-consent-v1";
const CONSENT_GRANTED_AT_KEY = "rt-analytics-granted-at";
export const CONSENT_EVENT = "rt-analytics-consent-change";
export type AnalyticsConsent = "granted" | "denied" | null;
let storageFallback: AnalyticsConsent | undefined;

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  if (storageFallback !== undefined) return storageFallback;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function analyticsGrantedAt(): number {
  try {
    return (
      Number(window.localStorage.getItem(CONSENT_GRANTED_AT_KEY)) || Infinity
    );
  } catch {
    return Infinity;
  }
}

export function subscribeAnalyticsConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function clearAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = [
    "",
    ...host
      .split(".")
      .slice(0, -1)
      .flatMap((_, i) => {
        const domain = host.split(".").slice(i).join(".");
        return [`; domain=${domain}`, `; domain=.${domain}`];
      }),
  ];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
    for (const domain of domains)
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}; SameSite=Lax`;
  }
}

export function saveAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  try {
    if (value === "granted")
      window.localStorage.setItem(CONSENT_GRANTED_AT_KEY, String(Date.now()));
    window.localStorage.setItem(CONSENT_KEY, value);
    storageFallback = undefined;
  } catch {
    storageFallback = "denied";
  }
  if (value === "denied") clearAnalyticsCookies();
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
