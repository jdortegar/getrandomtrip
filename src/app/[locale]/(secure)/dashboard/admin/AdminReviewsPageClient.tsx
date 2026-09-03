"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, Search, X } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { SortButton } from "@/components/ui/SortButton";
import { TableIconButton } from "@/components/ui/TableIconButton";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
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
const SELECT_CLASS =
  "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";
type StatusFilter = "all" | "approved" | "unapproved";

export function AdminReviewsPageClient() {
  const copy = useDictionary((d) => d.adminPages.reviews);
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
  const [sortBy, setSortBy] = useState<ReviewSortBy>(REVIEW_SORT_DEFAULT.sortBy);
  const [sortOrder, setSortOrder] = useState<ReviewSortOrder>(
    REVIEW_SORT_DEFAULT.sortOrder,
  );
  const hasActiveFilters = statusFilter !== "all" || searchQuery !== "";

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function fetchReviews() {
    setLoading(true);
    setError(null);
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
      if (!res.ok || !data.reviews) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setReviews(data.reviews);
      setTotal(data.total ?? 0);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

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
      await fetchReviews();
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    void fetchReviews();
  }, [page, statusFilter, debouncedSearch, sortBy, sortOrder]);

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;
  if (error && !hasLoadedOnce)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const st = copy.status;
  const act = copy.actions;
  const sortCopy = copy.sort;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function ariaSortFor(field: ReviewSortBy): "ascending" | "descending" | "none" {
    if (sortBy !== field) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  }

  function sortAriaLabel(label: string): string {
    return sortCopy.ariaSortBy.replace("{field}", label);
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className={SELECT_CLASS}
            onChange={(e) =>
              updateStatusFilter(e.target.value as StatusFilter)
            }
            value={statusFilter}
          >
            <option value="all">{copy.filters.allStatuses}</option>
            <option value="approved">{copy.filters.approved}</option>
            <option value="unapproved">{copy.filters.unapproved}</option>
          </Select>
          {hasActiveFilters && (
            <button
              className="flex h-11 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:border-gray-300 hover:bg-neutral-50"
              onClick={clearFilters}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-400">
            {copy.count.replace("{n}", String(total))}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-11 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm shadow-sm placeholder:text-neutral-400 focus:border-gray-300 focus:outline-none"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={copy.filters.searchPlaceholder}
              type="text"
              value={searchQuery}
            />
          </div>
        </div>
      </div>

      <TableLoadingOverlay
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        isLoading={loading}
      >
        {error && (
          <div
            className="border-b border-red-100 bg-red-50 p-3 text-center text-sm text-red-600"
            role="alert"
          >
            {error}
          </div>
        )}
        {reviews.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th aria-sort={ariaSortFor("traveler")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "traveler"}
                      ariaLabel={sortAriaLabel(cols.traveler)}
                      label={cols.traveler}
                      onSort={() => toggleSort("traveler")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.review}
                  </th>
                  <th aria-sort={ariaSortFor("rating")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "rating"}
                      ariaLabel={sortAriaLabel(cols.rating)}
                      label={cols.rating}
                      onSort={() => toggleSort("rating")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.status}
                  </th>
                  <th aria-sort={ariaSortFor("tripper")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "tripper"}
                      ariaLabel={sortAriaLabel(cols.tripper)}
                      label={cols.tripper}
                      onSort={() => toggleSort("tripper")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.tripId}
                  </th>
                  <th aria-sort={ariaSortFor("created")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "created"}
                      ariaLabel={sortAriaLabel(cols.created)}
                      label={cols.created}
                      onSort={() => toggleSort("created")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
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
                        <p className="text-sm font-semibold text-neutral-900">
                          {review.user.name}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
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
                          className={`rounded-[6px] border px-2 py-0.5 text-[11px] font-medium ${
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
                      <td className="px-5 py-4 text-sm text-neutral-500">
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
                      <td className="px-5 py-4 text-sm text-neutral-500">
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
                          {review.tripperName === null &&
                            review.isApproved && (
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
      </TableLoadingOverlay>

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
