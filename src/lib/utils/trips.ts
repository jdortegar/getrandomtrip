export interface Trip {
  id: string;
  type: string;
  level: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  status: string;
  actualDestination?: string | null;
  customerRating?: number | null;
  totalTripUsd: number;
  payment?: {
    status: string;
    amount: number;
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

/** Maps GET /api/trips item into a Trip shape. */
export function mapTripFromApi(raw: unknown): Trip {
  const trip = raw as Record<string, unknown>;
  const payment = trip.payment as Record<string, unknown> | null | undefined;
  const amount = toNumber(payment?.amount);

  return {
    id: String(trip.id ?? ''),
    type: String(trip.type ?? ''),
    level: String(trip.level ?? ''),
    city: String(trip.originCity ?? ''),
    country: String(trip.originCountry ?? ''),
    startDate: toIsoDate(trip.startDate),
    endDate: toIsoDate(trip.endDate),
    status: String(trip.status ?? ''),
    actualDestination: (trip.actualDestination as string | null | undefined) ?? null,
    customerRating: (trip.customerRating as number | null | undefined) ?? null,
    totalTripUsd: amount,
    payment: payment
      ? {
          amount,
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
