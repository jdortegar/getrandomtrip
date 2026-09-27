"use client";

import { useEffect, useState } from "react";
import {
  TravelerTripsTable,
  type StatusFilter,
} from "@/components/app/dashboard/traveler/TravelerTripsTable";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
import { useDictionary } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import type { TravelerDashboardDict } from "@/lib/types/dictionary";
import { getPaginatedTrips, type Trip } from "@/lib/utils/trips";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

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
  const [experience, setExperience] = useState("all");
  const [travelType, setTravelType] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const normalizedSearch = search.trim();
  const isSearchPending = normalizedSearch !== debouncedSearch;

  useEffect(() => {
    if (!isSearchPending) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(normalizedSearch);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isSearchPending, normalizedSearch]);

  useEffect(() => {
    if (isSearchPending) return;
    let cancelled = false;

    async function fetchTrips() {
      try {
        setLoading(true);
        const result = await getPaginatedTrips({
          page,
          limit: PAGE_SIZE,
          status: STATUS_FOR_FILTER[filter],
          level: experience === "all" ? undefined : experience,
          type: travelType === "all" ? undefined : travelType,
          search: debouncedSearch || undefined,
        });
        if (!cancelled) {
          setTrips(result.trips);
          setTotal(result.total);
          setHasError(false);
        }
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTrips();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    filter,
    experience,
    travelType,
    debouncedSearch,
    isSearchPending,
    retryAttempt,
  ]);

  function handleFilterChange(next: StatusFilter) {
    if (next === filter) return;
    setLoading(true);
    setHasError(false);
    setFilter(next);
    setPage(1);
  }

  function handlePageChange(next: number) {
    if (next === page || loading || isSearchPending || hasError) return;
    setLoading(true);
    setPage(next);
  }

  function handleRetry() {
    if (loading || isSearchPending) return;
    setLoading(true);
    setRetryAttempt((attempt) => attempt + 1);
  }

  function handleExperienceChange(next: string) {
    if (next === experience) return;
    setLoading(true);
    setHasError(false);
    setExperience(next);
    setPage(1);
  }

  function handleTravelTypeChange(next: string) {
    if (next === travelType) return;
    setLoading(true);
    setHasError(false);
    setTravelType(next);
    setPage(1);
  }

  function handleSearchChange(next: string) {
    setSearch(next);
    if (next.trim() !== normalizedSearch) setHasError(false);
  }

  function handleClearFilters() {
    setLoading(true);
    setHasError(false);
    setFilter("all");
    setExperience("all");
    setTravelType("all");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  if (loading && !hasLoadedOnce) {
    return (
      <DashboardSkeleton
        variant="trips"
        data-component="TravelerTripsPageClient"
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div
      className="space-y-10 py-10 text-left"
      data-component="TravelerTripsPageClient"
    >
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
        experience={experience}
        filter={filter}
        hasError={hasError}
        isLoading={loading || isSearchPending}
        locale={locale}
        onClearFilters={handleClearFilters}
        onExperienceChange={handleExperienceChange}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRetry={handleRetry}
        onSearchChange={handleSearchChange}
        onTravelTypeChange={handleTravelTypeChange}
        page={page}
        pageCopy={pageCopy}
        paginationCopy={paginationCopy}
        search={search}
        total={total}
        totalPages={totalPages}
        trips={trips}
        travelType={travelType}
      />
    </div>
  );
}
