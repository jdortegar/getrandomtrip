"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { CheckoutQuote } from "@/lib/types/CheckoutQuote";
import type { CheckoutResultSummary } from "@/lib/types/CheckoutResult";
import { bookingItems, bookingValue } from "@/lib/helpers/tracking/commerce";
import {
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "@/lib/helpers/tracking/consent";
import { trackCustomEvent, trackPurchase } from "@/lib/helpers/tracking/gtm";

function useConsent() {
  return useSyncExternalStore(
    subscribeAnalyticsConsent,
    readAnalyticsConsent,
    () => null,
  );
}

/** Once per displayed product in this mounted builder, including late opt-in. */
export function useProductView(tripType: string | null | undefined) {
  const consent = useConsent();
  const viewed = useRef(new Set<string>());
  useEffect(() => {
    if (!tripType || consent !== "granted" || viewed.current.has(tripType))
      return;
    if (trackCustomEvent({ event: "view_item", items: bookingItems(tripType) }))
      viewed.current.add(tripType);
  }, [tripType, consent]);
}

export function trackProductSelection(tripType: string) {
  return trackCustomEvent({
    event: "select_item",
    items: bookingItems(tripType),
  });
}

/** Private IDs are in-memory dedup keys only; they never enter event payloads. */
export function useCheckoutTracking(
  tripId: string | undefined,
  tripType: string | undefined,
  quote: CheckoutQuote | null,
) {
  const consent = useConsent();
  const begun = useRef(new Set<string>());
  const submitted = useRef(new Set<string>());
  useEffect(() => {
    if (
      !tripId ||
      !tripType ||
      !quote ||
      consent !== "granted" ||
      begun.current.has(tripId)
    )
      return;
    if (
      trackCustomEvent({
        event: "begin_checkout",
        ...bookingValue(tripType, quote.total),
      })
    )
      begun.current.add(tripId);
  }, [tripId, tripType, quote, consent]);

  // Called only after contact preflight and a complete Stripe Payment Element.
  // A declined charge is still submitted payment info, not a purchase.
  return () => {
    if (!tripId || !tripType || !quote || submitted.current.has(tripId)) return;
    if (
      trackCustomEvent({
        event: "add_payment_info",
        ...bookingValue(tripType, quote.total),
        payment_type: "stripe",
      })
    )
      submitted.current.add(tripId);
  };
}

export function usePurchaseTracking(
  paymentIntentId: string | null,
  data: CheckoutResultSummary | null,
) {
  const consent = useConsent();
  useEffect(() => {
    if (
      !paymentIntentId ||
      !data ||
      consent !== "granted" ||
      data.payment.status !== "APPROVED" ||
      !["CONFIRMED", "REVEALED", "COMPLETED"].includes(data.trip.status)
    )
      return;
    trackPurchase({
      transaction_id: paymentIntentId,
      ...bookingValue(
        data.trip.type,
        data.payment.amount,
        data.payment.currency.toUpperCase(),
      ),
    });
  }, [paymentIntentId, data, consent]);
}
