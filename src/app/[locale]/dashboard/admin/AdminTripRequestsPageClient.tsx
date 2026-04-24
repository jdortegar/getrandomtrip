"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { TripRequestsFilterBar } from "@/components/app/admin/TripRequestsFilterBar";
import { TripRequestsKPIStrip } from "@/components/app/admin/TripRequestsKPIStrip";
import { TripRequestsTable } from "@/components/app/admin/TripRequestsTable";
import { TripRequestModal } from "@/components/app/admin/TripRequestModal";
import { useTripRequests } from "@/hooks/useTripRequests";
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
  const { error, loading, refresh, trips } = useTripRequests();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <TripRequestsFilterBar
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />
      <TripRequestsKPIStrip trips={trips} />
      <div className="flex-1 overflow-y-auto">
        <TripRequestsTable
          onEdit={setSelectedTripId}
          selectedId={selectedTripId}
          trips={visibleTrips}
        />
      </div>
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
