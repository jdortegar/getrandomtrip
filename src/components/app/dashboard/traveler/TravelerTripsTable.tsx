"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Plane } from "lucide-react";
import { TravelerTripRow } from "@/components/app/dashboard/traveler/TravelerTripRow";
import { TravelerTripsFilters } from "@/components/app/dashboard/traveler/TravelerTripsFilters";
import { Button } from "@/components/ui/Button";
import { ButtonV2 } from "@/components/ui/ButtonV2";
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

      <TableLoadingOverlay className="rounded-2xl" isLoading={isLoading}>
        {hasError ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200"
            role="alert"
          >
            <p className="text-sm text-red-600">{pageCopy.errorLoad}</p>
            <Button
              aria-busy={isLoading}
              disabled={isLoading}
              onClick={onRetry}
              variant="secondary"
            >
              {isLoading && (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              )}
              {isLoading ? pageCopy.loading : pageCopy.retry}
            </Button>
          </div>
        ) : (
          <div inert={isLoading || undefined}>
            {isEmptyAccount ? (
              <div className="flex flex-col items-center gap-5 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-200">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-primary">
                  <Plane aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-barlow-condensed text-2xl font-bold uppercase leading-none text-ink">
                    {copy.upcomingTrips.emptyTitle}
                  </p>
                  <p className="mt-2 text-sm text-neutral-600">
                    {copy.upcomingTrips.emptyMessage}
                  </p>
                </div>
                <ButtonV2 asChild size="sm">
                  <Link href={pathForLocale(locale as Locale, "/journey")}>
                    {copy.upcomingTrips.emptyCta}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </ButtonV2>
              </div>
            ) : trips.length === 0 ? (
              <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-gray-200">
                {isLoading ? pageCopy.loading : pageCopy.emptyFiltered}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {trips.map((trip) => (
                  <TravelerTripRow
                    copy={copy}
                    key={trip.id}
                    locale={locale}
                    trip={trip}
                  />
                ))}
              </ul>
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
