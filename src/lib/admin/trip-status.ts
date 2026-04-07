export type TripRequestStatus =
  | 'DRAFT'
  | 'SAVED'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'REVEALED'
  | 'COMPLETED'
  | 'CANCELLED';

export const TRIP_STATUS_FLOW: TripRequestStatus[] = [
  'DRAFT',
  'SAVED',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'REVEALED',
  'COMPLETED',
];

export interface StatusColors {
  bg: string;
  border: string;
  text: string;
}

export const TRIP_STATUS_COLORS: Record<TripRequestStatus, StatusColors> = {
  CANCELLED:       { bg: 'bg-red-100',    border: 'border-red-200',    text: 'text-red-800'    },
  COMPLETED:       { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  CONFIRMED:       { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  DRAFT:           { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
  PENDING_PAYMENT: { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
  REVEALED:        { bg: 'bg-blue-100',   border: 'border-blue-200',   text: 'text-blue-800'   },
  SAVED:           { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
};

export const PAYMENT_STATUS_COLORS: Record<string, StatusColors> = {
  APPROVED:   { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  CANCELLED:  { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
  COMPLETED:  { bg: 'bg-green-100',  border: 'border-green-200',  text: 'text-green-800'  },
  FAILED:     { bg: 'bg-red-100',    border: 'border-red-200',    text: 'text-red-800'    },
  PENDING:    { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
  REFUNDED:   { bg: 'bg-gray-100',   border: 'border-gray-200',   text: 'text-gray-700'   },
};

export function countTripsByStatus(
  trips: { status: TripRequestStatus }[],
): Record<TripRequestStatus, number> {
  const all: TripRequestStatus[] = [...TRIP_STATUS_FLOW, 'CANCELLED'];
  const counts = Object.fromEntries(all.map((s) => [s, 0])) as Record<TripRequestStatus, number>;
  for (const trip of trips) {
    if (trip.status in counts) counts[trip.status]++;
  }
  return counts;
}
