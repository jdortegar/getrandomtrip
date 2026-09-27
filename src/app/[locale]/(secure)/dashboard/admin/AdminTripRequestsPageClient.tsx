"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { TripRequestsFilters } from "@/components/app/admin/TripRequestsFilters";
import { TripRequestsKPIStrip } from "@/components/app/admin/TripRequestsKPIStrip";
import { TripRequestsTable } from "@/components/app/admin/TripRequestsTable";
import { useDictionary } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { useTripRequests } from "@/hooks/useTripRequests";
import { resolveInitialStatusFilter } from "@/lib/admin/trip-status";
import {
  type TripPaymentStatusFilter,
  type TripRequestLevel,
  type TripRequestType,
} from "@/lib/admin/tripRequestsFilters";
import {
  TRIP_REQUEST_SORT_DEFAULT,
  TRIP_REQUEST_SORT_INITIAL_ORDER,
  type TripRequestSortBy,
  type TripRequestSortOrder,
} from "@/lib/admin/tripRequestsSort";
import type { StatusFilterValue } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export interface AdminTripRequestsPageClientProps {
  dict: MarketingDictionary["adminTripEditModal"];
}

export function AdminTripRequestsPageClient({
  dict,
}: AdminTripRequestsPageClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const pageCopy = useDictionary((d) => d.adminPages.tripRequests);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const paymentStatusLabels: Record<string, string> = useDictionary(
    (d) => d.dashboard.paymentStatus,
  );
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(() =>
    resolveInitialStatusFilter(searchParams.get("status")),
  );
  const [typeFilter, setTypeFilter] = useState<TripRequestType | "ALL">("ALL");
  const [levelFilter, setLevelFilter] = useState<TripRequestLevel | "ALL">(
    "ALL",
  );
  const [paymentFilter, setPaymentFilter] = useState<
    TripPaymentStatusFilter | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<TripRequestSortBy>(
    TRIP_REQUEST_SORT_DEFAULT.sortBy,
  );
  const [sortOrder, setSortOrder] = useState<TripRequestSortOrder>(
    TRIP_REQUEST_SORT_DEFAULT.sortOrder,
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { error, loading, statusCounts, total, trips } = useTripRequests({
    errorLoad: pageCopy.errorLoad,
    page,
    level: levelFilter,
    limit: PAGE_SIZE,
    paymentStatus: paymentFilter,
    search: debouncedSearch,
    sortBy,
    sortOrder,
    status: statusFilter,
    type: typeFilter,
  });

  const hasLoadedOnce = useHasLoadedOnce(loading);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters =
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    levelFilter !== "ALL" ||
    paymentFilter !== "ALL" ||
    searchQuery !== "";

  function handleStatusChange(next: StatusFilterValue) {
    setStatusFilter(next);
    setPage(1);
  }

  function handleTypeChange(next: TripRequestType | "ALL") {
    setTypeFilter(next);
    setPage(1);
  }

  function handleLevelChange(next: TripRequestLevel | "ALL") {
    setLevelFilter(next);
    setPage(1);
  }

  function handlePaymentChange(next: TripPaymentStatusFilter | "ALL") {
    setPaymentFilter(next);
    setPage(1);
  }

  function toggleSort(field: TripRequestSortBy) {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(TRIP_REQUEST_SORT_INITIAL_ORDER[field]);
    }
    setPage(1);
  }

  function clearFilters() {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setLevelFilter("ALL");
    setPaymentFilter("ALL");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  }

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;

  if (error && !hasLoadedOnce) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {pageCopy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {pageCopy.title}
        </h2>
      </div>

      <TripRequestsKPIStrip counts={statusCounts} labels={dict.tripStatus} />

      <TripRequestsFilters
        copy={pageCopy}
        hasActiveFilters={hasActiveFilters}
        hasError={!!error}
        isLoading={loading || searchQuery !== debouncedSearch}
        level={levelFilter}
        onClear={clearFilters}
        onLevelChange={handleLevelChange}
        onPaymentChange={handlePaymentChange}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onStatusChange={handleStatusChange}
        onTypeChange={handleTypeChange}
        payment={paymentFilter}
        paymentStatusLabels={paymentStatusLabels}
        search={searchQuery}
        shown={trips.length}
        status={statusFilter}
        total={total}
        tripStatusLabels={dict.tripStatus}
        type={typeFilter}
      />

      <TripRequestsTable
        copy={pageCopy}
        error={error}
        isLoading={loading}
        locale={locale}
        onSort={toggleSort}
        paymentStatusLabels={paymentStatusLabels}
        sortBy={sortBy}
        sortOrder={sortOrder}
        trips={trips}
        tripStatusLabels={dict.tripStatus}
      />

      <Pagination
        nextLabel={paginationCopy.next}
        onPageChange={setPage}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />
    </div>
  );
}
