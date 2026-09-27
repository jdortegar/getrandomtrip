"use client";

import Link from "next/link";
import { Calendar, Loader2, Plane, Plus } from "lucide-react";
import { TravelerTripRow } from "@/components/app/dashboard/traveler/TravelerTripRow";
import { TravelerTripsFilters } from "@/components/app/dashboard/traveler/TravelerTripsFilters";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { Trip } from "@/lib/utils/trips";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import type { TravelerDashboardDict } from "@/lib/types/dictionary";

export type StatusFilter = "all" | "upcoming" | "completed";

interface TravelerTripsTableProps {
  copy: DashboardCopy;
  experience?: string;
  filter: StatusFilter;
  hasError?: boolean;
  isLoading?: boolean;
  locale: string;
  onClearFilters?: () => void;
  onExperienceChange?: (value: string) => void;
  onFilterChange: (filter: StatusFilter) => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  onSearchChange?: (value: string) => void;
  onTravelTypeChange?: (value: string) => void;
  page: number;
  pageCopy: TravelerDashboardDict["trips"];
  paginationCopy: { next: string; pageOf: string; previous: string };
  search?: string;
  total: number;
  totalPages: number;
  trips: Trip[];
  travelType?: string;
}

export function TravelerTripsTable({
  copy,
  experience = "all",
  filter,
  hasError = false,
  isLoading = false,
  locale,
  onClearFilters,
  onExperienceChange,
  onFilterChange,
  onPageChange,
  onRetry,
  onSearchChange,
  onTravelTypeChange,
  page,
  pageCopy,
  paginationCopy,
  search = "",
  total,
  totalPages,
  trips,
  travelType = "all",
}: TravelerTripsTableProps) {
  // Only a successful, unfiltered response can establish an empty account.
  const isEmptyAccount =
    !isLoading &&
    !hasError &&
    filter === "all" &&
    experience === "all" &&
    travelType === "all" &&
    !search.trim() &&
    total === 0;

  return (
    <div className="space-y-4" data-component="TravelerTripsTable">
      <TravelerTripsFilters
        copy={pageCopy}
        experience={experience}
        filter={filter}
        hasError={hasError}
        isLoading={isLoading}
        locale={locale}
        onClear={onClearFilters}
        onExperienceChange={onExperienceChange}
        onFilterChange={onFilterChange}
        onSearchChange={onSearchChange}
        onTravelTypeChange={onTravelTypeChange}
        search={search}
        shown={trips.length}
        total={total}
        travelType={travelType}
      />

      <TableLoadingOverlay
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        isLoading={isLoading}
      >
        {hasError ? (
          <div
            className="flex flex-col gap-3 items-center p-6 text-center"
            role="alert"
          >
            <p className="text-red-600 text-sm">{pageCopy.errorLoad}</p>
            <Button
              aria-busy={isLoading}
              disabled={isLoading}
              onClick={onRetry}
              variant="secondary"
            >
              {isLoading && (
                <Loader2 aria-hidden="true" className="animate-spin h-4 w-4" />
              )}
              {isLoading ? pageCopy.loading : pageCopy.retry}
            </Button>
          </div>
        ) : (
          <div inert={isLoading || undefined}>
            {isEmptyAccount ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <Plane className="h-14 w-14 text-neutral-300" />
                <div>
                  <p className="text-sm font-semibold text-neutral-700">
                    {copy.upcomingTrips.emptyTitle}
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {copy.upcomingTrips.emptyMessage}
                  </p>
                </div>
                <Button asChild size="md">
                  <Link href={pathForLocale(locale as Locale, "/journey")}>
                    <Plus className="h-4 w-4" />
                    {copy.upcomingTrips.emptyCta}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                        Trip
                      </th>
                      <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink sm:table-cell">
                        Destination
                      </th>
                      <th className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink md:table-cell">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Date
                        </span>
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                        Status
                      </th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trips.length === 0 ? (
                      <tr>
                        <td
                          className="px-5 py-10 text-center text-sm text-ink"
                          colSpan={5}
                        >
                          {isLoading
                            ? pageCopy.loading
                            : pageCopy.emptyFiltered}
                        </td>
                      </tr>
                    ) : (
                      trips.map((trip) => (
                        <TravelerTripRow
                          copy={copy}
                          key={trip.id}
                          locale={locale}
                          trip={trip}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </TableLoadingOverlay>

      <div
        className={cn(isLoading && "opacity-50 pointer-events-none")}
        hidden={hasError || isEmptyAccount}
        inert={isLoading || hasError || undefined}
      >
        <Pagination
          nextLabel={paginationCopy.next}
          onPageChange={(next) => {
            if (!isLoading && !hasError) onPageChange(next);
          }}
          page={page}
          pageOfLabel={paginationCopy.pageOf}
          previousLabel={paginationCopy.previous}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
