"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { TripDetailsHero } from "@/components/app/dashboard/traveler/TripDetailsHero";
import { Button } from "@/components/ui/Button";
import RemovableTag from "@/components/RemovableTag";
import { StatusBadge } from "@/components/app/admin/StatusBadge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Moon,
  Star,
  CreditCard,
  Eye,
  CheckCircle,
  Info,
} from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { ADDONS } from "@/lib/data/shared/addons-catalog";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { JourneyFilterKey } from "@/lib/constants/journey-filters";
import {
  TravelerRosterSection,
  type TravelerRosterSectionHandle,
} from "@/components/app/travelers/TravelerRosterSection";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type { TravelerRoster } from "@/types/traveler";
import type { TripDetailsData } from "@/types/tripDetails";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { paymentTotalsInputFromTripRequest } from "@/lib/helpers/trip-request-pricing";
import { getLevelName } from "@/lib/utils/levels";

interface TripDetails {
  id: string;
  type: string;
  level: string;
  status: string;
  from: string;

  // Logistics
  originCountry: string;
  originCity: string;
  startDate: string;
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
  payment?: {
    id: string;
    status: string;
    amount: number;
    provider: string;
    providerPaymentId?: string;
    createdAt: string;
    paidAt?: string | null;
  };

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
                <Link href={`/${locale}/dashboard/traveler`}>
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
    const valueLabel = selectedOption?.label ?? f.value;
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

  // Pricing fields were dropped from TripRequest — recompute live totals from
  // stored type/level/filters/addons (same helper the dashboard trip list uses),
  // and prefer the actually-charged Payment.amount as the authoritative total
  // when one exists.
  const pax = Math.max(1, trip.pax || 1);
  const paymentInput = paymentTotalsInputFromTripRequest({
    accommodationType: trip.accommodationType,
    addons: addonsList,
    arrivePref: trip.arrivePref,
    avoidDestinations: trip.avoidDestinations,
    city: trip.originCity,
    climate: trip.climate,
    country: trip.originCountry,
    departPref: trip.departPref,
    level: trip.level,
    maxTravelTime: trip.maxTravelTime,
    nights: trip.nights,
    pax,
    transport: trip.transport,
    type: trip.type,
  });
  const totals = paymentInput ? calculatePaymentTotals(paymentInput) : null;
  const basePriceTotal = (totals?.basePerPax ?? 0) * pax;
  const filtersCostTotal = (totals?.filtersPerPax ?? 0) * pax;
  const addonsCostTotal =
    ((totals?.addonsPerPax ?? 0) + (totals?.cancelInsurancePerPax ?? 0)) * pax;
  const hasChargedAmount = (trip.payment?.amount ?? 0) > 0;
  const totalTripUsd = hasChargedAmount
    ? (trip.payment?.amount ?? 0)
    : (totals?.totalTrip ?? 0);
  const totalPerPaxUsd = hasChargedAmount
    ? (trip.payment?.amount ?? 0) / pax
    : (totals?.totalPerPax ?? 0);
  const isEstimate = !hasChargedAmount;
  const typeLabel =
    (copy.typeValues as Record<string, string>)[trip.type] ?? trip.type;
  const levelLabel = getLevelName(trip.level);

