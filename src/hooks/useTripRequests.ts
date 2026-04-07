'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminTripRequest } from '@/lib/admin/types';

interface UseTripRequestsResult {
  error: string | null;
  loading: boolean;
  refresh: () => void;
  trips: AdminTripRequest[];
}

export function useTripRequests(): UseTripRequestsResult {
  const [trips, setTrips] = useState<AdminTripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/trip-requests');
    const data = (await res.json()) as { error?: string; tripRequests?: AdminTripRequest[] };
    if (!res.ok) {
      setError(data.error ?? 'Failed to load trip requests.');
      setLoading(false);
      return;
    }
    setTrips(data.tripRequests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { error, loading, refresh: load, trips };
}
