"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { TripDetailsHeader } from "@/components/app/dashboard/traveler/TripDetailsHeader";
import { Button } from "@/components/ui/Button";
import RemovableTag from "@/components/RemovableTag";
import { StatusBadge } from "@/components/app/admin/StatusBadge";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { ADDONS } from "@/lib/data/shared/addons-catalog";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { JourneyFilterKey } from "@/lib/constants/journey-filters";
import {
  TravelerRosterSection,
  type TravelerRosterSectionHandle,
} from "@/components/app/travelers/TravelerRosterSection";
import { BuyerTravelDocumentsSection } from "@/components/app/travelers/BuyerTravelDocumentsSection";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type { TravelerRoster } from "@/types/traveler";
import type { TripDetailsData, TripPaymentSummary } from "@/types/tripDetails";
import type { BuyerDocumentsSnapshot } from "@/types/documents";
import { getTripCostDisplay } from "@/lib/helpers/trip-cost-display";
import { TripCostSummary } from "@/components/app/dashboard/traveler/TripCostSummary";
import { hasMissingTravelerDetails } from "@/lib/travelers/travelerPolicy";
import { getLevelName } from "@/lib/utils/levels";
import { isAwaitingReveal } from "@/lib/utils/trips";
import { resolveTripTransportLabel } from "@/lib/helpers/transport";
import { resolveExcuseSelectionLabels } from "@/lib/helpers/excuse-helper";
import { travelerTypeOf } from "@/lib/db/tripRequestFamily";
import { PanelCard } from "@/components/common/PanelCard";
import { TripPaymentCard } from "@/components/app/dashboard/traveler/TripPaymentCard";
import type { PaymentStatus } from "@prisma/client";
import { SETTLED_PAYMENT_STATUSES } from "@/lib/payments/settledStatuses";
import { TripStatusBar } from "@/components/app/dashboard/traveler/TripStatusBar";
import { TripSetupSummary } from "@/components/app/dashboard/traveler/TripSetupSummary";
import { TripTimeline } from "@/components/app/dashboard/traveler/TripTimeline";
import { TripRevealCountdown } from "@/components/app/dashboard/traveler/TripRevealCountdown";
import { buildTripTimeline } from "@/components/app/dashboard/traveler/tripDetailsHelpers";

interface TripDetails extends BuyerDocumentsSnapshot {
  /**
   * The viewer's relation to the trip. A `companion` payload arrives without
   * price/payment data and with a reduced roster (see GET /api/trips/[id]).
   */
  role?: "buyer" | "companion";
  basePriceUsd?: number;
  id: string;
  type: string;
  level: string;
  status: string;
  from: string;
  excuseKey?: string | null;
  refineDetails?: string[];

  // Logistics
  originCountry: string;
  originCity: string;
  startDate: string;
  /** IANA zone the start date is interpreted in; drives the reveal countdown. */
  departureTimeZone?: string | null;
  endDate: string;
  nights: number;
  pax: number;

  // Filters
  transport: string;
  accommodationType?: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  avoidDestinations: string[];

  // Addons
  addons: any;

  // Assigned experience (present once admin assigns a package — may
  // predate the reveal window per design.md ADR-6).
  experience?: TripDetailsData["experience"];

  // Completed trip data
  actualDestination?: string | null;
  destinationRevealedAt?: string | null;
  completedAt?: string | null;
  customerRating?: number | null;
  customerFeedback?: string | null;

  // Relations
  payment?: TripPaymentSummary & { id: string };

  createdAt: string;
  updatedAt: string;

  // Companion travelers roster
  roster: TravelerRoster;
}

