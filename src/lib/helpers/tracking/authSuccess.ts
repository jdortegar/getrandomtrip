"use client";

import type { AnalyticsAuthSuccess } from "@/lib/types/AnalyticsAuthSuccess";
import { trackCustomEvent } from "./gtm";
import { analyticsGrantedAt, readAnalyticsConsent } from "./consent";

const consumed = new Set<string>();

export function trackOAuthSuccess(receipt?: AnalyticsAuthSuccess): boolean {
  if (
    !receipt ||
    Date.now() - receipt.issuedAt > 300_000 ||
    receipt.issuedAt > Date.now() ||
    consumed.has(receipt.id)
  )
    return false;
  const discardedKey = "rt-auth-consumed-through";
  let discardedThrough: number;
  try {
    discardedThrough = Number(window.localStorage.getItem(discardedKey)) || 0;
  } catch {
    return false;
  }
  if (
    receipt.issuedAt <= discardedThrough ||
    receipt.issuedAt <= analyticsGrantedAt() ||
    readAnalyticsConsent() !== "granted"
  ) {
    consumed.add(receipt.id);
    // A timestamp watermark, not an account/receipt identifier, survives reloads.
    try {
      window.localStorage.setItem(
        discardedKey,
        String(Math.max(discardedThrough, receipt.issuedAt)),
      );
    } catch {
      /* The grant timestamp also prevents pre-consent replay. */
    }
    return false;
  }
  const key = "rt-last-oauth-success";
  try {
    if (window.localStorage.getItem(key) === receipt.id) return false;
  } catch {
    /* In-memory guard remains available. */
  }
  const sent = trackCustomEvent({ event: receipt.event, method: "google" });
  consumed.add(receipt.id);
  try {
    window.localStorage.setItem(key, receipt.id);
  } catch {
    /* No durable storage. */
  }
  return sent;
}
