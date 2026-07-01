"use client";

import { MessageSquare, Star, ThumbsUp, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { TripperReviewsDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

export interface TripperReview {
  content: string;
  createdAt: string;
  destination: string;
  id: string;
  isPublic: boolean;
  packageTitle: string;
  rating: number;
  title: string;
  userAvatar: string | null;
  userName: string;
}

interface ReviewsPageClientProps {
  averageRating: number;
  detractors: number;
  dict: TripperReviewsDict;
  locale: string;
  nps: number;
  promoters: number;
  reviews: TripperReview[];
  totalReviews: number;
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

export function ReviewsPageClient({
  averageRating,
  detractors,
  dict: copy,
  locale,
  nps,
  promoters,
  reviews: initialReviews,
  totalReviews,
}: ReviewsPageClientProps) {
  const [reviews, setReviews] = useState<TripperReview[]>(initialReviews);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
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
                    card.gold ? "bg-yellow-400/15" : "bg-light-blue/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      card.gold ? "text-yellow-500" : "text-light-blue",
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-xl font-semibold text-neutral-900">
            {copy.list.title}
          </h3>
        </div>

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
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-light-blue/10 font-barlow-condensed text-lg font-bold text-light-blue">
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
      </div>
    </div>
  );
}
