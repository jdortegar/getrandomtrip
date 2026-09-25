"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Loader2, MapPin } from "lucide-react";

import { CheckoutContactCard } from "@/components/app/checkout/CheckoutContactCard";
import {
  CheckoutTravelDetailsCard,
  type CheckoutIconDetailRow,
} from "@/components/app/checkout/CheckoutTravelDetailsCard";
import ChatFab from "@/components/chrome/ChatFab";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import {
  TRANSPORT_ICONS,
  TRANSPORT_OPTIONS,
} from "@/components/journey/TransportSelector";
import { useUserStore } from "@/store/slices/userStore";
import { ADDONS } from "@/lib/data/shared/addons-catalog";
import { FILTER_OPTIONS } from "@/store/slices/journeyStore";
import type { Logistics, Filters } from "@/store/slices/journeyStore";
import {
  applyPaxMultiplier,
  getBasePricePerPerson,
} from "@/lib/data/traveler-types";
import { getCardForType, getLevelById } from "@/lib/utils/experiencesData";
import { formatUSD } from "@/lib/format";
import {
  getExcuseOptions,
  getExcuseTitle,
  getHasExcuseStep,
} from "@/lib/helpers/excuse-helper";
import {
  DEFAULT_PAX_DETAILS,
  paxDetailsEquals,
} from "@/lib/helpers/pax-details";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import type { CheckoutFormFields, CheckoutTripFromApi } from "@/types/Checkout";
import type { XsedTravelType } from "@/types/core";
import { Button } from "@/components/ui/Button";
import { useCheckoutQuote } from "@/hooks/useCheckoutQuote";
import { calculatePaymentTotals } from "@/lib/helpers/payment-totals";
import { getCheckoutLevel, getCheckoutPaxDetails, getFixedCheckoutParty } from "@/lib/helpers/checkout-party";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { toast } from "sonner";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import {
  pickCheckoutTrip,
  CHECKOUT_TRIP_STATUSES,
} from "@/lib/helpers/checkout-trip";
import { AMERICAN_COUNTRIES } from "@/lib/data/shared/countries";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { getFiltersCostBreakdown } from "@/lib/pricing";
import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";

const usd = (n: number) => `USD ${n.toFixed(Number.isInteger(n) ? 0 : 2)}`;

/** Converts a stored country value (full name or code) to a 2-letter ISO code. */
function normalizeCountryToCode(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (AMERICAN_COUNTRIES.some((c) => c.code === upper)) return upper;
  const byName = AMERICAN_COUNTRIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return byName ? byName.code : "";
}

const DEFAULT_CHECKOUT_FILTERS: Filters = {
  accommodationType: "any",
  arrivePref: "any",
  avoidDestinations: [],
  climate: "any",
  departPref: "any",
  maxTravelTime: "no-limit",
  transport: "plane",
};

function normalizeLevelForCatalog(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace("explora+", "explora-plus");
  if (normalized === "exploraplus") return "explora-plus";
  if (normalized === "modoexplora" || normalized === "explora")
    return "modo-explora";
  return normalized || undefined;
}

function getFilterLabel(
  group: keyof typeof FILTER_OPTIONS,
  key: string,
  filterOptions?: Record<
    string,
    { options: Array<{ key: string; label: string }> }
  >,
): string {
  const fromDict = filterOptions?.[group]?.options?.find(
    (o) => o.key === key,
  )?.label;
  return fromDict ?? key;
}

function formatDatesSummary(
  startDate: string,
  nights: number,
  template: string,
  monthsShort: string[],
): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = monthsShort[start.getMonth()] ?? "";
  const endMonth = monthsShort[end.getMonth()] ?? "";
  return template
    .replace("{startDay}", String(startDay))
    .replace("{endDay}", String(endDay))
    .replace("{startMonth}", startMonth)
    .replace("{endMonth}", endMonth);
}

function getBasePriceFromCatalog(
  travelType: string | null,
  experience: string | null,
): number {
  const type = travelType || "couple";
  return getBasePricePerPerson(type, experience);
}

function normalizeTripType(type: string): string {
  return type.trim().toLowerCase();
}

function logisticsFromTrip(trip: CheckoutTripFromApi, pax: number): Logistics {
  return {
    city: trip.originCity,
    country: trip.originCountry,
    endDate: trip.endDate ? new Date(trip.endDate) : undefined,
    nights: trip.nights,
    pax,
    startDate: trip.startDate ? new Date(trip.startDate) : undefined,
  };
}

