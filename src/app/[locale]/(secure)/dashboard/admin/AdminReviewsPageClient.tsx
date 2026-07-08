"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { TableIconButton } from "@/components/ui/TableIconButton";
import type { AdminReview } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

export function AdminReviewsPageClient() {
  const copy = useDictionary((d) => d.adminPages.reviews);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchReviews() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = (await res.json()) as {
        error?: string;
        reviews?: AdminReview[];
      };
      if (!res.ok || !data.reviews) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setReviews(data.reviews);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
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
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const st = copy.status;
  const act = copy.actions;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.title}
        </h2>
      </div>

      <div className="flex items-center justify-end">
        <span className="text-[13px] text-neutral-400">
          {copy.count.replace("{n}", String(reviews.length))}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {reviews.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.traveler}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.review}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.rating}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.tripper}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.tripId}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.created}
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
      </div>
    </div>
  );
}
