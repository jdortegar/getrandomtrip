"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminTripRequest, StatusFilterValue } from "@/lib/admin/types";
import type { TripRequestStatus } from "@/lib/admin/trip-status";
import type {
  TripPaymentStatusFilter,
  TripRequestLevel,
  TripRequestType,
} from "@/lib/admin/tripRequestsFilters";
import type {
  TripRequestSortBy,
  TripRequestSortOrder,
} from "@/lib/admin/tripRequestsSort";

interface UseTripRequestsParams {
  errorLoad: string;
  page: number;
  level?: TripRequestLevel | "ALL";
  limit: number;
  paymentStatus?: TripPaymentStatusFilter | "ALL";
  search?: string;
  sortBy?: TripRequestSortBy;
  sortOrder?: TripRequestSortOrder;
  status: StatusFilterValue;
  type?: TripRequestType | "ALL";
}

interface UseTripRequestsResult {
  error: string | null;
  loading: boolean;
  refresh: () => void;
  statusCounts: Record<TripRequestStatus, number>;
  total: number;
  trips: AdminTripRequest[];
}

const EMPTY_COUNTS = {
  DRAFT: 0,
  SAVED: 0,
  PENDING_PAYMENT: 0,
  CONFIRMED: 0,
  REVEALED: 0,
  COMPLETED: 0,
  CANCELLED: 0,
} satisfies Record<TripRequestStatus, number>;

export function useTripRequests({
  errorLoad,
  page,
  level,
  limit,
  paymentStatus,
  search,
  sortBy,
  sortOrder,
  status,
  type,
}: UseTripRequestsParams): UseTripRequestsResult {
  const [trips, setTrips] = useState<AdminTripRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] =
    useState<Record<TripRequestStatus, number>>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify([
    errorLoad,
    page,
    limit,
    status,
    type,
    level,
    paymentStatus,
    search,
    sortBy,
    sortOrder,
  ]);
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setLoading(true);
    setError(null);
  }

  const requestId = useRef(0);

  const load = useCallback(() => {
    const currentRequest = ++requestId.current;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status !== "ALL") params.set("status", status);
    if (type && type !== "ALL") params.set("type", type);
    if (level && level !== "ALL") params.set("level", level);
    if (paymentStatus && paymentStatus !== "ALL") {
      params.set("paymentStatus", paymentStatus);
    }
    if (search) params.set("search", search);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return fetch(`/api/admin/trip-requests?${params.toString()}`)
      .then(async (res) => ({
        res,
        data: (await res.json()) as {
          error?: string;
          tripRequests?: AdminTripRequest[];
          total?: number;
          statusCounts?: Record<TripRequestStatus, number>;
        },
      }))
      .then(({ res, data }) => {
        if (currentRequest !== requestId.current) return;
        if (!res.ok) {
          setError(data.error ?? errorLoad);
          return;
        }
        setTrips(data.tripRequests ?? []);
        setTotal(data.total ?? 0);
        setStatusCounts(data.statusCounts ?? EMPTY_COUNTS);
      })
      .catch(() => {
        if (currentRequest === requestId.current) setError(errorLoad);
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  }, [
    errorLoad,
    page,
    limit,
    status,
    type,
    level,
    paymentStatus,
    search,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    void load();
  }, [load]);

  return { error, loading, refresh, statusCounts, total, trips };
}
