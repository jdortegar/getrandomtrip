"use client";

import { sanitizeEvent } from "./privacy";
import { currentAnalyticsPage } from "./runtime";
import type { AiSource } from "./aiReferral";
import type { CommerceValue } from "./commerce";

export type GTMEvents = { event: string; [key: string]: unknown };
const sentPurchases = new Set<string>();

export function trackCustomEvent(data: GTMEvents): boolean {
  const page = currentAnalyticsPage();
  const safe = sanitizeEvent(data);
  if (
    !page ||
    !safe ||
    (page.purchaseOnly && safe.event !== "purchase") ||
    (!page.purchaseOnly && safe.event === "purchase") ||
    (page.commerceOnly &&
      !["begin_checkout", "add_payment_info"].includes(String(safe.event))) ||
    (!page.commerceOnly &&
      ["begin_checkout", "add_payment_info"].includes(String(safe.event)))
  )
    return false;
  const {
    purchaseOnly: _purchaseOnly,
    commerceOnly: _commerceOnly,
    ...fields
  } = page;
  window.dataLayer = window.dataLayer ?? [];
  // Clear event-specific values so GTM does not reuse a previous event's fields.
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
    ai_source: null,
    ...fields,
    ...safe,
  });
  return true;
}

export function trackPageview(): boolean {
  return trackCustomEvent({ event: "page_view" });
}
export function trackScrollDepth(percent: number): boolean {
  return trackCustomEvent({ event: "scroll_depth", percent });
}
export function trackSignUp(method: string): boolean {
  return trackCustomEvent({ event: "sign_up", method });
}
const AI_REFERRAL_KEY = "rt-ai-referral";

/** Once per browser session; the flag is written only after a consented send. */
export function trackAiReferral(source: AiSource): boolean {
  try {
    if (window.sessionStorage.getItem(AI_REFERRAL_KEY) === "1") return false;
  } catch {
    /* Without storage the caller's per-document guard still applies. */
  }
  if (!trackCustomEvent({ event: "ai_referral", ai_source: source }))
    return false;
  try {
    window.sessionStorage.setItem(AI_REFERRAL_KEY, "1");
  } catch {
    /* Do not retry within this page lifecycle. */
  }
  return true;
}
export function trackButtonClick(_label: string): void {
  /* Free-text click labels are intentionally not collected. */
}

export function trackPurchase(
  params: CommerceValue & {
    transaction_id: string;
  },
): boolean {
  const key = `rt-purchase-${params.transaction_id}`;
  try {
    if (window.localStorage.getItem(key) === "1") return false;
  } catch {
    /* In-memory dedup remains available. */
  }
  if (sentPurchases.has(key)) return false;
  if (!trackCustomEvent({ event: "purchase", ...params })) return false;
  sentPurchases.add(key);
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* Do not retry within this page lifecycle. */
  }
  return true;
}