  return (
    <>
      <TripDetailsHero
        copy={dict.tripItinerary.hero}
        locale={locale}
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

      <Section>
        <div className="max-w-6xl mx-auto text-left">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href={`/${locale}/dashboard/traveler`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {copy.backToDashboard}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Overview */}
              <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
                    {copy.detailsTitle}
                  </h2>
                  <StatusBadge
                    status={trip.status}
                    label={labelFor(copy.status, trip.status)}
                    variant="trip"
                  />
                </div>

                {/* Destination Reveal */}
                {canRevealDestination && (
                  <div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-violet-50 p-4">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 shrink-0 text-violet-700" />
                      <div>
                        <h3 className="font-semibold text-violet-900">
                          {copy.destinationRevealedTitle}
                        </h3>
                        <p className="text-sm text-violet-700">
                          {trip.actualDestination}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full border-0 shadow-sm"
                      asChild
                    >
                      <Link href={`/${locale}/dashboard/trips/${trip.id}/reveal`}>
                        {copy.viewRevelationAction}
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Logistics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        {copy.departureFromLabel}
                      </span>
                    </div>
                    <p className="font-medium text-neutral-900">
                      {trip.originCity}, {trip.originCountry}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        {copy.passengersLabel}
                      </span>
                    </div>
                    <p className="font-medium text-neutral-900">{trip.pax}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        {copy.datesLabel}
                      </span>
                    </div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {new Date(trip.startDate).toLocaleDateString()} →{" "}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Moon className="h-4 w-4 text-neutral-500" />
                      <span className="text-xs text-neutral-600">
                        {copy.nightsLabel}
                      </span>
                    </div>
                    <p className="font-medium text-neutral-900">
                      {trip.nights}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invite your travel friends / traveler roster */}
              {trip.roster && trip.roster.cap > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                  <TravelerRosterSection
                    copy={dict.inviteTravelers}
                    locale={hasLocale(locale) ? (locale as Locale) : "es"}
                    ref={rosterRef}
                    roster={trip.roster}
                  />
                  {!trip.roster.locked && (
                    <div className="mt-6">
                      <Button
                        disabled={savingTravelers}
                        onClick={() => void handleSaveTravelers()}
                        size="lg"
                        variant="default"
                      >
                        {savingTravelers
                          ? dict.inviteTravelers.savingAction
                          : dict.inviteTravelers.saveAction}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Filters & Preferences */}
              <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                <h3 className="mb-4 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
                  {copy.filtersTitle} ({filterChips.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterChips.map((chip, index) => (
                    <RemovableTag
                      color="primary"
                      item={{
                        key: chip.category ?? String(index),
                        label: chip.category,
                        value: chip.value,
                      }}
                      key={index}
                      size="md"
                    />
                  ))}
                </div>

                {trip.avoidDestinations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-neutral-700 mb-2">
                      {copy.avoidDestinationsLabel}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trip.avoidDestinations.map((dest, index) => (
                        <RemovableTag
                          key={index}
                          item={{
                            key: dest,
                            label: copy.cityChipLabel,
                            value: dest,
                          }}
                          color="secondary"
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              {addonChips.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                  <h3 className="mb-4 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
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
                </div>
              )}

              {/* Customer Review */}
              {trip.customerRating && (
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                  <h3 className="mb-4 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
                    {copy.reviewTitle}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < (trip.customerRating || 0)
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="font-semibold text-neutral-900">
                      {(trip.customerRating ?? 0).toFixed(1)}
                    </span>
                  </div>
                  {trip.customerFeedback && (
                    <p className="text-neutral-700">{trip.customerFeedback}</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Summary */}
              <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                <h3 className="mb-4 font-barlow-condensed text-lg font-extrabold uppercase leading-none text-gray-900">
                  {copy.costsTitle}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-neutral-600">
                      {copy.basePriceLabel}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      ${basePriceTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-neutral-600">
                      {copy.filtersCostLabel}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      ${filtersCostTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-neutral-600">
                      {copy.addonsCostLabel}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      ${addonsCostTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      {copy.totalTripLabel}
                      {isEstimate && (
                        <span className="ml-1 text-xs font-normal text-neutral-400">
                          {copy.estimateNote}
                        </span>
                      )}
                    </span>
                    <span className="text-xl font-bold text-light-blue">
                      ${totalTripUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-neutral-600">
                    <span>{copy.perPersonLabel}</span>
                    <span className="font-medium">
                      ${totalPerPaxUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {trip.payment && (
                <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                  <h3 className="mb-4 font-barlow-condensed text-lg font-extrabold uppercase leading-none text-gray-900">
                    {copy.paymentInfoTitle}
                  </h3>
                  <div className="space-y-3">
                    <StatusBadge
                      status={trip.payment.status}
                      label={labelFor(copy.paymentStatus, trip.payment.status)}
                      variant="payment"
                    />

                    <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">
                          {copy.amountLabel}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          ${(trip.payment?.amount ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">
                          {copy.providerLabel}
                        </span>
                        <span className="font-medium text-neutral-900 capitalize">
                          {trip.payment.provider}
                        </span>
                      </div>
                      {trip.payment.providerPaymentId && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">
                            {copy.paymentIdLabel}
                          </span>
                          <span className="font-mono text-xs text-neutral-900">
                            {trip.payment.providerPaymentId.slice(0, 12)}...
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-neutral-600">
                          {copy.dateLabel}
                        </span>
                        <span className="text-neutral-900">
                          {new Date(
                            trip.payment.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trip Timeline */}
              <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                <h3 className="mb-4 font-barlow-condensed text-lg font-extrabold uppercase leading-none text-gray-900">
                  {copy.timelineTitle}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {copy.tripCreatedLabel}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {trip.payment?.paidAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {copy.paymentConfirmedLabel}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(trip.payment.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {trip.destinationRevealedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <Eye className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {copy.timelineDestinationRevealedLabel}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(
                            trip.destinationRevealedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {trip.completedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {copy.tripCompletedLabel}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(trip.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                <h3 className="mb-4 font-barlow-condensed text-lg font-extrabold uppercase leading-none text-gray-900">
                  {copy.actionsTitle}
                </h3>
                <div className="space-y-3">
                  {trip.status === "COMPLETED" && !trip.customerRating && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {dict.tripReview.emailHintTitle}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {dict.tripReview.emailHint}
                      </p>
                    </div>
                  )}

                  {(trip.status === "CONFIRMED" ||
                    trip.status === "REVEALED" ||
                    trip.status === "COMPLETED") && (
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={`/${locale}/dashboard/trips/${trip.id}/reveal`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        {copy.viewItineraryAction}
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={`/${locale}/dashboard/traveler`}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {copy.backToDashboard}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Trip Info Card */}
              <div className="rounded-2xl bg-light-blue/5 p-6 ring-1 ring-light-blue/20">
                <h3 className="mb-2 flex items-center gap-2 font-barlow-condensed text-lg font-extrabold uppercase leading-none text-light-blue">
                  <Info className="h-4 w-4" />
                  {copy.tripInfoTitle}
                </h3>
                <ul className="text-sm text-neutral-700 space-y-2">
                  <li>
                    • {copy.typeLabel}: <strong>{typeLabel}</strong>
                  </li>
                  <li>
                    • {copy.levelLabel}: <strong>{levelLabel}</strong>
                  </li>
                  {trip.status === "CONFIRMED" && <li>• {copy.confirmedHint}</li>}
                  {trip.status === "REVEALED" && <li>• {copy.revealedHint}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>
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
