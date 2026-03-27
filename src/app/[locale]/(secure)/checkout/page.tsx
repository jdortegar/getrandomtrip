"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Loader2, MapPin, Sparkle, X } from "lucide-react";

import { CheckoutIconValueCard } from "@/components/app/checkout/CheckoutIconValueCard";
import { CheckoutTravelersSummarySection } from "@/components/app/checkout/CheckoutTravelersSummarySection";
import ChatFab from "@/components/chrome/ChatFab";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import Img from "@/components/common/Img";
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
import { TRAVELER_TYPE_LABELS } from "@/lib/data/journey-labels";
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
  paxDetailsFromTotalPax,
  parsePaxDetails,
} from "@/lib/helpers/pax-details";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import { Button } from "@/components/ui/Button";
import { usePayment } from "@/hooks/usePayment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { toast } from "react-toastify";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { pickCheckoutTrip } from "@/lib/helpers/checkout-trip";

const usd = (n: number) => `${Math.round(n)}`;

const checkoutFormFieldClassName =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-lg";

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

/** Suffix after the last "(" in a filled `checkout.tripTotalCaption`, e.g. "(×2 personas)". */
function multiplierSuffixFromTripTotalCaption(filled: string): string {
  const openIdx = filled.lastIndexOf("(");
  return openIdx >= 0 ? filled.slice(openIdx) : "";
}