function filtersFromTrip(trip: CheckoutTripFromApi): Filters {
  return {
    accommodationType: trip.accommodationType ?? "any",
    arrivePref: trip.arrivePref,
    avoidDestinations: trip.avoidDestinations ?? [],
    climate: trip.climate,
    departPref: trip.departPref,
    maxTravelTime: trip.maxTravelTime,
    transport: trip.transport,
  };
}

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripIdParam = searchParams.get("tripId");
  const hasTripId = Boolean(tripIdParam?.trim());
  const locale = (params?.locale as string) ?? "es";
  const resolvedLocale = hasLocale(locale) ? locale : "es";

  const { data: session, status } = useSession();
  const { isAuthed } = useUserStore();

  const [dict, setDict] = useState<Dictionary | null>(null);
  const [trip, setTrip] = useState<CheckoutTripFromApi | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [promocode, setPromocode] = useState("");
  const [showPromocodeInput, setShowPromocodeInput] = useState(false);
  const payment = useCheckoutQuote(!tripLoading && trip && trip.id === tripIdParam?.trim() ? trip.id : undefined);
  const paxDetails = payment.quote?.paxDetails ?? (trip ? getCheckoutPaxDetails(trip) : DEFAULT_PAX_DETAILS);
  const checkoutLevel = payment.quote?.level ?? (trip ? getCheckoutLevel(trip) : "");
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmingRef = useRef(false);
  const appliedPromocode = payment.promoCode;
  const promoDiscount = payment.quote?.discountAmount ?? 0;
  const promoLoading = payment.pending || isConfirming;
  const promoError = payment.error;
  const clientSecret = payment.isReady() ? payment.quote?.clientSecret ?? null : null;
  const contactFormRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<CheckoutFormFields>({
    city: "",
    country: "",
    idDocument: "",
    name: "",
    phone: "",
    state: "",
    street: "",
    zipCode: "",
  });

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  useEffect(() => {
    if (hasTripId) return;
    router.replace(pathForLocale(resolvedLocale, "/dashboard"));
  }, [hasTripId, resolvedLocale, router]);

  useEffect(() => {
    if (session?.user && status === "authenticated") {
      const addr = session.user.address ?? {};
      setFormData((prev) => ({
        city: addr.city || prev.city,
        country: normalizeCountryToCode(addr.country) || prev.country,
        idDocument: addr.idDocument || prev.idDocument,
        name: session.user?.name || prev.name,
        phone: session.user?.phone || prev.phone,
        state: addr.state || prev.state,
        street: addr.street || prev.street,
        zipCode: addr.zipCode || prev.zipCode,
      }));
    }
  }, [session, status]);

  function handleChange(field: keyof CheckoutFormFields, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleApplyPromocode() {
    const code = promocode.trim().toUpperCase();
    if (!code || !trip?.id || promoLoading || confirmingRef.current) return;
    try {
      await payment.refresh({ promoCode: code });
      setPromocode("");
      setShowPromocodeInput(false);
    } catch { /* The quote error is shown beside payment and promo controls. */ }
  }

  async function handleRemovePromocode() {
    if (!trip?.id || promoLoading || confirmingRef.current) return;
    try { await payment.refresh({ promoCode: null }); }
    catch { /* Keep confirmation blocked until the quote can be refreshed. */ }
  }

  useEffect(() => {
    if (!hasTripId) {
      setTripLoading(false);
      setTrip(null);
      setTripError(null);
      return;
    }
    if (status === "loading") return;
    if (!session?.user?.email) {
      setTripLoading(false);
      setTrip(null);
      setTripError(null);
      return;
    }
    let cancelled = false;
    setTripLoading(true);
    setTripError(null);
    fetch("/api/trips")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setTripError(
            dict?.journey?.checkout?.errors?.loadTripsFailed ?? data.error,
          );
          setTrip(null);
          return;
        }
        const trips = (data.trips ?? []) as CheckoutTripFromApi[];
        const preferredId = tripIdParam?.trim();

        // If the requested trip exists but is already paid, redirect to dashboard
        if (preferredId) {
          const requestedTrip = trips.find((t) => t.id === preferredId);
          if (
            requestedTrip &&
            !CHECKOUT_TRIP_STATUSES.has(requestedTrip.status)
          ) {
            router.replace(pathForLocale(resolvedLocale, "/dashboard"));
            return;
          }
        }

        const byPreferredId = preferredId
          ? trips.find(
              (t) =>
                t.id === preferredId && CHECKOUT_TRIP_STATUSES.has(t.status),
            )
          : undefined;
        const picked = preferredId ? byPreferredId : pickCheckoutTrip(trips);
        if (!picked) {
          setTripError(
            dict?.journey?.checkout?.errors?.noTripToContinue ?? null,
          );
          setTrip(null);
          return;
        }
        setTrip(picked);
        trackCustomEvent({ event: "begin_checkout", trip_type: picked.type });
      })
      .catch(() => {
        if (!cancelled)
          setTripError(dict?.journey?.checkout?.errors?.loadTripFailed ?? null);
      })
      .finally(() => {
        if (!cancelled) setTripLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dict, hasTripId, session?.user?.email, status, tripIdParam]);

  const checkoutPax = trip
    ? Math.max(1, paxDetails.adults + paxDetails.minors)
    : 1;

  const logistics = trip ? logisticsFromTrip(trip, checkoutPax) : null;
  const filters = trip ? filtersFromTrip(trip) : null;
  const filtersResolved = filters ?? DEFAULT_CHECKOUT_FILTERS;
  const addons = {
    selected: Array.isArray(trip?.addons) ? trip!.addons! : [],
  };
  const basePriceUsd = trip
    ? ((trip.type === "xsed" ? undefined : trip.basePriceUsd) ??
      getBasePriceFromCatalog(normalizeTripType(trip.type), checkoutLevel) ??
      0)
    : 0;

  const avoidDestinations = filtersResolved.avoidDestinations ?? [];

  const effectiveLogistics = logistics;

  const previewTotals = calculatePaymentTotals({
    addons,
    avoidCount: avoidDestinations.length,
    basePriceUsd: applyPaxMultiplier(basePriceUsd, trip?.type ?? "", checkoutPax),
    filters: filtersResolved,
    logistics: effectiveLogistics ?? {
      city: "",
      country: "",
      nights: 1,
      pax: 1,
    },
  });

  useEffect(() => {
    if (!hasTripId) return;
    if (status === "loading") return;
    if (!session && !isAuthed) {
      const { openAuth } = useUserStore.getState();
      openAuth("signin");
    }
  }, [hasTripId, session, isAuthed, status]);

  const pax = checkoutPax;
  const filterBreakdown = getFiltersCostBreakdown(
    filtersResolved,
    pax,
    avoidDestinations.length,
  );
  const paymentTotals = payment.quote?.totals ?? previewTotals;
  const {
    addonsPerPax,
    basePerPax,
    cancelInsurancePerPax,
    filtersPerPax,
    totalPerPax,
    totalTrip,
  } = paymentTotals;
  const addonsPerPaxCombined = addonsPerPax + cancelInsurancePerPax;

  const travelType =
    trip?.type != null ? normalizeTripType(trip.type) : undefined;
  const experience = checkoutLevel || undefined;
  const excuse: string | undefined = undefined;
  const refineDetails: string[] = [];
  const startDateParamRaw = trip?.startDate ?? undefined;
  const startDateParam =
    typeof startDateParamRaw === "string" && startDateParamRaw.includes("T")
      ? startDateParamRaw.slice(0, 10)
      : (startDateParamRaw ?? undefined);
  const nightsNum = trip?.nights ?? 1;
  const transport = trip?.transport ?? undefined;
  const departPref = trip?.departPref ?? undefined;
  const arrivePref = trip?.arrivePref ?? undefined;
  const maxTravelTime = trip?.maxTravelTime ?? undefined;
  const climate = trip?.climate ?? undefined;

  const selectedLevel = (() => {
    if (!experience || !travelType) return null;
    const normalized = normalizeLevelForCatalog(experience);
    return (
      getLevelById(travelType, experience, resolvedLocale) ??
      (normalized ? getLevelById(travelType, normalized, resolvedLocale) : null)
    );
  })();
  // Derived from the already-resolved `basePriceUsd` (override-or-catalog,
  // server-resolved on `trip`) so this card's price never disagrees with the
  // total below — only the PAWS pax multiplier is applied client-side.
  const pricePerPerson = applyPaxMultiplier(
    basePriceUsd,
    travelType ?? "",
    pax,
  );
  const selectedTravelTypeInfo = (() => {
    if (!travelType) return null;
    const card = getCardForType(travelType, resolvedLocale);
    return {
      image: card?.img,
      label: card?.title,
      price: selectedLevel ? formatUSD(pricePerPerson) : undefined,
      rating: 7.0,
      reviews: 10,
    };
  })();
  const selectedExperienceInfo = (() => {
    if (!selectedLevel) return null;
    const sum = dict?.journey?.summary;
    return {
      label: travelType === "xsed" ? (dict?.xsedBook.travelType[checkoutLevel as XsedTravelType] ?? selectedLevel.name) : selectedLevel.name,
      price: sum
        ? `${formatUSD(pricePerPerson)} ${sum.experiencePerPerson}`
        : "",
    };
  })();
  const excuseTitleRes = excuse ? getExcuseTitle(excuse) : undefined;
  const refineDetailEntries = (() => {
    if (!excuse || refineDetails.length === 0) return [];
    const options = getExcuseOptions(excuse);
    return refineDetails.map((key) => ({
      key,
      label: options.find((o) => o.key === key)?.label ?? key,
    }));
  })();
  const transportLabel = (() => {
    if (!transport) return undefined;
    const filterOpts = dict?.journey?.preferencesStep?.filterOptions;
    return (
      TRANSPORT_OPTIONS.find((o) => o.id === transport)?.label ??
      getFilterLabel("transport", transport, filterOpts)
    );
  })();
  const TransportIcon = TRANSPORT_ICONS[transport ?? "plane"];

  type FilterKind =
    | "arrivePref"
    | "avoid"
    | "climate"
    | "departPref"
    | "maxTravelTime";
  const sumLabels = dict?.journey?.summary;
  const filterOpts = dict?.journey?.preferencesStep?.filterOptions;
  const activeFilters = (() => {
    const list: {
      id: string;
      kind: FilterKind;
      label: string;
      value?: string;
    }[] = [];
    if (!sumLabels) return list;
    if (departPref && departPref !== "any") {
      list.push({
        id: `depart-${departPref}`,
        kind: "departPref",
        label: `${sumLabels.filterLabelDepart}: ${getFilterLabel("departPref", departPref, filterOpts)}`,
      });
    }
    if (arrivePref && arrivePref !== "any") {
      list.push({
        id: `arrive-${arrivePref}`,
        kind: "arrivePref",
        label: `${sumLabels.filterLabelArrive}: ${getFilterLabel("arrivePref", arrivePref, filterOpts)}`,
      });
    }
    if (maxTravelTime && maxTravelTime !== "no-limit") {
      list.push({
        id: `time-${maxTravelTime}`,
        kind: "maxTravelTime",
        label: `${sumLabels.filterLabelTime}: ${getFilterLabel("maxTravelTime", maxTravelTime, filterOpts)}`,
      });
    }
    if (climate && climate !== "any") {
      list.push({
        id: `climate-${climate}`,
        kind: "climate",
        label: `${sumLabels.filterLabelClimate}: ${getFilterLabel("climate", climate, filterOpts)}`,
      });
    }
    avoidDestinations.forEach((city) => {
      list.push({
        id: `avoid-${city}`,
        kind: "avoid",
        label: city,
        value: city,
      });
    });
    return list;
  })();

  const selectedAddons = addons.selected
    .map((s) => ADDONS.find((a) => a.id === s.id))
    .filter((a): a is (typeof ADDONS)[number] => Boolean(a));

  const backToJourneyHref = pathForLocale(resolvedLocale, "/journey");

  async function persistCheckoutTravelers(nextDetails: PaxDetails) {
    if (!trip?.id || confirmingRef.current) throw new Error("Checkout is busy");
    const details = getFixedCheckoutParty(trip.type, checkoutLevel) ?? nextDetails;
    const nextPax = details.adults + details.minors;
    if (nextPax === trip.pax && paxDetailsEquals(details, trip.paxDetails) && payment.isReady()) return;
    await payment.refresh({ save: async () => {
      const response = await fetch("/api/trip-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trip.id, pax: nextPax, paxDetails: details }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? dict?.journey?.checkout?.errors?.updateTripFailed);
      }
      const data = await response.json();
      setTrip((previous) => previous?.id === trip.id ? { ...previous,
        pax: nextPax, paxDetails: details,
        level: data.tripRequest?.level ?? getCheckoutLevel({ ...previous, pax: nextPax, paxDetails: details }),
      } : previous);
    } });
  }

  function handlePaymentProcessingChange(processing: boolean) {
    confirmingRef.current = processing;
    setIsConfirming(processing);
  }

  const onBeforeConfirm = async (): Promise<boolean> => {
    if (!hasTripId || !trip?.id || !payment.isReady()) return false;
    const confirmedSecret = clientSecret;
    if (!session && !isAuthed) {
      useUserStore.getState().openAuth("signin");
      return false;
    }
    if (!session?.user?.email) {
      toast.error(dict?.journey?.checkout?.errors?.noValidSession);
      return false;
    }
    if (contactFormRef.current && !contactFormRef.current.reportValidity()) {
      return false;
    }
    try {
      const saveRes = await fetch("/api/user/update", {
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: {
            city: formData.city.trim(),
            country: formData.country.trim(),
            idDocument: formData.idDocument.trim(),
            state: formData.state.trim(),
            street: formData.street.trim(),
            zipCode: formData.zipCode.trim(),
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!saveRes.ok) {
        const saveJson = (await saveRes.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(
          saveJson.error ?? dict?.journey?.checkout?.errors?.saveUserFailed,
        );
        return false;
      }
      return payment.isReady(confirmedSecret ?? undefined);
    } catch (err) {
      console.error("Checkout submit error:", err);
      toast.error(dict?.journey?.checkout?.errors?.connectionTryAgain);
      return false;
    }
  };

  if (!hasTripId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "loading" || tripLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  if (tripError || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <p className="text-center text-gray-700">
          {tripError ?? dict?.journey?.checkout?.errors?.noTripFound}
        </p>
        <Button asChild variant="secondary">
          <Link href={backToJourneyHref}>
            {dict?.journey?.checkout?.volverButton}
          </Link>
        </Button>
      </div>
    );
  }

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const journey = dict.journey;
  const summary = journey.summary;
  const checkoutCopy = journey.checkout;
  const filterFeeDescription =
    filterBreakdown.optional === 0
      ? checkoutCopy.filterFeeLineNone
      : filterBreakdown.tripTotal === 0
        ? interpolateTemplate(checkoutCopy.filterFeeLineFirstFree, {
            optional: String(filterBreakdown.optional),
          })
        : interpolateTemplate(checkoutCopy.filterFeeLine, {
            billable: String(filterBreakdown.billable),
            optional: String(filterBreakdown.optional),
            pax: String(pax),
            unit: String(filterBreakdown.tierUnit),
          });
  const filterFeePaxLine = interpolateTemplate(checkoutCopy.filterFeePaxLine, {
    pax: String(pax),
  });
  const heroTitle = summary.title;
  const heroDescription = checkoutCopy.formDescription;

  const checkoutItemTileClass = cn(
    "bg-white p-4 rounded-xl shadow-sm",
    "ring-1 ring-gray-100",
  );
  const checkoutItemTileLabelClass = "font-normal text-gray-500 text-base";
  const ratingFormatted =
    selectedTravelTypeInfo?.rating != null
      ? resolvedLocale === "es"
        ? selectedTravelTypeInfo.rating.toFixed(1).replace(".", ",")
        : selectedTravelTypeInfo.rating.toFixed(1)
      : null;

  const datesValue =
    startDateParam && nightsNum > 0
      ? summary?.dateRangeTemplate && summary?.monthsShort
        ? formatDatesSummary(
            startDateParam,
            nightsNum,
            summary.dateRangeTemplate,
            summary.monthsShort,
          )
        : `${startDateParam} — ${nightsNum}`
      : summary?.emptyValue;

  const showExcuseAndRefineDetailRows =
    travelType != null && getHasExcuseStep(travelType, experience ?? undefined);

  const checkoutIconDetailRows: CheckoutIconDetailRow[] = [
    {
      id: "experience",
      label: summary?.experienceSection,
      value: selectedExperienceInfo?.label ?? summary?.emptyValue,
    },
    ...(showExcuseAndRefineDetailRows
      ? [
          {
            id: "excuse" as const,
            label: summary?.excuseSection,
            value: excuseTitleRes ?? summary?.emptyValue,
          },
          {
            className: "sm:col-span-2",
            id: "refine-details" as const,
            label: summary?.detailsSection,
            value:
              refineDetailEntries.length > 0 ? (
                refineDetailEntries.map(({ key, label: detailLabel }) => (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-ink text-sm"
                    key={key}
                  >
                    <span>{detailLabel}</span>
                  </div>
                ))
              ) : (
                <p className="font-barlow text-gray-600 text-sm">
                  {summary?.noDetails}
                </p>
              ),
            valueLayout: "chips" as const,
          },
        ]
      : []),
    {
      icon: (
        <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
      ),
      id: "origin",
      label: summary?.originSection,
      value:
        logistics?.city && logistics?.country
          ? `${logistics.city}, ${logistics.country}.`
          : summary?.emptyValue,
    },
    {
      icon: (
        <Calendar
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-gray-600"
        />
      ),
      id: "dates",
      label: summary?.datesSection,
      value: datesValue,
    },
    {
      icon: TransportIcon ? (
        <TransportIcon
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-gray-600"
        />
      ) : undefined,
      id: "transport",
      label: summary?.transportSection,
      value: transportLabel,
    },

    {
      className: "sm:col-span-2",
      id: "filters",
      label:
        activeFilters.length > 0
          ? summary?.filtersSectionCount?.replace(
              "{count}",
              String(activeFilters.length),
            )
          : summary?.filtersSection,
      value:
        activeFilters.length > 0 ? (
          activeFilters.map(({ id: filterId, label: filterLabel }) => (
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-ink text-sm"
              key={filterId}
            >
              <span>{filterLabel}</span>
            </div>
          ))
        ) : (
          <p className="font-barlow text-gray-600 text-sm">
            {summary?.noFilters}
          </p>
        ),
      valueLayout: "chips",
    },
    {
      className: "sm:col-span-2",
      id: "addons",
      label:
        selectedAddons.length > 0
          ? summary?.addonsSectionCount?.replace(
              "{count}",
              String(selectedAddons.length),
            )
          : summary?.addonsSection,
      value:
        selectedAddons.length > 0 ? (
          selectedAddons.map((addon) => (
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-ink text-sm"
              key={addon.id}
            >
              <span>
                {journey?.addons?.[addon.id]?.title ?? addon.title}
                {addon.priceType === "currency"
                  ? ` — USD ${addon.price}`
                  : ` — ${addon.price}%`}
              </span>
            </div>
          ))
        ) : (
          <p className="font-barlow text-gray-600 text-sm">
            {summary?.noAddons}
          </p>
        ),
      valueLayout: "chips",
    },
  ];

  return (
    <div className="min-h-screen bg-ground">
      <HeaderHero
        description={heroDescription}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle=""
        title={heroTitle}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <div className="container mx-auto px-4 py-12 md:px-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <CheckoutTravelDetailsCard
            addonsPerPaxCombined={addonsPerPaxCombined}
            appliedPromocode={appliedPromocode}
            basePerPax={basePerPax}
            checkoutCopy={checkoutCopy}
            checkoutIconDetailRows={checkoutIconDetailRows}
            checkoutItemTileClass={checkoutItemTileClass}
            checkoutItemTileLabelClass={checkoutItemTileLabelClass}
            filterFeeDescription={filterFeeDescription}
            filterFeePaxLine={filterFeePaxLine}
            filtersPerPax={filtersPerPax}
            onApplyPromocode={handleApplyPromocode}
            promoDiscount={promoDiscount}
            promoError={promoError}
            promoLoading={promoLoading}
            onPromocodeChange={setPromocode}
            onRemovePromocode={handleRemovePromocode}
            onSaveTravelers={persistCheckoutTravelers}
            onTogglePromocodeInput={() =>
              setShowPromocodeInput((previous) => !previous)
            }
            partyEditable={!isConfirming && !getFixedCheckoutParty(trip.type, checkoutLevel)}
            paxDetails={paxDetails}
            pricePerPerson={pricePerPerson}
            promocode={promocode}
            ratingFormatted={ratingFormatted}
            selectedExperienceLabel={selectedExperienceInfo?.label}
            selectedTravelTypeInfo={selectedTravelTypeInfo}
            showPromocodeInput={showPromocodeInput}
            summary={summary}
            totalPerPax={totalPerPax}
            totalTrip={totalTrip}
            usd={usd}
          />

          <CheckoutContactCard
            checkoutCopy={checkoutCopy}
            clientSecret={clientSecret}
            formData={formData}
            formRef={contactFormRef}
            isXsed={trip?.type === "xsed"}
            onBack={() => router.back()}
            onBeforeConfirm={onBeforeConfirm}
            onFieldChange={handleChange}
            onPaymentProcessingChange={handlePaymentProcessingChange}
            onRetryPayment={() => { void payment.retry().catch(() => {}); }}
            paymentError={payment.error}
            retryLabel={dict.errorFallback.retry}
            sessionEmail={session?.user?.email || ""}
            summary={summary}
          />
        </div>

        <ChatFab />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
