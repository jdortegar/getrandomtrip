"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TripRequestsKPIStrip } from "@/components/app/admin/TripRequestsKPIStrip";
import { TripRequestsTable } from "@/components/app/admin/TripRequestsTable";
import { useDictionary } from "@/hooks/useDictionary";
import { useTripRequests } from "@/hooks/useTripRequests";
import { resolveInitialStatusFilter } from "@/lib/admin/trip-status";
import {
  TRIP_PAYMENT_STATUS_VALUES,
  TRIP_REQUEST_LEVELS,
  TRIP_REQUEST_TYPES,
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
const SELECT_CLASS = "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { error, loading, statusCounts, total, trips } = useTripRequests({
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

  useEffect(() => {
    if (!loading) setHasLoadedOnce(true);
  }, [loading]);

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

      <TripRequestsKPIStrip counts={statusCounts} labels={dict.tripStatus} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className={SELECT_CLASS}
            onChange={(e) =>
              handleStatusChange(e.target.value as StatusFilterValue)
            }
            value={statusFilter}
          >
            <option value="ALL">{pageCopy.filters.allStatuses}</option>
            {Object.entries(dict.tripStatus).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) =>
              handleTypeChange(e.target.value as TripRequestType | "ALL")
            }
            value={typeFilter}
          >
            <option value="ALL">{pageCopy.filters.allTypes}</option>
            {TRIP_REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {pageCopy.filters.types[type]}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) =>
              handleLevelChange(e.target.value as TripRequestLevel | "ALL")
            }
            value={levelFilter}
          >
            <option value="ALL">{pageCopy.filters.allLevels}</option>
            {TRIP_REQUEST_LEVELS.map((level) => (
              <option key={level} value={level}>
                {pageCopy.filters.levels[level]}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) =>
              handlePaymentChange(
                e.target.value as TripPaymentStatusFilter | "ALL",
              )
            }
            value={paymentFilter}
          >
            <option value="ALL">{pageCopy.filters.allPayments}</option>
            <option value="NO_PAYMENT">{pageCopy.filters.noPayment}</option>
            {TRIP_PAYMENT_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {paymentStatusLabels[value] ?? value}
              </option>
            ))}
          </Select>
          {hasActiveFilters && (
            <button
              className="flex h-11 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:border-gray-300 hover:bg-neutral-50"
              onClick={clearFilters}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
              {pageCopy.filters.clearFilters}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-400">
            {trips.length} {pageCopy.filters.of} {total} {pageCopy.filters.count}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-11 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm shadow-sm placeholder:text-neutral-400 focus:border-gray-300 focus:outline-none"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={pageCopy.filters.searchPlaceholder}
              type="text"
              value={searchQuery}
            />
          </div>
        </div>
      </div>

      <TripRequestsTable
        copy={pageCopy}
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
