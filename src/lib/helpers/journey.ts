import {
  getDefaultPaxDetailsForTravelType,
  getPaxSubstepFields,
  hasPaxSubstep,
  paxDetailsFromTotalPax,
} from "@/lib/helpers/pax-details";
import type { PaxDetails } from "@/lib/types/PaxDetails";
import type { Filters } from "@/store/slices/journeyStore";
import {
  getPrimaryTransportIdFromOrderParam,
  isCompleteTransportOrderParam,
  normalizeJourneyFilterValue,
  normalizeMaxTravelTimeKey,
} from "@/lib/helpers/transport";
import { getLevelById } from "@/lib/utils/experiencesData";

/** Payload shape for POST /api/trip-requests when creating from journey URL params. */
export interface TripRequestPayloadFromJourney {
  addons: Array<{ id: string; qty: number }>;
  arrivePref: string;
  avoidDestinations: string[];
  accommodationType: string;
  climate: string;
  departPref: string;
  endDate: string | null;
  from: "journey";
  /** When set (from `tripRequestId` query on /journey), POST updates that draft instead of creating another. */
  id?: string;
  level: string;
  maxTravelTime: string;
  nights: number;
  originCity: string;
  originCountry: string;
  pax: number;
  paxDetails: PaxDetails;
  startDate: string | null;
  status: "DRAFT";
  transport: string;
  type: string;
}

/**
 * Normalize experience/level from URL or form (e.g. "Explora+", "modoexplora") to slug.
 * Defaults to 'explora-plus' when raw is empty.
 */
export function normalizeExperienceLevel(
  raw: string | null | undefined,
): string {
  if (!raw) return "explora-plus";
  const n = raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace("explora+", "explora-plus");
  if (n === "exploraplus") return "explora-plus";
  if (n === "modoexplora" || n === "explora") return "modo-explora";
  return n || "explora-plus";
}

/**
 * Build trip request payload from journey URL search params.
 * Used by handleGoToCheckout and any other flow that POSTs to /api/trip-requests from journey state.
 */
export function buildTripRequestPayloadFromSearchParams(
  searchParams: URLSearchParams,
  options?: { from?: "journey" },
): TripRequestPayloadFromJourney {
  const experience = searchParams.get("experience");
  const level = normalizeExperienceLevel(experience);
  const travelTypeRaw = searchParams.get("travelType") || "couple";
  const travelType = travelTypeRaw.trim().toLowerCase();
  const originCountry = searchParams.get("originCountry")?.trim() ?? "";
  const originCity = searchParams.get("originCity")?.trim() ?? "";
  const startDateRaw = searchParams.get("startDate");
  const nightsNum = Math.max(
    1,
    parseInt(searchParams.get("nights") ?? "1", 10) || 1,
  );
  let startDate: string | null = null;
  let endDate: string | null = null;
  if (startDateRaw) {
    const start = new Date(startDateRaw);
    startDate = start.toISOString();
    const end = new Date(start);
    end.setDate(end.getDate() + nightsNum);
    endDate = end.toISOString();
  }
  const legacyPax = Math.max(
    1,
    Math.min(20, parseInt(searchParams.get("pax") ?? "2", 10) || 2),
  );
  const avoidRaw = searchParams.get("avoidDestinations");
  const avoidDestinations = avoidRaw
    ? avoidRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const addonsRaw = searchParams.get("addons");
  const addonsSelected = addonsRaw
    ? addonsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => ({ id, qty: 1 }))
    : [];

  // Group/family/paws: party size comes from the "Travellers" substep
  // (paxAdults/paxMinors/paxPets), not the legacy flat `pax` headcount param.
  // Every other travel type keeps today's exact behavior, unchanged.
  let pax = legacyPax;
  let paxDetails: PaxDetails = paxDetailsFromTotalPax(legacyPax);

  if (hasPaxSubstep(travelType)) {
    const paxAdultsRaw = searchParams.get("paxAdults");
    const paxMinorsRaw = searchParams.get("paxMinors");
    const paxPetsRaw = searchParams.get("paxPets");
    const defaults = getDefaultPaxDetailsForTravelType(travelType);
    // Which fields this travel type's "Travellers" substep actually shows —
    // the other one is forced to 0 below regardless of any stale/tampered
    // URL param, since there's no input for it (group/family: no Pets field;
    // paws: no Minors field).
    const fields = getPaxSubstepFields(travelType);

    if (paxAdultsRaw != null || paxMinorsRaw != null || paxPetsRaw != null) {
      const parsedAdults = parseInt(paxAdultsRaw ?? "", 10);
      const parsedMinors = parseInt(paxMinorsRaw ?? "", 10);
      const parsedPets = parseInt(paxPetsRaw ?? "", 10);
      const adults = Math.max(
        1,
        Number.isFinite(parsedAdults) ? parsedAdults : defaults.adults,
      );
      const minors =
        fields === "adults-pets"
          ? 0
          : Math.max(
              0,
              Number.isFinite(parsedMinors) ? parsedMinors : defaults.minors,
            );
      const pets =
        fields === "adults-minors"
          ? 0
          : Math.max(
              0,
              Number.isFinite(parsedPets) ? parsedPets : (defaults.pets ?? 0),
            );
      paxDetails = { adults, minors, rooms: 1, pets };
    } else {
      paxDetails = defaults;
    }
    // Pets aren't billable heads; pax stays adults + minors.
    pax = paxDetails.adults + paxDetails.minors;
  }

  const tripRequestIdRaw = searchParams.get("tripRequestId")?.trim();
  const id =
    tripRequestIdRaw && tripRequestIdRaw.length > 0
      ? tripRequestIdRaw
      : undefined;

  return {
    from: options?.from ?? "journey",
    ...(id != null ? { id } : {}),
    type: travelType,
    level,
    originCountry,
    originCity,
    startDate,
    endDate,
    nights: nightsNum,
    pax,
    paxDetails,
    transport: getPrimaryTransportIdFromOrderParam(
      searchParams.get("transportOrder"),
    ),
    accommodationType:
      normalizeJourneyFilterValue(searchParams.get("accommodationType")) ??
      "any",
    climate: normalizeJourneyFilterValue(searchParams.get("climate")) ?? "any",
    maxTravelTime:
      normalizeMaxTravelTimeKey(searchParams.get("maxTravelTime")) ??
      "no-limit",
    departPref:
      normalizeJourneyFilterValue(searchParams.get("departPref")) ?? "any",
    arrivePref:
      normalizeJourneyFilterValue(searchParams.get("arrivePref")) ?? "any",
    avoidDestinations,
    addons: addonsSelected,
    status: "DRAFT",
  };
}

