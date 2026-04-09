export interface Trip {
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
    createdAt?: string;
    status: string;
  };
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
}

interface PaymentsApiResponse {
  error?: string;
  payments?: Payment[];
}

function toIsoDate(value: unknown): string {
  if (value == null || value === '') return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 0;
  return numberValue;
}

function addonsFromApiJson(raw: unknown): Array<{ id: string; qty: number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ id: string; qty: number }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? '');
    if (!id) continue;
    const qty =
      typeof o.qty === 'number' && Number.isFinite(o.qty)
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
    accommodationType: trip.accommodationType
      ? String(trip.accommodationType)
      : undefined,
    addons: addonsFromApiJson(trip.addons),
    actualDestination: (trip.actualDestination as string | null | undefined) ?? null,
    arrivePref: trip.arrivePref ? String(trip.arrivePref) : undefined,
    avoidDestinations: stringArrayFromApi(trip.avoidDestinations),
    city: String(trip.originCity ?? ''),
    climate: trip.climate ? String(trip.climate) : undefined,
    country: String(trip.originCountry ?? ''),
    customerRating: (trip.customerRating as number | null | undefined) ?? null,
    departPref: trip.departPref ? String(trip.departPref) : undefined,
    endDate: toIsoDate(trip.endDate),
    id: String(trip.id ?? ''),
    level: String(trip.level ?? ''),
    maxTravelTime: trip.maxTravelTime ? String(trip.maxTravelTime) : undefined,
    nights: (() => {
      const n = toNumber(trip.nights);
      return n > 0 ? n : undefined;
    })(),
    pax,
    startDate: toIsoDate(trip.startDate),
    status: String(trip.status ?? ''),
    totalTripUsd,
    transport: trip.transport ? String(trip.transport) : undefined,
    type: String(trip.type ?? ''),
    payment: payment
      ? {
          amount: paymentAmount,
          createdAt: payment.createdAt ? toIsoDate(payment.createdAt) : undefined,
          status: String(payment.status ?? ''),
        }
      : undefined,
  };
}

export async function getTrips(): Promise<Trip[]> {
  const response = await fetch('/api/trips');
  const data = (await response.json()) as TripsApiResponse;
  if (data.error) throw new Error(data.error);

  const rawTrips = data.trips ?? [];
  return rawTrips.map(mapTripFromApi);
}

export async function getPayments(): Promise<Payment[]> {
  const response = await fetch('/api/payments');
  const data = (await response.json()) as PaymentsApiResponse;
  if (data.error) throw new Error(data.error);

  return data.payments ?? [];
}
