"use client";

import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementLocale } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StripePaymentForm } from "@/components/app/checkout/StripePaymentForm";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { stripeAppearance } from "@/lib/stripe-appearance";
import { getStripePromise } from "@/lib/stripe-client";
import { cn } from "@/lib/utils";
import type { ShareCheckoutState, ShareCheckoutView } from "@/types/payments";

interface ShareCheckoutPageClientProps {
  copy: Dictionary["shareCheckout"];
  locale: string;
  paymentCopy: Parameters<typeof StripePaymentForm>[0]["copy"];
  view: ShareCheckoutView;
}

type Intent =
  | { status: "loading" }
  | { status: "ready"; clientSecret: string }
  | { status: "error" };

type IntentResult =
  | { kind: "ready"; clientSecret: string }
  | { kind: "paid" }
  | { kind: "closed" }
  | { kind: "error" };

/** Asks the server for this companion's share intent; sets no state. */
async function fetchShareIntent(travelerId: string): Promise<IntentResult> {
  try {
    const response = await fetch("/api/stripe/share-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travelerId }),
    });
    const data = await response.json();
    if (data.paid) return { kind: "paid" };
    if (data.errorCode === "DEADLINE_PASSED" || data.errorCode === "NOT_COLLECTING") {
      return { kind: "closed" };
    }
    if (!response.ok || typeof data.clientSecret !== "string") return { kind: "error" };
    return { kind: "ready", clientSecret: data.clientSecret };
  } catch {
    return { kind: "error" };
  }
}

export function ShareCheckoutPageClient({
  copy,
  locale,
  paymentCopy,
  view,
}: ShareCheckoutPageClientProps) {
  const router = useRouter();
  // The server view decides; a share-intent answer (paid / closed) overrides it until the view changes.
  const [override, setOverride] = useState<{ base: ShareCheckoutState; state: ShareCheckoutState } | null>(null);
  const state = override?.base === view.state ? override.state : view.state;
  const setState = useCallback(
    (next: ShareCheckoutState) => setOverride({ base: view.state, state: next }),
    [view.state],
  );
  const [intent, setIntent] = useState<Intent>({ status: "loading" });
  const [stripe] = useState(() => getStripePromise());

  const applyResult = useCallback(
    (result: IntentResult) => {
      if (result.kind === "paid" || result.kind === "closed") setState(result.kind);
      else if (result.kind === "ready") setIntent({ status: "ready", clientSecret: result.clientSecret });
      else setIntent({ status: "error" });
    },
    [setState],
  );

  useEffect(() => {
    if (state !== "pay") return;
    let active = true;
    void fetchShareIntent(view.travelerId).then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
  }, [state, view.travelerId, applyResult]);

  const retryIntent = () => {
    setIntent({ status: "loading" });
    void fetchShareIntent(view.travelerId).then(applyResult);
  };

  const amount = `${view.currency} ${view.amount.toFixed(Number.isInteger(view.amount) ? 0 : 2)}`;
  const deadline = view.paymentDeadline
    ? new Date(view.paymentDeadline).toLocaleString(locale, { dateStyle: "long", timeStyle: "short" })
    : null;
  const name = view.organizerFirstName;

  return (
    <div className="min-h-screen bg-ground" data-component="ShareCheckoutPage">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12">
        <div
          className={cn(
            "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-md",
            "ring-1 ring-gray-100",
          )}
        >
          {state === "pay" ? (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="font-barlow-condensed text-4xl font-bold uppercase text-ink">{copy.title}</h1>
                <p className="text-sm text-gray-500">{copy.description.replace("{name}", name)}</p>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
                <span className="text-sm font-medium text-neutral-500">{copy.amountLabel}</span>
                <span className="font-barlow-condensed text-3xl font-bold text-ink">{amount}</span>
              </div>
              {deadline ? (
                <p className="text-sm text-neutral-700">{copy.deadline.replace("{date}", deadline)}</p>
              ) : null}
              {intent.status === "loading" ? (
                <p aria-busy="true" className="flex items-center gap-2 text-sm" role="status">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  {copy.loading}
                </p>
              ) : intent.status === "error" ? (
                <div role="alert" className="flex flex-col items-start gap-3">
                  <p className="text-sm text-red-700">{copy.errorMessage}</p>
                  <Button onClick={retryIntent} type="button" variant="secondary">
                    {copy.retry}
                  </Button>
                </div>
              ) : (
                <Elements
                  key={intent.clientSecret}
                  options={{
                    appearance: stripeAppearance,
                    clientSecret: intent.clientSecret,
                    locale: (locale === "en" ? "en" : "es") as StripeElementLocale,
                  }}
                  stripe={stripe}
                >
                  <StripePaymentForm
                    billingCity=""
                    billingCountry=""
                    billingEmail={view.billingEmail}
                    billingLine1=""
                    billingName={view.billingName}
                    billingPhone=""
                    billingPostalCode=""
                    billingState=""
                    copy={paymentCopy}
                    onBeforeConfirm={async () => true}
                    onCancel={() => router.back()}
                    onProcessingChange={() => {}}
                    onRetry={retryIntent}
                    returnPath={`/checkout/share/${encodeURIComponent(view.travelerId)}`}
                  />
                </Elements>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3" role="status">
              <h1 className="font-barlow-condensed text-4xl font-bold uppercase text-ink">
                {state === "paid" ? copy.paidTitle : copy.closedTitle}
              </h1>
              <p className="text-sm text-gray-500">
                {state === "paid" ? copy.paidDescription : copy.closedDescription.replace("{name}", name)}
              </p>
              <Button asChild className="self-start" variant="secondary">
                <Link href={`/${locale}/dashboard`}>{copy.toTrips}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