/**
 * Count the number of optional filters selected
 * Excludes transport (which is mandatory) and only counts non-default values.
 * avoidCount is from URL (avoidDestinations query param) and is not in store.
 */
export function countOptionalFilters(f: Filters, avoidCount = 0): number {
  let n = 0;
  if (f.accommodationType !== "any") n++;
  if (f.climate !== "any") n++;
  if (f.maxTravelTime !== "no-limit") n++;
  if (f.departPref !== "any") n++;
  if (f.arrivePref !== "any") n++;
  n += avoidCount;
  return n;
}

// ---------------------------------------------------------------------------
// Label helpers (pure — no React dependencies)
// ---------------------------------------------------------------------------

export function getTravelTypeLabel(
  travelType: string | undefined,
  localizedTravelerTypes: Array<{ key: string; title: string }> | undefined,
  placeholder: string,
): string {
  if (!travelType) return placeholder;
  const localized = localizedTravelerTypes?.find((t) => t.key === travelType);
  return localized?.title || travelType;
}

export function getExperienceLabel(
  travelType: string | undefined,
  experience: string | undefined,
  locale: string,
  placeholder: string,
): string {
  if (!experience || !travelType) return placeholder;
  const level = getLevelById(travelType, experience, locale);
  return level?.name ?? experience;
}

export function getExcuseLabel(
  excuse: string | undefined,
  excuses: Array<{ key: string; title: string }>,
  placeholder: string,
): string {
  if (!excuse) return placeholder;
  const found = excuses.find((e) => e.key === excuse);
  return found?.title || excuse;
}

export function getRefineDetailsLabel(
  refineDetails: string[],
  options: Array<{ key: string; label: string }>,
  oneSelectedStr: string,
  countSelectedStr: string,
  placeholder: string,
): string {
  if (refineDetails.length === 0) return placeholder;
  if (refineDetails.length === 1) {
    const option = options.find((o) => o.key === refineDetails[0]);
    return option?.label || oneSelectedStr;
  }
  return countSelectedStr.replace("{count}", String(refineDetails.length));
}

// ---------------------------------------------------------------------------
// Reset-param constants
// ---------------------------------------------------------------------------

