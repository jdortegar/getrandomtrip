"use client";

import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementLocale } from "@stripe/stripe-js";
import { Calendar, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckoutIconValueCard } from "@/components/app/checkout/CheckoutIconValueCard";
import { StripePaymentForm } from "@/components/app/checkout/StripePaymentForm";
import Img from "@/components/common/Img";
import HeaderHero from "@/components/journey/HeaderHero";
import { getTripExperienceDisplay } from "@/lib/helpers/dashboard-trip-display";
import { formatDatesSummary } from "@/lib/helpers/formatDatesSummary";
import type { Trip } from "@/lib/utils/trips";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { stripeAppearance } from "@/lib/stripe-appearance";
import { fetchShareIntent, type IntentResult } from "@/lib/payments/share-intent-client";
import { getStripePromise } from "@/lib/stripe-client";
import { cn } from "@/lib/utils";
import type { ShareCheckoutState, ShareCheckoutView } from "@/types/payments";

interface ShareCheckoutPageClientProps {
  checkoutCopy: Dictionary["journey"]["checkout"];
  copy: Dictionary["shareCheckout"];
  summary: Dictionary["journey"]["summary"];
  locale: string;
  paymentCopy: Parameters<typeof StripePaymentForm>[0]["copy"];
  view: ShareCheckoutView;
}

type Intent =
  | { status: "loading" }
  | { status: "ready"; clientSecret: string }
  | { status: "error" };

const SHARE_CLOSED_CODES = ["DEADLINE_PASSED", "NOT_COLLECTING"];

export function ShareCheckoutPageClient({
  checkoutCopy,
  copy,
  summary,
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
    void fetchShareIntent("/api/stripe/share-intent", { travelerId: view.travelerId }, SHARE_CLOSED_CODES).then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
  }, [state, view.travelerId, applyResult]);

  const retryIntent = () => {
    setIntent({ status: "loading" });
    void fetchShareIntent("/api/stripe/share-intent", { travelerId: view.travelerId }, SHARE_CLOSED_CODES).then(applyResult);
  };

  const amount = `${view.currency} ${view.amount.toFixed(Number.isInteger(view.amount) ? 0 : 2)}`;
  const deadline = view.paymentDeadlineLabel;
  const maxTopUp = `${view.currency} ${view.maxTopUp.toFixed(Number.isInteger(view.maxTopUp) ? 0 : 2)}`;
  const name = view.organizerFirstName;

  const experience = getTripExperienceDisplay(
    { type: view.trip.type, level: view.trip.level } as Trip,
    locale,
  );
  const dates =
    view.trip.startDate && view.trip.nights > 0
      ? formatDatesSummary(view.trip.startDate, view.trip.nights, summary.dateRangeTemplate, summary.monthsShort)
      : summary.emptyValue;
  const origin =
    view.trip.originCity && view.trip.originCountry
      ? `${view.trip.originCity}, ${view.trip.originCountry}.`
      : summary.emptyValue;
  const cardClass = cn("flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-md", "ring-1 ring-gray-100");

  return (
    <div className="min-h-screen bg-ground" data-component="ShareCheckoutPage">
      <HeaderHero
        description={copy.description.replace("{name}", name)}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle=""
        title={copy.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <div className="container mx-auto px-4 py-12 md:px-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className={cardClass} data-component="ShareCheckoutTripCard">
            <h2 className="font-barlow-condensed text-4xl font-bold uppercase">{checkoutCopy.travelDetailsTitle}</h2>
            <div className="flex gap-4">
              {experience.typeImageSrc ? (
                <div className="h-40 w-32 shrink-0 overflow-hidden rounded-2xl">
                  <Img
                    alt={experience.travelerTypeTitle}
                    className="h-full w-full object-cover"
                    height={160}
                    src={experience.typeImageSrc}
                    width={128}
                  />
                </div>
              ) : null}
              <div className="flex flex-col justify-center gap-1">
                <p className="font-barlow text-2xl font-bold">
                  <span>{summary.travelTypeSection}</span>
                  <span className="px-1.5">{checkoutCopy.travelTypeTitleSeparator}</span>
                  <span className="text-sky-600">{experience.travelerTypeTitle}</span>
                </p>
                <p className="font-barlow text-lg font-normal text-gray-500">
                  {summary.experienceSection} <span className="font-bold">{experience.levelName}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CheckoutIconValueCard
                icon={<MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />}
                title={summary.originSection}
                value={origin}
              />
              <CheckoutIconValueCard
                icon={<Calendar aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />}
                title={summary.datesSection}
                value={dates}
              />
            </div>
          </div>

          <div className={cardClass} data-component="ShareCheckoutPaymentCard">
            {state === "pay" ? (
              <>
                <h2 className="font-barlow-condensed text-4xl font-bold uppercase">{checkoutCopy.paymentTitle}</h2>
                <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
                  <span className="text-sm font-medium text-neutral-500">{copy.amountLabel}</span>
                  <span className="font-barlow-condensed text-3xl font-bold text-ink">{amount}</span>
                </div>
                {deadline ? (
                  <p className="text-sm text-neutral-700">{copy.deadline.replace("{date}", deadline)}</p>
                ) : null}
                <p className="text-xs leading-relaxed text-neutral-600">
                  {view.maxTopUp > 0 ? copy.disclaimer.replace("{max}", maxTopUp) : copy.disclaimerNoCost}
                </p>
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
                <h2 className="font-barlow-condensed text-4xl font-bold uppercase text-ink">
                  {state === "paid" ? copy.paidTitle : copy.closedTitle}
                </h2>
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
    </div>
  );
}
