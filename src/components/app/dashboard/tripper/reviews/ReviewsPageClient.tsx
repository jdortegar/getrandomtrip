"use client";

import { MessageSquare, Search, Star, ThumbsUp, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { SortButton } from "@/components/ui/SortButton";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { useDictionary } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import {
  REVIEW_SORT_DEFAULT,
  REVIEW_SORT_INITIAL_ORDER,
  type ReviewSortOrder,
  type TripperReviewSortBy,
} from "@/lib/reviews/sort";
import type { TripperReviewsDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const SELECT_CLASS =
  "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";
type StatusFilter = "all" | "approved" | "unapproved";

export interface TripperReview {
  content: string;
  createdAt: string;
  destination: string;
  id: string;
  isApproved: boolean;
  isPublic: boolean;
  packageTitle: string;
  rating: number;
  title: string;
  userAvatar: string | null;
  userName: string;
}

interface ReviewsStats {
  averageRating: number;
  detractors: number;
  nps: number;
  promoters: number;
  totalReviews: number;
}

const EMPTY_STATS: ReviewsStats = {
  averageRating: 0,
  detractors: 0,
  nps: 0,
  promoters: 0,
  totalReviews: 0,
};

interface ReviewsPageClientProps {
  dict: TripperReviewsDict;
  locale: string;
}

interface KpiCard {
  caption?: string;
  gold?: boolean;
  icon: LucideIcon;
  key: string;
  label: string;
  value: string | number;
  valueClassName?: string;
}

function npsColor(nps: number): string {
  if (nps >= 50) return "text-green-600";
  if (nps >= 0) return "text-yellow-600";
  return "text-red-600";
}

export function ReviewsPageClient({ dict: copy, locale }: ReviewsPageClientProps) {
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const [reviews, setReviews] = useState<TripperReview[]>([]);
  const [stats, setStats] = useState<ReviewsStats>(EMPTY_STATS);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<TripperReviewSortBy>(
    REVIEW_SORT_DEFAULT.sortBy,
  );
  const [sortOrder, setSortOrder] = useState<ReviewSortOrder>(
    REVIEW_SORT_DEFAULT.sortOrder,
  );
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const { averageRating, detractors, nps, promoters, totalReviews } = stats;
  const hasActiveFilters = statusFilter !== "all" || searchQuery !== "";

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;

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

        const res = await fetch(`/api/tripper/reviews?${params.toString()}`);
        const data = (await res.json()) as {
          error?: string;
          reviews?: TripperReview[];
          total?: number;
        } & Partial<ReviewsStats>;
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? copy.errorLoad);
          return;
        }
        setReviews(data.reviews ?? []);
        setTotal(data.total ?? 0);
        setStats({
          averageRating: data.averageRating ?? 0,
          detractors: data.detractors ?? 0,
          nps: data.nps ?? 0,
          promoters: data.promoters ?? 0,
          totalReviews: data.totalReviews ?? 0,
        });
      } catch {
        if (!cancelled) setError(copy.errorLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, debouncedSearch, sortBy, sortOrder]);

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

  function toggleSort(field: TripperReviewSortBy) {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(REVIEW_SORT_INITIAL_ORDER[field]);
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function togglePublish(review: TripperReview) {
    setTogglingId(review.id);
    const nextValue = !review.isPublic;
    // Optimistic update
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, isPublic: nextValue } : r)),
    );
    try {
      const res = await fetch(`/api/tripper/reviews/${review.id}`, {
        body: JSON.stringify({ isPublic: nextValue }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        // Revert on failure
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, isPublic: review.isPublic } : r,
          ),
        );
      }
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, isPublic: review.isPublic } : r,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  }

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;
  if (error && !hasLoadedOnce)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const kpis: KpiCard[] = [
    {
      gold: true,
      icon: Star,
      key: "average-rating",
      label: copy.kpis.averageRating,
      value: averageRating > 0 ? averageRating.toFixed(1) : "—",
    },
    {
      icon: MessageSquare,
      key: "total-reviews",
      label: copy.kpis.totalReviews,
      value: totalReviews,
    },
    {
      icon: TrendingUp,
      key: "nps",
      label: copy.kpis.nps,
      value: `${nps > 0 ? "+" : ""}${nps.toFixed(0)}`,
      valueClassName: npsColor(nps),
    },
    {
      caption: copy.kpis.detractorsCaption.replace(
        "{count}",
        String(detractors),
      ),
      icon: ThumbsUp,
      key: "promoters",
      label: copy.kpis.promoters,
      value: promoters,
    },
  ];

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <div
              className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
              key={card.key}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  {card.label}
                </p>
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                    card.gold ? "bg-yellow-400/15" : "bg-secondary/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      card.gold ? "text-yellow-500" : "text-secondary",
                    )}
                    strokeWidth={1.8}
                  />
                </span>
              </div>
              <div className="flex items-stretch gap-3.5">
                <span className="w-1 rounded-full bg-yellow-400" />
                <div>
                  <p
                    className={cn(
                      "font-barlow-condensed text-5xl font-extrabold leading-[0.9] text-gray-900",
                      card.valueClassName,
                    )}
                  >
                    {card.value}
                  </p>
                  {card.caption && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {card.caption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-xl font-semibold text-neutral-900">
            {copy.list.title}
          </h3>
        </div>

        <div
          aria-label={copy.sort.groupLabel}
          className="flex items-center gap-6 border-b border-gray-200 bg-gray-50 px-5 py-3"
          role="group"
        >
          <SortButton
            active={sortBy === "rating"}
            ariaLabel={copy.sort.ariaSortBy.replace("{field}", copy.sort.rating)}
            ariaPressed={sortBy === "rating"}
            label={copy.sort.rating}
            onSort={() => toggleSort("rating")}
            order={sortOrder}
          />
          <SortButton
            active={sortBy === "created"}
            ariaLabel={copy.sort.ariaSortBy.replace("{field}", copy.sort.created)}
            ariaPressed={sortBy === "created"}
            label={copy.sort.created}
            onSort={() => toggleSort("created")}
            order={sortOrder}
          />
        </div>

        <TableLoadingOverlay isLoading={loading}>
          {error && (
            <div
              className="border-b border-red-100 bg-red-50 p-3 text-center text-sm text-red-600"
              role="alert"
            >
              {error}
            </div>
          )}
          {reviews.length === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-2 text-sm font-semibold text-neutral-700">
                {copy.emptyState.title}
              </p>
              <p className="mx-auto max-w-md text-sm text-neutral-500">
                {copy.emptyState.description}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <li className="px-5 py-5" key={review.id}>
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary/10 font-barlow-condensed text-lg font-bold text-secondary">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">
                            {review.userName}
                          </p>
                          {(review.packageTitle || review.destination) && (
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {[review.packageTitle, review.destination]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating
                                    ? "fill-current text-yellow-500"
                                    : "text-neutral-300",
                                )}
                                key={i}
                              />
                            ))}
                          </div>
                          <span
                            className={cn(
                              "rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
                              review.isApproved
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-amber-200 bg-amber-50 text-amber-700",
                            )}
                          >
                            {review.isApproved
                              ? copy.status.approved
                              : copy.status.pending}
                          </span>
                        </div>
                      </div>
                      {review.title && (
                        <p className="mt-2 text-sm font-medium text-neutral-900">
                          {review.title}
                        </p>
                      )}
                      {review.content && (
                        <p className="mt-1 text-sm text-neutral-700">
                          {review.content}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-neutral-400">
                          {formatDate(review.createdAt)}
                        </p>
                        <button
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
                            review.isPublic
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                          )}
                          disabled={togglingId === review.id}
                          onClick={() => void togglePublish(review)}
                          type="button"
                        >
                          {review.isPublic ? "Publicado" : "Publicar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TableLoadingOverlay>
      </div>

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
