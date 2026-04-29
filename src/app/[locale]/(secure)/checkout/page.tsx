"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Loader2, MapPin, X } from "lucide-react";

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
  getBasePricePerPerson,
  getPricePerPerson,
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
  getFixedPaxDetailsForTravelType,
  isTravelersPartyEditable,
  paxDetailsEquals,
  paxDetailsFromTotalPax,
  parsePaxDetails,
} from "@/lib/helpers/pax-details";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import type { CheckoutFormFields, CheckoutTripFromApi } from "@/types/Checkout";
import { Button } from "@/components/ui/Button";
import { usePayment } from "@/hooks/usePayment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { toast } from "sonner";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { pickCheckoutTrip } from "@/lib/helpers/checkout-trip";
import { AMERICAN_COUNTRIES } from "@/lib/data/shared/countries";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { getFiltersCostBreakdown } from "@/lib/pricing";

const usd = (n: number) => `USD ${Math.round(n)}`;

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
  const [paxDetails, setPaxDetails] = useState(DEFAULT_PAX_DETAILS);
  const [trip, setTrip] = useState<CheckoutTripFromApi | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [appliedPromocode, setAppliedPromocode] = useState<string | null>(null);
  const [promocode, setPromocode] = useState("");
  const [showPromocodeInput, setShowPromocodeInput] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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
    const normalizedPromocode = promocode.trim().toUpperCase();
    if (!normalizedPromocode || !trip?.id) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/stripe/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id, promoCode: normalizedPromocode }),
      });
      const data = (await res.json()) as {
        discountAmount?: number;
        code?: string;
        error?: string;
      };
      if (!res.ok) {
        setPromoError(data.error ?? "Invalid promo code");
        return;
      }
      setAppliedPromocode(data.code ?? normalizedPromocode);
      setPromoDiscount(data.discountAmount ?? 0);
      setPromocode("");
      setShowPromocodeInput(false);
    } catch {
      setPromoError(dict?.journey?.checkout?.errors?.connectionTryAgain ?? "Connection error");
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleRemovePromocode() {
    if (!trip?.id) return;
    setPromoLoading(true);
    try {
      await fetch("/api/stripe/remove-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id }),
      });
    } catch {
      // best-effort — reset locally regardless
    } finally {
      setAppliedPromocode(null);
      setPromoDiscount(0);
      setPromoError(null);
      setPromoLoading(false);
    }
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
        const byPreferredId = preferredId
          ? trips.find((t) => t.id === preferredId)
          : undefined;
        const picked = byPreferredId ?? pickCheckoutTrip(trips);
        if (!picked) {
          setTripError(
            dict?.journey?.checkout?.errors?.noTripToContinue ?? null,
          );
          setTrip(null);
          return;
        }
        setTrip(picked);
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

  useEffect(() => {
    if (!trip?.id) return;
    let cancelled = false;
    createPaymentIntent(trip.id)
      .then(({ clientSecret: secret }) => {
        if (!cancelled) setClientSecret(secret);
      })
      .catch(() => {
        if (!cancelled)
          toast.error(dict?.journey?.checkout?.errors?.connectionTryAgain);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  useEffect(() => {
    if (!trip?.id) return;
    const normalizedType = normalizeTripType(trip.type);
    const fixedParty = getFixedPaxDetailsForTravelType(normalizedType);
    if (fixedParty) {
      setPaxDetails(fixedParty);
      return;
    }
    const parsed = parsePaxDetails(trip.paxDetails);
    if (parsed) {
      setPaxDetails(parsed);
      return;
    }
    setPaxDetails(paxDetailsFromTotalPax(trip.pax));
  }, [trip?.id, trip?.type, trip?.pax, trip?.paxDetails]);

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
    ? getBasePriceFromCatalog(normalizeTripType(trip.type), trip.level) || 0
    : 0;

  const avoidDestinations = filtersResolved.avoidDestinations ?? [];

  const effectiveLogistics = logistics;

  const { calculateTotals, createPaymentIntent } = usePayment({
    addons,
    avoidCount: avoidDestinations.length,
    basePriceUsd,
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
  const paymentTotals = calculateTotals();
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
  const experience = trip?.level ?? undefined;
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
  const pricePerPerson = getPricePerPerson(
    travelType ?? "",
    experience ?? undefined,
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
      label: selectedLevel.name,
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
    if (!trip?.id) {
      throw new Error("No trip");
    }
    const normalizedType = normalizeTripType(trip.type);
    const fixedParty = getFixedPaxDetailsForTravelType(normalizedType);
    const effectiveDetails = fixedParty ?? nextDetails;
    const nextPax = Math.max(
      1,
      effectiveDetails.adults + effectiveDetails.minors,
    );
    const unchanged =
      nextPax === trip.pax &&
      paxDetailsEquals(effectiveDetails, trip.paxDetails);
    if (unchanged) {
      setPaxDetails(effectiveDetails);
      return;
    }
    const res = await fetch("/api/trip-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: trip.id,
        pax: nextPax,
        paxDetails: effectiveDetails,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(
        data.error ?? dict?.journey?.checkout?.errors?.updateTripFailed,
      );
      throw new Error(data.error ?? "persist failed");
    }
    setPaxDetails(effectiveDetails);
    setTrip((prev) =>
      prev && prev.id === trip.id
        ? { ...prev, pax: nextPax, paxDetails: effectiveDetails }
        : prev,
    );
  }

  const onBeforeConfirm = async (): Promise<boolean> => {
    if (!hasTripId || !trip?.id) return false;
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
      await persistCheckoutTravelers(paxDetails);
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
      return true;
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-gray-900 text-sm"
                    key={key}
                  >
                    <span>{detailLabel}</span>
                    <X aria-hidden className="h-3.5 w-3.5 text-gray-400" />
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
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-gray-900 text-sm"
              key={filterId}
            >
              <span>{filterLabel}</span>
              <X aria-hidden className="h-3.5 w-3.5 text-gray-400" />
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
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-gray-900 text-sm"
              key={addon.id}
            >
              <span>
                {journey?.addons?.[addon.id]?.title ?? addon.title}
                {addon.priceType === "currency"
                  ? ` — USD ${addon.price}`
                  : ` — ${addon.price}%`}
              </span>
              <X aria-hidden className="h-3.5 w-3.5 text-gray-400" />
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
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description={heroDescription}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle=""
        title={heroTitle}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <div className="container mx-auto px-4 py-12 md:px-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <CheckoutContactCard
            checkoutCopy={checkoutCopy}
            clientSecret={clientSecret}
            formData={formData}
            formRef={contactFormRef}
            onBack={() => router.back()}
            onBeforeConfirm={onBeforeConfirm}
            onFieldChange={handleChange}
            sessionEmail={session?.user?.email || ""}
            summary={summary}
          />

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
            partyEditable={isTravelersPartyEditable(travelType)}
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
