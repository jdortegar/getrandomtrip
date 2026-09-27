"use client";

import { useEffect, useState } from "react";
import type { CheckoutResultSummary } from "@/lib/types/CheckoutResult";

const MAX_CHECKS = 4;
const POLL_INTERVAL_MS = 1500;
const REQUEST_TIMEOUT_MS = 12000;
type ResultStatus =
  | "checking"
  | "pending"
  | "success"
  | "failed"
  | "error"
  | "missing";
interface Result {
  key: string;
  status: ResultStatus;
  data: CheckoutResultSummary | null;
  polling: boolean;
}

/** Only authenticated server data can establish payment and booking success. */
export function useVerifiedCheckoutResult(paymentIntentId: string | null) {
  const [attempt, setAttempt] = useState(0);
  const key = `${paymentIntentId ?? ""}:${attempt}`;
  const [result, setResult] = useState<Result>({
    key: "",
    status: "checking",
    data: null,
    polling: false,
  });

  useEffect(() => {
    if (!paymentIntentId) return;
    let cancelled = false;
    let poll: ReturnType<typeof setTimeout> | undefined;
    let activeController: AbortController | undefined;
    async function verify(check: number) {
      const controller = new AbortController();
      activeController = controller;
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        let providerStatus: string | undefined;
        try {
          const confirmation = await fetch("/api/stripe/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId }),
            signal: controller.signal,
          });
          if (confirmation.ok)
            providerStatus = (await confirmation.json()).status;
        } catch {
          // A webhook may already have settled the booking; read the DB anyway.
        }
        if (cancelled) return;
        const response = await fetch(
          `/api/stripe/trip-summary?paymentIntentId=${encodeURIComponent(paymentIntentId!)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Payment summary unavailable");
        const data: CheckoutResultSummary = await response.json();
        if (
          !data.trip?.id ||
          !data.trip.status ||
          !data.payment?.status ||
          !Number.isFinite(data.payment.amount) ||
          typeof data.payment.currency !== "string"
        ) {
          throw new Error("Invalid payment summary");
        }
        if (cancelled) return;
        if (
          data.payment.status === "APPROVED" &&
          ["CONFIRMED", "REVEALED", "COMPLETED"].includes(data.trip.status)
        ) {
          setResult({ key, status: "success", data, polling: false });
          return;
        }
        const failed =
          [
            "FAILED",
            "REJECTED",
            "CANCELLED",
            "REFUNDED",
            "CHARGEBACK",
          ].includes(data.payment.status) ||
          data.trip.status === "CANCELLED" ||
          ["requires_payment_method", "canceled"].includes(
            providerStatus ?? "",
          );
        const polling = !failed && check + 1 < MAX_CHECKS;
        setResult({
          key,
          status: failed ? "failed" : "pending",
          data: null,
          polling,
        });
        if (polling)
          poll = setTimeout(() => {
            void verify(check + 1);
          }, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled)
          setResult({ key, status: "error", data: null, polling: false });
      } finally {
        clearTimeout(timeout);
      }
    }
    void verify(0);
    return () => {
      cancelled = true;
      clearTimeout(poll);
      activeController?.abort();
    };
  }, [key, paymentIntentId]);

  const current: Result = !paymentIntentId
    ? { key, status: "missing", data: null, polling: false }
    : result.key === key
      ? result
      : { key, status: "checking", data: null, polling: true };
  return {
    ...current,
    isChecking: current.status === "checking" || current.polling,
    retry: () => setAttempt((value) => value + 1),
  };
}
