"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { TripRequestsFilterBar } from "@/components/app/admin/TripRequestsFilterBar";
import { TripRequestsKPIStrip } from "@/components/app/admin/TripRequestsKPIStrip";
import { TripRequestsTable } from "@/components/app/admin/TripRequestsTable";
import { TripRequestModal } from "@/components/app/admin/TripRequestModal";
import { useDictionary } from "@/hooks/useDictionary";
import { useTripRequests } from "@/hooks/useTripRequests";
import { resolveInitialStatusFilter } from "@/lib/admin/trip-status";
import type { AdminTripRequest, StatusFilterValue } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

function applyFilter(
  trips: AdminTripRequest[],
  filter: StatusFilterValue,
): AdminTripRequest[] {
  if (filter === "ALL") return trips;
  return trips.filter((t) => t.status === filter);
}

export interface AdminTripRequestsPageClientProps {
  dict: MarketingDictionary["adminTripEditModal"];
}

export function AdminTripRequestsPageClient({
  dict,
}: AdminTripRequestsPageClientProps) {
  const pageCopy = useDictionary((d) => d.adminPages.tripRequests);
  const { error, loading, refresh, trips } = useTripRequests();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(() =>
    resolveInitialStatusFilter(searchParams.get("status")),
  );
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const visibleTrips = applyFilter(trips, statusFilter);
  const selectedTrip = selectedTripId
    ? trips.find((t) => t.id === selectedTripId)
    : null;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {pageCopy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {pageCopy.title}
        </h2>
      </div>

      <TripRequestsKPIStrip labels={dict.tripStatus} trips={trips} />

      <TripRequestsFilterBar
        activeFilter={statusFilter}
        labels={{ all: pageCopy.filters.all, ...dict.tripStatus }}
        onFilterChange={setStatusFilter}
      />

      <TripRequestsTable
        copy={pageCopy}
        onEdit={setSelectedTripId}
        selectedId={selectedTripId}
        trips={visibleTrips}
      />

      {selectedTrip ? (
        <TripRequestModal
          dict={dict}
          onClose={() => setSelectedTripId(null)}
          onSaved={refresh}
          open
          trip={selectedTrip}
        />
      ) : null}
    </div>
  );
}