export const PARAMS_TO_RESET_AFTER_TRAVEL_TYPE: Record<
  string,
  string | undefined
> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  avoidDestinations: undefined,
  climate: undefined,
  departPref: undefined,
  excuse: undefined,
  experience: undefined,
  maxTravelTime: undefined,
  nights: undefined,
  originCity: undefined,
  originCountry: undefined,
  paxAdults: undefined,
  paxMinors: undefined,
  paxPets: undefined,
  refineDetails: undefined,
  startDate: undefined,
  transportOrder: undefined,
  tripRequestId: undefined,
};

export const PARAMS_TO_RESET_AFTER_EXPERIENCE: Record<
  string,
  string | undefined
> = {
  accommodationType: undefined,
  addons: undefined,
  arrivePref: undefined,
  avoidDestinations: undefined,
  climate: undefined,
  departPref: undefined,
  excuse: undefined,
  maxTravelTime: undefined,
  nights: undefined,
  originCity: undefined,
  originCountry: undefined,
  refineDetails: undefined,
  startDate: undefined,
  transportOrder: undefined,
  tripRequestId: undefined,
};

export interface TravelTypeSelectionEffects {
  queryPatch: Record<string, string | undefined>;
  accordionValue: string;
}

/**
 * Computes the URL query patch AND the accordion section that should end up
 * open after the user picks a new travel type.
 *
 * `accordionValue` is a single flat piece of state shared across the whole
 * journey flow (see useJourneyAccordion), not scoped per tab. Origin/Dates/
 * Transport/pax params are wiped here via PARAMS_TO_RESET_AFTER_TRAVEL_TYPE
 * because they no longer apply to the new type, but "dates" or "transport"
 * remain *valid* accordion values for the "details" tab's own whitelist even
 * though the data behind them was just wiped — useJourneyAccordion's
 * tab-change effect only corrects values that become *invalid*, so it never
 * catches this. The accordion must be forced back to "origin" explicitly,
 * matching the same target handleContinue already uses when advancing into
 * "details" normally.
 */
export function getTravelTypeSelectionEffects(
  slug: string,
  paxSeed: { adults: number; minors: number; pets?: number } | null,
): TravelTypeSelectionEffects {
  return {
    queryPatch: {
      ...PARAMS_TO_RESET_AFTER_TRAVEL_TYPE,
      travelType: slug,
      ...(paxSeed
        ? {
            paxAdults: String(paxSeed.adults),
            paxMinors: String(paxSeed.minors),
            paxPets: String(paxSeed.pets ?? 0),
          }
        : {}),
    },
    accordionValue: paxSeed ? "pax" : "origin",
  };
}

// ---------------------------------------------------------------------------
// Step-logic helpers (pure — no React dependencies)
// ---------------------------------------------------------------------------

export interface JourneyStepValues {
  travelType: string | undefined;
  experience: string | undefined;
  excuse: string | undefined;
  refineDetails: string[];
  hasExcuseStep: boolean;
  effectiveOriginCountry: string;
  effectiveOriginCity: string;
  effectiveStartDate: string | undefined;
  effectiveNights: number;
  transport: string | undefined;
}

export function getNextTab(
  activeTab: string,
  hasExcuseStep: boolean,
): string | null {
  const tabs = hasExcuseStep
    ? ["budget", "excuse", "details", "preferences"]
    : ["budget", "details", "preferences"];
  const currentIndex = tabs.indexOf(activeTab);
  return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
}

export function getPreviousTab(
  activeTab: string,
  hasExcuseStep: boolean,
): string | null {
  const tabs = hasExcuseStep
    ? ["budget", "excuse", "details", "preferences"]
    : ["budget", "details", "preferences"];
  const currentIndex = tabs.indexOf(activeTab);
  return currentIndex > 0 ? tabs[currentIndex - 1] : null;
}

