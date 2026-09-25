"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckoutQuote } from "@/lib/types/CheckoutQuote";

interface RefreshOptions {
  promoCode?: string | null;
  save?: () => Promise<void>;
}

/** Serialize mutations, not just responses: an older request must finish before
 * the next save/quote can change the same trip and its Stripe intent. */
export function useCheckoutQuote(tripId?: string) {
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const currentTrip = useRef(tripId);
  const revision = useRef(0);
  const ready = useRef(false);
  const secret = useRef<string | null>(null);
  const lastOptions = useRef<RefreshOptions>({});

  const refresh = useCallback(
    (options: RefreshOptions = {}) => {
      const version = ++revision.current;
      ready.current = false;
      secret.current = null;
      lastOptions.current = options;
      setPending(true);
      setError(null);
      setQuote(null);
      const isCurrent = () =>
        currentTrip.current === tripId && revision.current === version;
      const run = queue.current
        .catch(() => {})
        .then(async () => {
          if (!tripId || currentTrip.current !== tripId) return null;
          try {
            await options.save?.();
            if (currentTrip.current !== tripId) return null;
            const response = await fetch("/api/stripe/payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tripId,
                ...(options.promoCode !== undefined
                  ? { promoCode: options.promoCode }
                  : {}),
              }),
            });
            const data = await response.json();
            if (isCurrent() && "code" in data) setPromoCode(data.code);
            if (!response.ok)
              throw new Error(data.error ?? "Could not refresh checkout");
            if (!data.clientSecret || !Number.isFinite(data.total))
              throw new Error("Invalid checkout quote");
            if (isCurrent()) {
              setQuote(data as CheckoutQuote);
              ready.current = true;
              secret.current = data.clientSecret;
            }
            return data as CheckoutQuote;
          } catch (cause) {
            if (isCurrent())
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Could not refresh checkout",
              );
            throw cause;
          } finally {
            if (isCurrent()) setPending(false);
          }
        });
      queue.current = run;
      return run;
    },
    [tripId],
  );

  const invalidate = useCallback(() => {
    currentTrip.current = undefined;
    ++revision.current;
    ready.current = false;
  }, []);

  useEffect(() => {
    currentTrip.current = tripId;
    const version = revision.current;
    // Defer startup so a discarded mount never starts a mutating request.
    void Promise.resolve()
      .then(() => {
        if (
          tripId &&
          currentTrip.current === tripId &&
          revision.current === version
        ) {
          return refresh();
        }
      })
      .catch(() => {});
    return invalidate;
  }, [tripId, refresh, invalidate]);

  return {
    quote,
    pending,
    error,
    refresh,
    promoCode,
    retry: () => refresh(lastOptions.current),
    isReady: (expectedSecret?: string) =>
      ready.current &&
      currentTrip.current === tripId &&
      (!expectedSecret || expectedSecret === secret.current),
  };
}