function labelFor(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

function TripDetailsContent() {
  const params = useParams();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [dict, setDict] = useState<MarketingDictionary | null>(null);
  const rosterRef = useRef<TravelerRosterSectionHandle>(null);
  const [savingTravelers, setSavingTravelers] = useState(false);

  const tripId = params.id as string;
  const locale = (params.locale as string) ?? "es";

  async function handleSaveTravelers() {
    if (savingTravelers) return;
    setSavingTravelers(true);
    try {
      await rosterRef.current?.saveAll();
    } finally {
      setSavingTravelers(false);
    }
  }

  useEffect(() => {
    getDictionary(locale).then(setDict);
  }, [locale]);

  useEffect(() => {
    async function fetchTripDetails() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/trips/${tripId}`);
        const data = await response.json();

        if (data.error) {
          console.error("Error fetching trip:", data.error);
          return;
        }

        setTrip(data.trip);
      } catch (error) {
        console.error("Error fetching trip details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTripDetails();
  }, [tripId, session?.user?.id]);

  if (loading || !dict) {
    return <LoadingSpinner />;
  }

  const copy = dict.tripDetail;

  if (!trip) {
    return (
      <>
        <HeaderHero
          className="h-[40vh]!"
          description={copy.notFoundDescription}
          fallbackImage="/images/hero-image-1.jpeg"
          title={copy.notFoundTitle}
          videoSrc="/videos/hero-video-1.mp4"
        />
        <Section>
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl bg-white p-8 shadow-md ring-1 ring-gray-100">
              <p className="text-neutral-600 mb-6">
                {copy.notFoundDescription}
              </p>
              <Button asChild>
                <Link href={`/${locale}/dashboard/traveler/trips`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {copy.backToDashboard}
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </>
    );
  }

  const filterOptions = dict.journey?.preferencesStep?.filterOptions;
  const filterChips = [
    { key: "transport" as JourneyFilterKey, value: trip.transport },
    ...(trip.accommodationType && trip.accommodationType !== "any"
      ? [
          {
            key: "accommodationType" as JourneyFilterKey,
            value: trip.accommodationType,
          },
        ]
      : []),
    { key: "climate" as JourneyFilterKey, value: trip.climate },
    { key: "maxTravelTime" as JourneyFilterKey, value: trip.maxTravelTime },
    { key: "departPref" as JourneyFilterKey, value: trip.departPref },
    { key: "arrivePref" as JourneyFilterKey, value: trip.arrivePref },
  ].map((f) => {
    const optionDef = filterOptions?.[f.key];
    const categoryLabel = optionDef?.label ?? f.key;
    const selectedOption = optionDef?.options?.find((o) => o.key === f.value);
    const regularLabel = selectedOption?.label ?? f.value;
    const valueLabel =
      f.key === "transport"
        ? (resolveTripTransportLabel(
            trip.type,
            trip.transport,
            dict.tripTransport.ownCar,
            regularLabel,
          ) ?? regularLabel)
        : regularLabel;
    return {
      category: categoryLabel,
      value: valueLabel,
    };
  });

  const addonsList = Array.isArray(trip.addons) ? trip.addons : [];
  const addonChips = addonsList
    .map((addon: any) => {
      const addonData = ADDONS.find((a) => a.id === addon.id);
      if (!addonData) return null;

      return {
        id: addon.id,
        category: addonData.category,
        value:
          addon.qty > 1 ? `${addonData.title} ×${addon.qty}` : addonData.title,
      };
    })
    .filter(Boolean);

  const canRevealDestination =
    trip.status === "REVEALED" || trip.status === "COMPLETED";

  const isCompanion = trip.role === "companion";
  // A companion edits only their own row; the Save button follows that row.
  // Their documents are their live profile (linked = live), editable even
  // after the roster locks, so their own row always keeps a Save button.
  const ownRow = trip.roster?.travelers.find((t) => t.isSelf);
  const rosterEditable = isCompanion
    ? Boolean(ownRow)
    : !trip.roster?.locked ||
      trip.roster.travelers.some(hasMissingTravelerDetails);

  // The buyer's own documents: paid trips only (checkout collects them
  // before payment). Linked = live: they are the buyer's profile documents,
  // so no roster lock applies; only a cancelled trip is read-only (the same
  // rule as the buyer-documents route).
  const showBuyerDocuments =
    !isCompanion && trip.payment?.status === "APPROVED";
  const buyerDocumentsReadOnly = trip.status === "CANCELLED";

  const paymentSettled =
    !!trip.payment &&
    SETTLED_PAYMENT_STATUSES.includes(trip.payment.status as PaymentStatus);
  const price = getTripCostDisplay({
    ...trip,
    addons: addonsList,
    city: trip.originCity,
    country: trip.originCountry,
  });
  const typeLabel =
    (copy.typeValues as Record<string, string>)[trip.type] ?? trip.type;
  const levelLabel = getLevelName(trip.level);
  const excuse = resolveExcuseSelectionLabels({
    travelerType: travelerTypeOf(trip),
    excuseKey: trip.excuseKey,
    refineDetails: trip.refineDetails,
    localizedExcuses: dict.journey?.excuses,
    localizedRefineOptions: dict.journey?.refineDetailOptions,
  });

  return (
    <>
      <TripDetailsHeader
        backHref={`/${locale}/dashboard/traveler/trips`}
        copy={copy}
        heroCopy={dict.tripItinerary.hero}
        locale={locale}
        statusBar={
          <TripStatusBar
            description={labelFor(copy.statusDescriptions, trip.status)}
            label={labelFor(copy.status, trip.status)}
            status={trip.status}
          />
        }
        revealHref={
          canRevealDestination
            ? `/${locale}/dashboard/trips/${trip.id}/destination`
            : undefined
        }
        trip={{
          id: trip.id,
          status: trip.status,
          startDate: trip.startDate,
          endDate: trip.endDate,
          nights: trip.nights,
          pax: trip.pax,
          type: trip.type,
          originCity: trip.originCity,
          originCountry: trip.originCountry,
          actualDestination: trip.actualDestination ?? null,
          destinationRevealedAt: trip.destinationRevealedAt ?? null,
          experience: trip.experience ?? null,
        }}
      />

      {isAwaitingReveal(trip.status) && trip.startDate && (
        <TripRevealCountdown
          copy={dict.tripReveal}
          departureTimeZone={trip.departureTimeZone}
          startDate={trip.startDate}
        />
      )}

      <div className="bg-ground">
        <div className="rt-container py-8 md:py-10">
          <div className="mx-auto max-w-6xl text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Invite your travel friends / traveler roster */}
                {trip.roster && trip.roster.cap > 0 && (
                  <PanelCard>
                    <TravelerRosterSection
                      copy={dict.inviteTravelers}
                      locale={hasLocale(locale) ? (locale as Locale) : "es"}
                      ref={rosterRef}
                      roster={trip.roster}
                    />
                    {rosterEditable && (
                      <div className="mt-6">
                        <Button
                          aria-busy={savingTravelers}
                          disabled={savingTravelers}
                          onClick={() => void handleSaveTravelers()}
                          size="sm"
                          variant="default"
                        >
                          {savingTravelers && (
                            <Loader2
                              aria-hidden
                              className="h-4 w-4 animate-spin"
                            />
                          )}
                          {savingTravelers
                            ? dict.inviteTravelers.savingAction
                            : dict.inviteTravelers.saveAction}
                        </Button>
                      </div>
                    )}
                  </PanelCard>
                )}

                {showBuyerDocuments && (
                  <PanelCard>
                    <BuyerTravelDocumentsSection
                      copy={copy.buyerDocuments}
                      errorCopy={dict.journey.checkout.errors}
                      initialValue={{
                        nationalities: trip.buyerNationalities ?? [],
                        visas: trip.buyerVisas ?? [],
                      }}
                      locale={locale}
                      readOnly={buyerDocumentsReadOnly}
                      tripId={trip.id}
                    />
                  </PanelCard>
                )}

                {/* Your trip: type, level, excuse, filters */}
                <TripSetupSummary
                  avoidDestinations={trip.avoidDestinations}
                  copy={copy}
                  excuse={excuse}
                  filters={filterChips.map((chip) => ({
                    label: chip.category,
                    value: chip.value,
                  }))}
                  items={[
                    { label: copy.typeLabel, value: typeLabel },
                    { label: copy.levelLabel, value: levelLabel },
                  ]}
                />

                {/* Add-ons */}
                {addonChips.length > 0 && (
                  <PanelCard>
                    <h3 className="font-barlow-condensed text-3xl font-bold uppercase leading-none text-ink">
                      {copy.addonsTitle} ({addonChips.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {addonChips.map((addon: any, index: number) => (
                        <RemovableTag
                          key={index}
                          item={{
                            key: addon.id,
                            label: addon.category,
                            value: addon.value,
                          }}
                          color="success"
                          size="md"
                        />
                      ))}
                    </div>
                  </PanelCard>
                )}

                {/* Customer Review */}
                {trip.customerRating && (
                  <PanelCard>
                    <h3 className="font-barlow-condensed text-3xl font-bold uppercase leading-none text-ink">
                      {copy.reviewTitle}
                    </h3>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < (trip.customerRating || 0)
                              ? "text-feature fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="font-semibold text-ink">
                        {(trip.customerRating ?? 0).toFixed(1)}
                      </span>
                    </div>
                    {trip.customerFeedback && (
                      <p className="text-neutral-700">
                        {trip.customerFeedback}
                      </p>
                    )}
                  </PanelCard>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Trip Timeline */}
                <TripTimeline
                  completedNote={
                    trip.status === "COMPLETED" && !trip.customerRating
                      ? dict.tripReview.emailHint
                      : undefined
                  }
                  copy={copy}
                  locale={locale}
                  steps={buildTripTimeline(
                    { ...trip, paidAt: trip.payment?.paidAt ?? null },
                    new Date(),
                  )}
                />

                {/* The estimate until the trip is paid; then the payment card says it. */}
                {!isCompanion && !paymentSettled && (
                  <TripCostSummary copy={copy} price={price} />
                )}

                {/* Payment (never sent to companions) */}
                {!isCompanion && trip.payment && (
                  <TripPaymentCard
                    copy={copy}
                    locale={locale}
                    payment={trip.payment}
                    perPerson={paymentSettled ? price.perPerson : undefined}
                    receiptHref={
                      paymentSettled
                        ? `/api/trips/${trip.id}/receipt`
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const TripDetailsPage = dynamic(
  () => Promise.resolve(TripDetailsPageComponent),
  {
    ssr: false,
  },
);

function TripDetailsPageComponent() {
  return (
    <SecureRoute>
      <TripDetailsContent />
    </SecureRoute>
  );
}

export default TripDetailsPage;