export function isStepComplete(
  activeTab: string,
  v: JourneyStepValues,
): boolean {
  switch (activeTab) {
    case "budget":
      return Boolean(v.travelType && v.experience);
    case "excuse":
      return Boolean(
        v.travelType &&
        v.experience &&
        (v.excuse || !v.hasExcuseStep) &&
        (!v.hasExcuseStep || v.refineDetails.length > 0),
      );
    case "details":
      return Boolean(
        v.effectiveOriginCountry &&
        v.effectiveOriginCity &&
        v.effectiveStartDate &&
        v.effectiveNights,
      );
    case "preferences":
      return Boolean(v.transport);
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Substep-level navigation (pure — no React dependencies)
//
// Next/Back move one substep at a time within a tab (e.g. Origin -> Dates),
// only advancing to the next/previous TAB once there's no next/previous
// substep left in the current one. Next is blocked (canContinue = false)
// until the CURRENT substep itself has a selection — see
// isSubstepValueComplete.
// ---------------------------------------------------------------------------

export interface SubstepOrderContext {
  hasExcuseStep: boolean;
  hasPax: boolean;
  addonsEnabled: boolean;
}

/** Ordered substep ids for a tab — the single source of truth for substep
 * sequencing, reused by page.tsx's sidebar-click mapping and by Next/Back. */
export function getTabSubstepOrder(
  tabId: string,
  ctx: SubstepOrderContext,
): string[] {
  switch (tabId) {
    case "budget":
      return ["travel-type", "experience"];
    case "excuse":
      return ["reason", "refine-details"];
    case "details":
      return ctx.hasPax
        ? ["pax", "origin", "dates", "transport"]
        : ["origin", "dates", "transport"];
    case "preferences":
      return ctx.addonsEnabled ? ["filters", "addons"] : ["filters"];
    default:
      return [];
  }
}

export interface SubstepCompletionContext {
  travelType?: string;
  experience?: string;
  excuse?: string;
  refineDetails: string[];
  originCountry: string;
  originCity: string;
  startDate?: string;
  nights: number;
  transportOrder: string[];
}

/**
 * Whether the given substep currently has a selection — used to block Next
 * until the CURRENT substep (not the whole tab) is filled in. Substeps with
 * sensible defaults (Travellers, Filters, Extras) never block.
 */
export function isSubstepValueComplete(
  tabId: string,
  substepId: string,
  ctx: SubstepCompletionContext,
): boolean {
  switch (`${tabId}:${substepId}`) {
    case "budget:travel-type":
      return Boolean(ctx.travelType);
    case "budget:experience":
      return Boolean(ctx.experience);
    case "excuse:reason":
      return Boolean(ctx.excuse);
    case "excuse:refine-details":
      return ctx.refineDetails.length > 0;
    case "details:origin":
      return Boolean(ctx.originCountry && ctx.originCity);
    case "details:dates":
      return Boolean(ctx.startDate && ctx.nights);
    case "details:transport":
      return isCompleteTransportOrderParam(ctx.transportOrder.join(","));
    default:
      // details:pax, preferences:filters, preferences:addons — always have a
      // valid default value, never block Next.
      return true;
  }
}

// ---------------------------------------------------------------------------
// contentTabs UI filtering (pure — no React dependencies)
// ---------------------------------------------------------------------------

export interface ContentTabSubstep {
  description: string;
  id: string;
  title: string;
}

export interface ContentTab {
  id: string;
  label: string;
  substeps: ContentTabSubstep[];
}

/**
 * Shapes the dictionary-driven journey.contentTabs array for the sidebar and
 * tab navigation: drops the "excuse" tab when it doesn't apply, and drops the
 * "pax" substep under "details" unless travelType is group/family/paws.
 */
export function filterContentTabsForUI<T extends ContentTab>(
  contentTabs: T[],
  options: { travelType: string | null | undefined; hasExcuseStep: boolean },
): T[] {
  const { travelType, hasExcuseStep } = options;
  const tabs = hasExcuseStep
    ? contentTabs
    : contentTabs.filter((tab) => tab.id !== "excuse");

  return tabs.map((tab) => {
    if (tab.id !== "details" || hasPaxSubstep(travelType)) return tab;
    return {
      ...tab,
      substeps: tab.substeps.filter((substep) => substep.id !== "pax"),
    };
  });
}

/**
 * Resolves which accordion section should be open for a given tab/substep
 * click. When substepId is a real substep of this tab, it wins outright.
 * Otherwise (e.g. clicking the tab itself, or advancing via Next/Back)
 * falls back to the first substep in that tab's order — the single source
 * of truth for substep order is getTabSubstepOrder, shared with Next/Back.
 */
export function getAccordionForStep(
  tabId: string,
  substepId?: string,
  travelType?: string | null,
  addonsEnabled = false,
): string {
  const order = getTabSubstepOrder(tabId, {
    hasExcuseStep: true,
    hasPax: hasPaxSubstep(travelType),
    addonsEnabled,
  });
  if (substepId && order.includes(substepId)) return substepId;
  return order[0] ?? "";
}