function stripOuterParentheses(value: string): string {
  const t = value.trim();
  if (t.length >= 2 && t.startsWith("(") && t.endsWith(")")) {
    return t.slice(1, -1).trim();
  }
  return value;
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

/** Trip from API (GET /api/trips list item). */
interface TripFromApi {
  id: string;
  type: string;
  level: string;
  originCountry: string;
  originCity: string;
  startDate: string | null;
  endDate: string | null;
  nights: number;
  pax: number;
  paxDetails?: unknown;
  transport: string;
  climate: string;
  maxTravelTime: string;
  departPref: string;
  arrivePref: string;
  accommodationType?: string;
  avoidDestinations: string[];
  addons: Array<{ id: string; qty: number }> | null;
  status: string;
  updatedAt: string;
}

interface CheckoutIconDetailRow {
  className?: string;
  icon?: ReactNode;
  id: string;
  label: ReactNode;
  value: ReactNode;
  valueLayout?: "chips" | "default";
}

interface CheckoutFormFields {
  city: string;
  country: string;
  name: string;
  phone: string;
  state: string;
  street: string;
  zipCode: string;
}

function logisticsFromTrip(trip: TripFromApi, pax: number): Logistics {
  return {
    city: trip.originCity,
    country: trip.originCountry,
    endDate: trip.endDate ? new Date(trip.endDate) : undefined,
    nights: trip.nights,
    pax,
    startDate: trip.startDate ? new Date(trip.startDate) : undefined,
  };
}

function filtersFromTrip(trip: TripFromApi): Filters {
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

  const { data: session, status, update: updateSession } = useSession();
  const { isAuthed } = useUserStore();

  const [dict, setDict] = useState<Dictionary | null>(null);
  const [paxDetails, setPaxDetails] = useState(DEFAULT_PAX_DETAILS);
  const [trip, setTrip] = useState<TripFromApi | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [formData, setFormData] = useState<CheckoutFormFields>({
    city: "",
    country: "",
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
      setFormData((prev) => ({
        ...prev,
        name: session.user?.name || prev.name,
      }));
    }
  }, [session, status]);

  function handleChange(field: keyof CheckoutFormFields, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          setTripError(dict?.journey?.checkout?.errors?.loadTripsFailed ?? data.error);
          setTrip(null);
          return;
        }
        const trips = (data.trips ?? []) as TripFromApi[];
        const preferredId = tripIdParam?.trim();
        const byPreferredId = preferredId
          ? trips.find((t) => t.id === preferredId)
          : undefined;
        const picked = byPreferredId ?? pickCheckoutTrip(trips);
        if (!picked) {
          setTripError(dict?.journey?.checkout?.errors?.noTripToContinue ?? null);
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
  const addons = {
    selected: Array.isArray(trip?.addons) ? trip!.addons! : [],
  };
  const basePriceUsd = trip
    ? getBasePriceFromCatalog(normalizeTripType(trip.type), trip.level) || 0
    : 0;

  const avoidDestinations = filters?.avoidDestinations ?? [];

  const effectiveLogistics = logistics;

  const { isProcessing, calculateTotals, initiatePayment } = usePayment(
    {
      addons,
      avoidCount: avoidDestinations.length,
      basePriceUsd,
      filters: filters ?? {
        accommodationType: "any",
        arrivePref: "any",
        avoidDestinations: [],
        climate: "any",
        departPref: "any",
        maxTravelTime: "no-limit",
        transport: "plane",
      },
      logistics: effectiveLogistics ?? {
        city: "",
        country: "",
        nights: 1,
        pax: 1,
      },
    },
    { locale: resolvedLocale },
  );

  useEffect(() => {
    if (!hasTripId) return;
    if (status === "loading") return;
    if (!session && !isAuthed) {
      const { openAuth } = useUserStore.getState();
      openAuth("signin");
    }
  }, [hasTripId, session, isAuthed, status]);

  const pax = checkoutPax;
  const { totalPerPax, totalTrip } = calculateTotals();

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
      price: sum ? `${formatUSD(pricePerPerson)} ${sum.experiencePerPerson}` : "",
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

  const backToJourneyHref = `/${locale}/journey`;

  async function persistCheckoutTravelers(nextDetails: PaxDetails) {
    if (!trip?.id) {
      throw new Error("No trip");
    }
    const nextPax = Math.max(1, nextDetails.adults + nextDetails.minors);
    const unchanged =
      nextPax === trip.pax && paxDetailsEquals(nextDetails, trip.paxDetails);
    if (unchanged) {
      setPaxDetails(nextDetails);
      return;
    }
    const res = await fetch("/api/trip-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: trip.id,
        pax: nextPax,
        paxDetails: nextDetails,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? dict?.journey?.checkout?.errors?.updateTripFailed);
      throw new Error(data.error ?? "persist failed");
    }
    setPaxDetails(nextDetails);
    setTrip((prev) =>
      prev && prev.id === trip.id
        ? { ...prev, pax: nextPax, paxDetails: nextDetails }
        : prev,
    );
  }

  const payNow = async (payer?: { email?: string; name?: string }) => {
    if (!trip?.id) return;
    try {
      await persistCheckoutTravelers(paxDetails);
      await initiatePayment(trip.id, payer);
    } catch (err) {
      console.error("Error initiating payment:", err);
      toast.error(dict?.journey?.checkout?.errors?.connectionTryAgain);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasTripId) return;
    if (!session && !isAuthed) {
      useUserStore.getState().openAuth("signin");
      return;
    }
    if (!trip?.id) return;

    const payerEmail = session?.user?.email;
    if (!payerEmail) {
      toast.error(dict?.journey?.checkout?.errors?.noValidSession);
      return;
    }

    try {
      const saveRes = await fetch("/api/user/update", {
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: {
            city: formData.city.trim(),
            country: formData.country.trim(),
            state: formData.state.trim(),
            street: formData.street.trim(),
            zipCode: formData.zipCode.trim(),
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      const saveJson = (await saveRes.json().catch(() => ({}))) as {
        error?: string;
        user?: { name?: string };
      };

      if (!saveRes.ok) {
        toast.error(saveJson.error ?? dict?.journey?.checkout?.errors?.saveUserFailed);
        return;
      }

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: saveJson.user?.name ?? formData.name.trim(),
        },
      });

      await payNow({
        email: payerEmail,
        name: saveJson.user?.name ?? formData.name.trim(),
      });
    } catch (err) {
      console.error("Checkout submit error:", err);
      toast.error(dict?.journey?.checkout?.errors?.connectionTryAgain);
    }
  }

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
          <Link href={backToJourneyHref}>{dict?.journey?.checkout?.volverButton}</Link>
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
  const heroTitle = summary.title;
  const heroDescription = checkoutCopy.formDescription;

  const checkoutItemTileClass = cn(
    "bg-white p-4 rounded-xl shadow-sm",
    "ring-1 ring-gray-100",
  );
  const checkoutItemTileLabelClass = "font-normal text-gray-500 text-sm";
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

  const tripTotalCaptionFilled = checkoutCopy.tripTotalCaption.replace(
    "{count}",
    String(pax),
  );
  const tripTotalMultiplierOnly = multiplierSuffixFromTripTotalCaption(
    tripTotalCaptionFilled,
  );
  const tripTotalMultiplierPlain = stripOuterParentheses(
    tripTotalMultiplierOnly,
  );
  const tripTotalTitleLine =
    tripTotalMultiplierOnly.length > 0
      ? tripTotalCaptionFilled
          .slice(
            0,
            tripTotalCaptionFilled.length - tripTotalMultiplierOnly.length,
          )
          .trimEnd()
      : tripTotalCaptionFilled;

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
        fallbackImage="/images/bg-playa-mexico.jpg"
        subtitle=""
        title={heroTitle}
        videoSrc="/videos/hero-video.mp4"
      />

      <div className="container mx-auto px-4 py-12 md:px-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div
            className={cn(
              "lg:col-span-1 flex gap-4 bg-white p-5 rounded-2xl shadow-md flex-col",
              "ring-1 ring-gray-100 sticky top-0",
            )}
          >
            <form className="space-y-8" onSubmit={handleSubmit}>
              <h2 className="mb-4 text-4xl font-bold font-barlow-condensed uppercase ">
                {checkoutCopy.contactTitle}
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label
                    className="block font-normal text-gray-600 text-xl"
                    htmlFor="email"
                  >
                    {checkoutCopy.contactEmailLabel}
                  </label>
                  <input
                    className={cn(
                      checkoutFormFieldClassName,
                      "disabled:cursor-not-allowed disabled:opacity-80 text-lg",
                    )}
                    disabled
                    id="email"
                    readOnly
                    type="email"
                    value={session?.user?.email || ""}
                  />
                  <p className="mt-1 text-gray-500 text-md">
                    {checkoutCopy.contactEmailHelper}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      className="block font-normal text-gray-600 text-xl"
                      htmlFor="name"
                    >
                      {checkoutCopy.contactNameLabel}
                    </label>
                    <input
                      className={checkoutFormFieldClassName}
                      id="name"
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      type="text"
                      value={formData.name}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="block font-normal text-gray-600 text-xl"
                      htmlFor="phone"
                    >
                      {checkoutCopy.contactPhoneLabel}
                    </label>
                    <input
                      className={checkoutFormFieldClassName}
                      id="phone"
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                      type="tel"
                      value={formData.phone}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="block font-normal text-gray-600 text-xl"
                    htmlFor="street"
                  >
                    {checkoutCopy.contactStreetLabel}
                  </label>
                  <input
                    className={checkoutFormFieldClassName}
                    id="street"
                    onChange={(e) => handleChange("street", e.target.value)}
                    required
                    type="text"
                    value={formData.street}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      className="block font-normal text-gray-600 text-xl"
                      htmlFor="city"
                    >
                      {checkoutCopy.contactCityLabel}
                    </label>
                    <input
                      className={checkoutFormFieldClassName}
                      id="city"
                      onChange={(e) => handleChange("city", e.target.value)}
                      required
                      type="text"
                      value={formData.city}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="block font-normal text-gray-600 text-xl"
                      htmlFor="state"
                    >
                      {checkoutCopy.contactStateLabel}
                    </label>
                    <input
                      className={checkoutFormFieldClassName}
                      id="state"
                      onChange={(e) => handleChange("state", e.target.value)}
                      required
                      type="text"
                      value={formData.state}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      className="block font-normal text-gray-600 text-xl"
                      htmlFor="zipCode"
                    >
                      {checkoutCopy.contactZipCodeLabel}
                    </label>
                    <input
                      className={checkoutFormFieldClassName}
                      id="zipCode"
                      onChange={(e) => handleChange("zipCode", e.target.value)}
                      required
                      type="text"
                      value={formData.zipCode}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="block font-normal text-gray-600 text-xl"
                      htmlFor="country"
                    >
                      {checkoutCopy.contactCountryLabel}
                    </label>
                    <input
                      className={checkoutFormFieldClassName}
                      id="country"
                      onChange={(e) => handleChange("country", e.target.value)}
                      required
                      type="text"
                      value={formData.country}
                    />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "mt-8 flex w-full gap-4 border-gray-200 border-t pt-6",
                )}
              >
                <Button
                  className="min-w-0 flex-1 text-sm font-normal normal-case"
                  disabled={isProcessing}
                  size="lg"
                  type="button"
                  variant="ghost"
                >
                  {checkoutCopy.volverButton}
                </Button>
                <Button
                  className="min-w-0 flex-1 text-sm font-normal normal-case"
                  disabled={isProcessing}
                  size="lg"
                  type="submit"
                  variant="default"
                >
                  {isProcessing ? checkoutCopy.payProcessingButton : checkoutCopy.payButton}
                </Button>
              </div>
            </form>
            <div className="mt-6 rounded-lg bg-[#E8F4FC] p-4 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <Sparkle
                  aria-hidden
                  className="h-4 w-4 shrink-0 fill-[#5B7A8C] text-[#5B7A8C]"
                />
                <span className="font-bold text-base text-gray-900">
                  {summary?.importantTitle}
                </span>
              </div>
              <ul className="list-disc list-outside space-y-1 pl-4 font-normal text-gray-900 text-sm">
                <li>{summary?.importantNote1}</li>
                <li>{summary?.importantNote2}</li>
                <li>{summary?.importantNote3}</li>
                <li>{summary?.importantNote4}</li>
              </ul>
            </div>
          </div>

          <div
            className={cn(
              "lg:col-span-1 flex gap-4 bg-white p-5 rounded-2xl shadow-md flex-col",
              "ring-1 ring-gray-100",
            )}
          >
            <h2 className="mb-4 text-4xl font-bold font-barlow-condensed uppercase ">
              {checkoutCopy.travelDetailsTitle}
            </h2>
            <div className="flex gap-4">
              <div className="h-64 w-48 shrink-0 overflow-hidden rounded-2xl">
              {selectedTravelTypeInfo?.image ? (
                <Img
                  alt={selectedTravelTypeInfo?.label}
                  className="h-full w-full object-cover"
                  height={128}
                  src={selectedTravelTypeInfo.image}
                  width={96}
                />
              ) : null}
              </div>

              <div className="flex flex-col justify-center gap-3">
                <div>
                  <p className="font-barlow text-2xl font-bold">
                    <span>{summary?.travelTypeSection}</span>
                    <span className="px-1.5">
                      {checkoutCopy.travelTypeTitleSeparator}
                    </span>
                    <span className=" text-sky-600">
                      {selectedTravelTypeInfo?.label}
                    </span>
                  </p>
                  <p className="font-barlow text-lg font-normal text-gray-500">
                    {summary?.experienceSection}{" "}
                    <span className="font-bold">
                      {selectedExperienceInfo?.label}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-base">
                    {checkoutCopy.summaryHeroPriceCaption}
                  </p>
                  <p className="font-barlow-condensed font-bold text-gray-900 text-3xl">
                    {usd(pricePerPerson)}
                  </p>
                </div>
                {ratingFormatted != null ? (
                  <p className="text-base font-normal text-gray-500">
                    {summary?.favoriteAmongTravelers}
                    {ratingFormatted}
                    {selectedTravelTypeInfo?.reviews != null &&
                      ` (${selectedTravelTypeInfo.reviews})`}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="mt-2 font-barlow text-gray-500 text-lg">
              {checkoutCopy.itemsDescription}
            </p>

            <div className=" grid grid-cols-1 gap-4 sm:grid-cols-2">
              {checkoutIconDetailRows.map((row) => (
                <CheckoutIconValueCard
                  className={row.className}
                  icon={row.icon}
                  key={row.id}
                  title={row.label}
                  value={row.value}
                  valueLayout={row.valueLayout}
                />
              ))}

              <CheckoutTravelersSummarySection
                checkoutCopy={checkoutCopy}
                onSaveTravelers={persistCheckoutTravelers}
                paxDetails={paxDetails}
                tileClassName={checkoutItemTileClass}
                tileLabelClassName={checkoutItemTileLabelClass}
              />
            </div>

            <div className="mt-6 border-gray-200 border-t pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-barlow-condensed font-bold text-gray-900 text-2xl">
                    {summary?.totalUsd}
                  </p>
                  <p className="text-base font-normal text-gray-500">
                    {summary?.perPerson}
                  </p>
                </div>
                <p className="text-right font-barlow-condensed font-bold text-gray-900 text-2xl">
                  {usd(totalPerPax)} USD
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-barlow-condensed font-bold text-gray-900">
                    {tripTotalTitleLine}
                  </p>
                  <p className="text-base font-normal text-gray-500">
                    {tripTotalMultiplierPlain}
                  </p>
                </div>
                <p className="text-right font-barlow-condensed font-bold text-gray-900 text-3xl">
                  {usd(totalTrip)} USD
                </p>
              </div>
            </div>
          </div>
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
