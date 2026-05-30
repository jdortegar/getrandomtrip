"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { AdminReview } from "@/lib/admin/types";
import { useDictionary } from "@/hooks/useDictionary";

export function AdminReviewsPageClient() {
  const copy = useDictionary((d) => d.adminPages.reviews);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

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
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-5 py-4">
        <p className="text-xs text-neutral-500">
          {copy.count.replace("{n}", String(reviews.length))}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                {[
                  cols.traveler,
                  cols.review,
                  cols.rating,
                  cols.status,
                  cols.created,
                  cols.actions,
                ].map((h) => (
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-neutral-600"
                    key={h}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  className="border-b border-gray-100 last:border-0"
                  key={review.id}
                >
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    <p>{review.user.name}</p>
                    <p className="text-xs text-neutral-500">
                      {review.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    <p>{review.title}</p>
                    <p className="text-xs text-neutral-500">
                      {review.destination}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {review.rating}/5
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-500">
                    {review.isApproved ? st.approved : st.pending} ·{" "}
                    {review.isPublic ? st.public : st.private}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                        disabled={savingId === review.id}
                        onClick={() =>
                          void updateReview(review.id, {
                            isApproved: !review.isApproved,
                          })
                        }
                        type="button"
                      >
                        {review.isApproved ? act.unapprove : act.approve}
                      </button>
                      <button
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                        disabled={savingId === review.id}
                        onClick={() =>
                          void updateReview(review.id, {
                            isPublic: !review.isPublic,
                          })
                        }
                        type="button"
                      >
                        {review.isPublic ? act.hide : act.publish}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviews.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              {copy.empty}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
