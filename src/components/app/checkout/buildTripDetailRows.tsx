import { Calendar, Car, MapPin } from "lucide-react";
import type { CheckoutIconDetailRow } from "@/components/app/checkout/CheckoutTravelDetailsCard";
import { TRANSPORT_ICONS, TRANSPORT_OPTIONS } from "@/components/journey/TransportSelector";
import { XSED_LEVEL_ID } from "@/lib/constants/product-config";
import { ADDONS } from "@/lib/data/shared/addons-catalog";
import { travelerTypeOf, tripFamilyOf } from "@/lib/db/tripRequestFamily";
import { getHasExcuseStep, resolveExcuseSelectionLabels } from "@/lib/helpers/excuse-helper";
import { formatDatesSummary } from "@/lib/helpers/formatDatesSummary";
import { OWN_CAR_TRANSPORT, resolveTripTransport, resolveTripTransportLabel } from "@/lib/helpers/transport";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getLevelById } from "@/lib/utils/experiencesData";
import { FILTER_OPTIONS } from "@/store/slices/journeyStore";
import type { XsedTravelType } from "@/types/core";
import type { TripDetailRowsTrip } from "@/types/Checkout";

type RowsCopy = Pick<Dictionary, "journey" | "tripTransport" | "xsedBook">;

export function getFilterLabel(
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

export function normalizeLevelForCatalog(raw?: string | null): string | undefined {
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

/** Localized experience (level) name, as the checkout shows it. */
export function resolveExperienceLabel(
  trip: Pick<TripDetailRowsTrip, "type" | "level">,
  copy: RowsCopy,
  locale: string,
): string | undefined {
  const travelType = trip.type.trim().toLowerCase();
  const experience = trip.level || undefined;
  if (!experience || !travelType) return undefined;
  const normalized = normalizeLevelForCatalog(experience);
  const level =
    getLevelById(travelType, experience, locale) ??
    (normalized ? getLevelById(travelType, normalized, locale) : null);
  if (!level) return undefined;
  return travelType === "xsed"
    ? (copy.xsedBook.travelType[trip.level as XsedTravelType] ?? level.name)
    : level.name;
}

const chipClassName =
  "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 font-normal text-ink text-sm";

/**
 * The read-only trip detail rows of the checkout trip card: experience,
 * excuse and refine details, origin, dates, transport, filters and add-ons.
 * `showAddonPrices` is false where the viewer must not see prices (companions).
 */
export function buildTripDetailRows({
  trip,
  copy,
  locale,
  showAddonPrices,
}: {
  trip: TripDetailRowsTrip;
  copy: RowsCopy;
  locale: string;
  showAddonPrices: boolean;
}): CheckoutIconDetailRow[] {
  const journey = copy.journey;
  const summary = journey.summary;
  const experience = trip.level || undefined;
  const excuse = trip.excuseKey ?? undefined;
  const refineDetails = trip.refineDetails ?? [];
  const startDateParam = trip.startDate ?? undefined;
  const nightsNum = trip.nights ?? 1;
  const transport = trip.transport ?? undefined;
  const departPref = trip.departPref ?? undefined;
  const arrivePref = trip.arrivePref ?? undefined;
  const maxTravelTime = trip.maxTravelTime ?? undefined;
  const climate = trip.climate ?? undefined;
  const avoidDestinations = trip.avoidDestinations ?? [];

  const experienceLabel = resolveExperienceLabel(trip, copy, locale);
  const storedTrip = { type: trip.type, level: trip.storedLevel ?? trip.level };
  const resolvedExcuse = resolveExcuseSelectionLabels({
    travelerType: travelerTypeOf(storedTrip),
    excuseKey: excuse,
    refineDetails,
    localizedExcuses: journey.excuses,
    localizedRefineOptions: journey.refineDetailOptions,
  });
  const excuseTitleRes = resolvedExcuse?.title;
  const refineDetailEntries = resolvedExcuse?.refineDetails ?? [];
  const filterOpts = journey.preferencesStep?.filterOptions;
  const regularTransportLabel = (() => {
    if (!transport) return undefined;
    return (
      TRANSPORT_OPTIONS.find((o) => o.id === transport)?.label ??
      getFilterLabel("transport", transport, filterOpts)
    );
  })();
  const transportLabel = resolveTripTransportLabel(
    trip.type, transport, copy.tripTransport.ownCar ?? "", regularTransportLabel,
  );
  const TransportIcon = resolveTripTransport(trip.type, transport) === OWN_CAR_TRANSPORT
    ? Car
    : TRANSPORT_ICONS[transport ?? "plane"];

  const activeFilters: { id: string; label: string }[] = [];
  if (departPref && departPref !== "any") {
    activeFilters.push({
      id: `depart-${departPref}`,
      label: `${summary.filterLabelDepart}: ${getFilterLabel("departPref", departPref, filterOpts)}`,
    });
  }
  if (arrivePref && arrivePref !== "any") {
    activeFilters.push({
      id: `arrive-${arrivePref}`,
      label: `${summary.filterLabelArrive}: ${getFilterLabel("arrivePref", arrivePref, filterOpts)}`,
    });
  }
  if (maxTravelTime && maxTravelTime !== "no-limit") {
    activeFilters.push({
      id: `time-${maxTravelTime}`,
      label: `${summary.filterLabelTime}: ${getFilterLabel("maxTravelTime", maxTravelTime, filterOpts)}`,
    });
  }
  if (climate && climate !== "any") {
    activeFilters.push({
      id: `climate-${climate}`,
      label: `${summary.filterLabelClimate}: ${getFilterLabel("climate", climate, filterOpts)}`,
    });
  }
  avoidDestinations.forEach((city) => {
    activeFilters.push({ id: `avoid-${city}`, label: city });
  });

  const selectedAddons = (Array.isArray(trip.addons) ? trip.addons : [])
    .map((s) => ADDONS.find((a) => a.id === s.id))
    .filter((a): a is (typeof ADDONS)[number] => Boolean(a));

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

  // XSED trips keep the traveler type in `level`; legacy trips have no excuse.
  const showExcuseAndRefineDetailRows =
    excuse != null ||
    getHasExcuseStep(
      travelerTypeOf(storedTrip),
      tripFamilyOf(trip.type) === "xsed" ? XSED_LEVEL_ID : experience,
    );

  return [
    {
      id: "experience",
      label: summary?.experienceSection,
      value: experienceLabel ?? summary?.emptyValue,
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
                  <div className={chipClassName} key={key}>
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
        trip.originCity && trip.originCountry
          ? `${trip.originCity}, ${trip.originCountry}.`
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
            <div className={chipClassName} key={filterId}>
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
            <div className={chipClassName} key={addon.id}>
              <span>
                {journey?.addons?.[addon.id]?.title ?? addon.title}
                {showAddonPrices
                  ? addon.priceType === "currency"
                    ? ` — USD ${addon.price}`
                    : ` — ${addon.price}%`
                  : ""}
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
}
