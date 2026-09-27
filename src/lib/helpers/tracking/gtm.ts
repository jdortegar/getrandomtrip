"use client";

import { sanitizeEvent } from "./privacy";
import { currentAnalyticsPage } from "./runtime";

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
export type GTMEvents = { event: string; [key: string]: unknown };
const sentPurchases = new Set<string>();

export function trackCustomEvent(data: GTMEvents): boolean {
  const page = currentAnalyticsPage();
  const safe = sanitizeEvent(data);
  if (
    !page ||
    !safe ||
    (page.purchaseOnly && safe.event !== "purchase") ||
    (!page.purchaseOnly && safe.event === "purchase")
  )
    return false;
  const { purchaseOnly: _purchaseOnly, ...fields } = page;
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
export function trackButtonClick(_label: string): void {
  /* Free-text click labels are intentionally not collected. */
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  currency?: string;
  items?: PurchaseItem[];
}): boolean {
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
