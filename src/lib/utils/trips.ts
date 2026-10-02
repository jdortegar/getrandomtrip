export interface Trip {
  basePriceUsd?: number;
  accommodationType?: string;
  addons?: Array<{ id: string; qty: number }>;
  actualDestination?: string | null;
  arrivePref?: string;
  avoidDestinations?: string[];
  city: string;
  climate?: string;
  country: string;
  customerRating?: number | null;
  departPref?: string;
  endDate: string;
  reviewSubmittedAt?: string | null;
  reviewToken?: string | null;
  id: string;
  level: string;
  maxTravelTime?: string;
  /** Headcount for pricing (e.g. PAWS multipliers). */
  nights?: number;
  pax: number;
  startDate: string;
  status: string;
  totalTripUsd: number;
  transport?: string;
  type: string;
  payment?: {
    amount: number;
    currency?: string;
    createdAt?: string;
    status: string;
  };
  /** Viewer's relation to the trip; companions never receive `payment`. */
  viewerRole?: "buyer" | "companion";
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  trip?: {
    id?: string;
    type: string;
    level: string;
    startDate: string;
  };
  tripRequest?: {
    id?: string;
    type: string;
    level: string;
    startDate: string;
  };
}

interface TripsApiResponse {
  error?: string;
  trips?: unknown[];
  total?: number;
}

interface PaymentsApiResponse {
  error?: string;
  payments?: Payment[];
}

function toIsoDate(value: unknown): string {
  if (value == null || value === "") return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 0;
  return numberValue;
}

function addonsFromApiJson(raw: unknown): Array<{ id: string; qty: number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ id: string; qty: number }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? "");
    if (!id) continue;
    const qty =
      typeof o.qty === "number" && Number.isFinite(o.qty)
        ? o.qty
        : Number(o.qty) || 1;
    out.push({ id, qty });
  }
  return out;
}

function stringArrayFromApi(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter(Boolean);
}

/** Maps GET /api/trips item into a Trip shape. */
export function mapTripFromApi(raw: unknown): Trip {
  const trip = raw as Record<string, unknown>;
  const payment = trip.payment as Record<string, unknown> | null | undefined;
  const paymentAmount = toNumber(payment?.amount);
  const paxRaw = toNumber(trip.pax);
  const pax = paxRaw > 0 ? paxRaw : 1;
  const rowTotalUsd = toNumber(trip.totalTripUsd);
  const totalTripUsd =
    rowTotalUsd > 0 ? rowTotalUsd : paymentAmount > 0 ? paymentAmount : 0;

  return {
    basePriceUsd:
      typeof trip.basePriceUsd === "number" &&
      Number.isFinite(trip.basePriceUsd)
        ? trip.basePriceUsd
        : undefined,
    accommodationType: trip.accommodationType
      ? String(trip.accommodationType)
      : undefined,
    addons: addonsFromApiJson(trip.addons),
    actualDestination:
      (trip.actualDestination as string | null | undefined) ?? null,
    arrivePref: trip.arrivePref ? String(trip.arrivePref) : undefined,
    avoidDestinations: stringArrayFromApi(trip.avoidDestinations),
    city: String(trip.originCity ?? ""),
    climate: trip.climate ? String(trip.climate) : undefined,
    country: String(trip.originCountry ?? ""),
    customerRating: (trip.customerRating as number | null | undefined) ?? null,
    departPref: trip.departPref ? String(trip.departPref) : undefined,
    reviewSubmittedAt: trip.reviewSubmittedAt
      ? toIsoDate(trip.reviewSubmittedAt)
      : null,
    reviewToken: (trip.reviewToken as string | null | undefined) ?? null,
    endDate: toIsoDate(trip.endDate),
    id: String(trip.id ?? ""),
    level: String(trip.level ?? ""),
    maxTravelTime: trip.maxTravelTime ? String(trip.maxTravelTime) : undefined,
    nights: (() => {
      const n = toNumber(trip.nights);
      return n > 0 ? n : undefined;
    })(),
    pax,
    startDate: toIsoDate(trip.startDate),
    status: String(trip.status ?? ""),
    totalTripUsd,
    transport: trip.transport ? String(trip.transport) : undefined,
    type: String(trip.type ?? ""),
    payment: payment
      ? {
          amount: paymentAmount,
          currency:
            typeof payment.currency === "string" ? payment.currency : "USD",
          createdAt: payment.createdAt
            ? toIsoDate(payment.createdAt)
            : undefined,
          status: String(payment.status ?? ""),
        }
      : undefined,
    viewerRole:
      trip.role === "buyer" || trip.role === "companion" ? trip.role : undefined,
  };
}

/**
 * True when the viewer still owes payment for this trip. Companion trips are
 * never awaiting payment: a companion is only linked after the buyer's payment
 * is APPROVED, and the API strips `payment` for them, so a missing payment
 * there does not mean unpaid.
 */
export function isTripAwaitingPayment(trip: Trip): boolean {
  if (trip.viewerRole === "companion") return false;
  if (trip.status === "CANCELLED") return false;
  const status = trip.payment?.status;
  return status !== "APPROVED" && status !== "COMPLETED";
}

export async function getTrips(): Promise<Trip[]> {
  const response = await fetch("/api/trips");
  const data = (await response.json()) as TripsApiResponse;
  if (data.error) throw new Error(data.error);

  const rawTrips = data.trips ?? [];
  return rawTrips.map(mapTripFromApi);
}

export interface PaginatedTrips {
  trips: Trip[];
  total: number;
}

/**
 * Paginated + status-filtered fetch for the "My Trips" table. Separate from
 * getTrips() (used by the reviews page, dashboard home widget, and journey
 * badge, which all need the caller's full trip list, not a page of it).
 */
export async function getPaginatedTrips(params: {
  level?: string;
  page: number;
  limit: number;
  search?: string;
  /** Comma-separated statuses, e.g. "CONFIRMED,REVEALED" for "upcoming". */
  status?: string;
  type?: string;
}): Promise<PaginatedTrips> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status) query.set("status", params.status);
  if (params.level) query.set("level", params.level);
  if (params.type) query.set("type", params.type);
  if (params.search?.trim()) query.set("search", params.search.trim());

  const response = await fetch(`/api/trips?${query.toString()}`);
  const data = (await response.json()) as TripsApiResponse;
  if (!response.ok || data.error)
    throw new Error(data.error ?? "Could not load trips");

  const rawTrips = data.trips ?? [];
  return { trips: rawTrips.map(mapTripFromApi), total: data.total ?? 0 };
}

export async function getPayments(): Promise<Payment[]> {
  const response = await fetch("/api/payments");
  const data = (await response.json()) as PaymentsApiResponse;
  if (data.error) throw new Error(data.error);

  return data.payments ?? [];
}
