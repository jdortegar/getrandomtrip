"use client";

import { useEffect, useState } from "react";
import {
  TravelerTripsTable,
  type StatusFilter,
} from "@/components/app/dashboard/traveler/TravelerTripsTable";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
import { useDictionary } from "@/hooks/useDictionary";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import type { TravelerDashboardDict } from "@/lib/types/dictionary";
import { getPaginatedTrips, type Trip } from "@/lib/utils/trips";

const PAGE_SIZE = 20;

const STATUS_FOR_FILTER: Record<StatusFilter, string | undefined> = {
  all: undefined,
  upcoming: "CONFIRMED,REVEALED",
  completed: "COMPLETED",
};

interface TravelerTripsPageClientProps {
  copy: DashboardCopy;
  locale: string;
  pageCopy: TravelerDashboardDict["trips"];
}

export function TravelerTripsPageClient({
  copy,
  locale,
  pageCopy,
}: TravelerTripsPageClientProps) {
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrips() {
      try {
        setLoading(true);
        const result = await getPaginatedTrips({
          page,
          limit: PAGE_SIZE,
          status: STATUS_FOR_FILTER[filter],
        });
        if (!cancelled) {
          setTrips(result.trips);
          setTotal(result.total);
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTrips();
    return () => {
      cancelled = true;
    };
  }, [page, filter]);

  function handleFilterChange(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  if (loading) {
    return <DashboardSkeleton variant="trips" />;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10 py-10 text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {pageCopy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {pageCopy.title}
        </h2>
      </div>

      <TravelerTripsTable
        copy={copy}
        filter={filter}
        locale={locale}
        onFilterChange={handleFilterChange}
        onPageChange={setPage}
        page={page}
        pageCopy={pageCopy}
        paginationCopy={paginationCopy}
        total={total}
        totalPages={totalPages}
        trips={trips}
      />
    </div>
  );
}
