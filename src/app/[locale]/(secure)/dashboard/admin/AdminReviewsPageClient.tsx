"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";

import { SortButton } from "@/components/ui/SortButton";
import { TableIconButton } from "@/components/ui/TableIconButton";

import type { AdminReview } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import {
  REVIEW_SORT_DEFAULT,
  REVIEW_SORT_INITIAL_ORDER,
  type ReviewSortBy,
  type ReviewSortOrder,
} from "@/lib/reviews/sort";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
type StatusFilter = "all" | "approved" | "unapproved";

export function AdminReviewsPageClient() {
  const copy = useDictionary((d) => d.adminPages.reviews);
  const filterCopy = useDictionary((d) => d.common.tableFilters);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<ReviewSortBy>(
    REVIEW_SORT_DEFAULT.sortBy,
  );
  const [sortOrder, setSortOrder] = useState<ReviewSortOrder>(
    REVIEW_SORT_DEFAULT.sortOrder,
  );
  const hasActiveFilters = statusFilter !== "all" || searchQuery !== "";

  const queryPending = loading || searchQuery !== debouncedSearch;
  const beginRequest = useTableRequestGuard(
    JSON.stringify([
      page,
      statusFilter,
      searchQuery,
      debouncedSearch,
      sortBy,
      sortOrder,
    ]),
  );

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function fetchReviews() {
    if (searchQuery !== debouncedSearch) return;
    const isCurrent = beginRequest();
    if (!isCurrent()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortOrder,
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = (await res.json()) as {
        error?: string;
        reviews?: AdminReview[];
        total?: number;
      };
      if (!isCurrent()) return;
      if (!res.ok || !data.reviews) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setError(null);
      setReviews(data.reviews);
      setTotal(data.total ?? 0);
    } catch {
      if (isCurrent()) setError(copy.errorLoad);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }

  const refreshCurrentQuery = useCurrentTableRefresh(fetchReviews);
  function updateStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function clearFilters() {
    setStatusFilter("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  }

  function toggleSort(field: ReviewSortBy) {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(REVIEW_SORT_INITIAL_ORDER[field]);
    }
    setPage(1);
  }

  async function updateReview(
    id: string,
    payload: { isApproved?: boolean; isPublic?: boolean },
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) return;
      await refreshCurrentQuery();
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    void fetchReviews();
  }, [page, statusFilter, debouncedSearch, searchQuery, sortBy, sortOrder]);

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;
  if (error && !hasLoadedOnce)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const st = copy.status;
  const act = copy.actions;
  const sortCopy = copy.sort;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function ariaSortFor(
    field: ReviewSortBy,
  ): "ascending" | "descending" | "none" {
    if (sortBy !== field) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  }

  function sortAriaLabel(label: string): string {
    return sortCopy.ariaSortBy.replace("{field}", label);
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {copy.title}
        </h2>
      </div>

      <TableFilterToolbar
        copy={filterCopy}
        filters={[
          {
            id: "admin-reviews-status",
            label: filterCopy.status,
            value: statusFilter,
            onChange: (value) => updateStatusFilter(value as StatusFilter),
            options: [
              { value: "all", label: filterCopy.all },
              { value: "approved", label: copy.filters.approved },
              { value: "unapproved", label: copy.filters.unapproved },
            ],
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        hasError={!!error}
        isLoading={queryPending}
        onClear={clearFilters}
        search={{
          id: "admin-reviews-search",
          label: filterCopy.searchLabel,
          placeholder: filterCopy.searchName,
          value: searchQuery,
          onChange: (value) => {
            setSearchQuery(value);
            setPage(1);
          },
        }}
        shown={reviews.length}
        total={total}
      />

      <TableQueryBoundary
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        copy={filterCopy}
        error={error}
        isLoading={queryPending}
        onRetry={() => {
          if (!queryPending) void fetchReviews();
        }}
      >
        {reviews.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink">{copy.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th
                    aria-sort={ariaSortFor("traveler")}
                    className="px-5 py-3 text-left"
                  >
                    <SortButton
                      active={sortBy === "traveler"}
                      ariaLabel={sortAriaLabel(cols.traveler)}
                      label={cols.traveler}
                      onSort={() => toggleSort("traveler")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {cols.review}
                  </th>
                  <th
                    aria-sort={ariaSortFor("rating")}
                    className="px-5 py-3 text-left"
                  >
                    <SortButton
                      active={sortBy === "rating"}
                      ariaLabel={sortAriaLabel(cols.rating)}
                      label={cols.rating}
                      onSort={() => toggleSort("rating")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {cols.status}
                  </th>
                  <th
                    aria-sort={ariaSortFor("tripper")}
                    className="px-5 py-3 text-left"
                  >
                    <SortButton
                      active={sortBy === "tripper"}
                      ariaLabel={sortAriaLabel(cols.tripper)}
                      label={cols.tripper}
                      onSort={() => toggleSort("tripper")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {cols.tripId}
                  </th>
                  <th
                    aria-sort={ariaSortFor("created")}
                    className="px-5 py-3 text-left"
                  >
                    <SortButton
                      active={sortBy === "created"}
                      ariaLabel={sortAriaLabel(cols.created)}
                      label={cols.created}
                      onSort={() => toggleSort("created")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {cols.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.map((review) => {
                  const isBusy = savingId === review.id;
                  return (
                    <tr
                      className="transition-colors hover:bg-gray-50"
                      key={review.id}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {review.user.name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink">
                          {review.user.email}
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-sm text-neutral-700">
                        {review.title && (
                          <p className="mb-0.5 font-medium">{review.title}</p>
                        )}
                        <p
                          className={`text-xs text-neutral-600 ${expandedId === review.id ? "" : "line-clamp-2"}`}
                        >
                          {review.content}
                        </p>
                        {review.content.length > 120 && (
                          <button
                            className="mt-0.5 text-xs text-neutral-400 hover:text-neutral-700"
                            onClick={() =>
                              setExpandedId(
                                expandedId === review.id ? null : review.id,
                              )
                            }
                            type="button"
                          >
                            {expandedId === review.id
                              ? act.showLess
                              : act.showMore}
                          </button>
                        )}
                        {review.destination && (
                          <p className="mt-1 text-xs text-neutral-400">
                            {review.destination}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-700">
                        {review.rating}/5
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-[6px] border px-2 py-0.5 text-[11px] font-medium uppercase ${
                            review.isApproved
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {review.isApproved ? st.approved : st.pending}
                        </span>
                        {review.isApproved && (
                          <span className="ml-1.5 text-xs text-neutral-400">
                            {review.isPublic ? st.public : st.private}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">
                        {review.tripperName ?? "Randomtrip"}
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-400">
                        {review.tripRequestId ? (
                          <span title={review.tripRequestId}>
                            {review.tripRequestId.slice(0, 8)}…
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">
                        {new Date(review.createdAt).toLocaleDateString(
                          dateLocale,
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <TableIconButton
                            danger={review.isApproved}
                            disabled={isBusy}
                            onClick={() =>
                              void updateReview(review.id, {
                                isApproved: !review.isApproved,
                              })
                            }
                            title={
                              review.isApproved ? act.unapprove : act.approve
                            }
                          >
                            {review.isApproved ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </TableIconButton>
                          {review.tripperName === null && review.isApproved && (
                            <TableIconButton
                              disabled={isBusy}
                              onClick={() =>
                                void updateReview(review.id, {
                                  isApproved: review.isApproved,
                                  isPublic: !review.isPublic,
                                })
                              }
                              title={review.isPublic ? act.hide : act.publish}
                            >
                              {review.isPublic ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </TableIconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableQueryBoundary>

      <div inert={queryPending || !!error || undefined}>
        <Pagination
          nextLabel={paginationCopy.next}
          onPageChange={(next) => {
            if (!queryPending && !error) setPage(next);
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
