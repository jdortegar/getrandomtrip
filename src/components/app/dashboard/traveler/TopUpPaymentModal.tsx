"use client";

import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementLocale } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StripePaymentForm } from "@/components/app/checkout/StripePaymentForm";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import { Button } from "@/components/ui/Button";
import { DialogDescription, DialogHeader, DialogTitle, Modal } from "@/components/ui/Modal";
import { fetchShareIntent, type IntentResult } from "@/lib/payments/share-intent-client";
import { stripeAppearance } from "@/lib/stripe-appearance";
import { getStripePromise } from "@/lib/stripe-client";
import type { MyTopUp } from "@/types/payments";

interface TopUpPaymentModalProps {
  copy: DashboardCopy["topUpDue"];
  paymentCopy: Parameters<typeof StripePaymentForm>[0]["copy"];
  locale: string;
  /** The top-up being paid; null keeps the modal closed. */
  topUp: MyTopUp | null;
  onClose: () => void;
  /** Called when the server reports the top-up already settled. */
  onPaid: () => void;
}

type View = { status: "loading" } | { status: "ready"; clientSecret: string } | { status: "paid" } | { status: "closed" } | { status: "error" };

const TOP_UP_CLOSED_CODES = ["GRACE_PASSED", "NOT_OPEN"];

/** Card payment for the viewer's own top-up, entered again on purpose (S6). */
export function TopUpPaymentModal({ copy, paymentCopy, locale, topUp, onClose, onPaid }: TopUpPaymentModalProps) {
  const [view, setView] = useState<View>({ status: "loading" });
  const [stripe] = useState(() => getStripePromise());
  const shareId = topUp?.shareId ?? null;
  // A different (or reopened) top-up starts from a fresh request, never a stale result.
  const [viewFor, setViewFor] = useState<string | null>(shareId);
  if (viewFor !== shareId) {
    setViewFor(shareId);
    setView({ status: "loading" });
  }

  // Read through a ref: a parent that re-renders on onPaid must not restart the request.
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);
  const apply = useCallback((result: IntentResult) => {
    if (result.kind === "ready") setView({ status: "ready", clientSecret: result.clientSecret });
    else setView({ status: result.kind });
    if (result.kind === "paid") onPaidRef.current();
  }, []);

  useEffect(() => {
    if (!shareId) return;
    let active = true;
    void fetchShareIntent("/api/stripe/top-up-intent", { shareId }, TOP_UP_CLOSED_CODES).then((result) => {
      if (active) apply(result);
    });
    return () => {
      active = false;
    };
  }, [shareId, apply]);

  const retry = () => {
    if (!shareId) return;
    setView({ status: "loading" });
    void fetchShareIntent("/api/stripe/top-up-intent", { shareId }, TOP_UP_CLOSED_CODES).then(apply);
  };

  const amount = topUp ? `${topUp.currency} ${topUp.amount.toFixed(Number.isInteger(topUp.amount) ? 0 : 2)}` : "";

  return (
    <Modal
      className="flex max-w-lg flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-lg"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={topUp !== null}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <DialogTitle className="text-xl font-semibold text-ink">{copy.modalTitle}</DialogTitle>
        <DialogDescription className="text-sm text-gray-500">
          {copy.modalDescription.replace("{amount}", amount)}
        </DialogDescription>
      </DialogHeader>
      <div className="px-6 py-5" data-component="TopUpPaymentModal">
        {view.status === "loading" ? (
          <p aria-busy="true" className="flex items-center gap-2 text-sm" role="status">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {copy.loading}
          </p>
        ) : view.status === "error" ? (
          <div className="flex flex-col items-start gap-3" role="alert">
            <p className="text-sm text-red-700">{copy.error}</p>
            <Button onClick={retry} type="button" variant="secondary">
              {copy.retry}
            </Button>
          </div>
        ) : view.status === "paid" || view.status === "closed" ? (
          <p className="text-sm text-neutral-700" role="status">
            {view.status === "paid" ? copy.paid : copy.closed}
          </p>
        ) : (
          <Elements
            key={view.clientSecret}
            options={{
              appearance: stripeAppearance,
              clientSecret: view.clientSecret,
              locale: (locale.startsWith("en") ? "en" : "es") as StripeElementLocale,
            }}
            stripe={stripe}
          >
            <StripePaymentForm
              billingCity=""
              billingCountry=""
              billingEmail=""
              billingLine1=""
              billingName=""
              billingPhone=""
              billingPostalCode=""
              billingState=""
              collectBillingDetails
              copy={paymentCopy}
              onBeforeConfirm={async () => true}
              onCancel={onClose}
              onProcessingChange={() => {}}
              onRetry={retry}
              returnPath="/dashboard/traveler"
            />
          </Elements>
        )}
      </div>
    </Modal>
  );
}
