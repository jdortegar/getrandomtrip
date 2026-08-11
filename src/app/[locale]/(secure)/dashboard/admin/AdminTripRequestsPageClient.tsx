"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { TripRequestsFilterBar } from "@/components/app/admin/TripRequestsFilterBar";
import { TripRequestsKPIStrip } from "@/components/app/admin/TripRequestsKPIStrip";
import { TripRequestsTable } from "@/components/app/admin/TripRequestsTable";
import { useDictionary } from "@/hooks/useDictionary";
import { useTripRequests } from "@/hooks/useTripRequests";
import { resolveInitialStatusFilter } from "@/lib/admin/trip-status";
import type { StatusFilterValue } from "@/lib/admin/types";
import type { MarketingDictionary } from "@/lib/types/dictionary";

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(1);
  const { error, loading, statusCounts, total, trips } = useTripRequests({
    page,
    limit: PAGE_SIZE,
    status: statusFilter,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFilterChange(next: StatusFilterValue) {
    setStatusFilter(next);
    setPage(1);
  }

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

      <TripRequestsKPIStrip counts={statusCounts} labels={dict.tripStatus} />

      <TripRequestsFilterBar
        activeFilter={statusFilter}
        labels={{ all: pageCopy.filters.all, ...dict.tripStatus }}
        onFilterChange={handleFilterChange}
      />

      <TripRequestsTable
        copy={pageCopy}
        locale={locale}
        paymentStatusLabels={paymentStatusLabels}
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
