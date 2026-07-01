"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Star } from "lucide-react";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
import type { ClientDashboardDict } from "@/lib/types/dictionary";
import { getTrips, type Trip } from "@/lib/utils/trips";

interface ClientReviewsPageClientProps {
  copy: ClientDashboardDict["reviews"];
  locale: string;
}

export function ClientReviewsPageClient({
  copy,
  locale,
}: ClientReviewsPageClientProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  useEffect(() => {
    let cancelled = false;

    async function fetchTrips() {
      try {
        setLoading(true);
        const mappedTrips = await getTrips();
        if (!cancelled) setTrips(mappedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedWithToken = trips.filter(
    (t) => t.status === "COMPLETED" && t.reviewToken,
  );

  const pendingCount = completedWithToken.filter(
    (t) => !t.reviewSubmittedAt,
  ).length;

  if (loading) {
    return <DashboardSkeleton />;
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
        <p className="mt-2 text-sm text-neutral-600">{copy.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {copy.kpis.totalReviewed}
          </p>
          <p className="mt-2 font-barlow-condensed text-3xl font-extrabold text-gray-900">
            {completedWithToken.filter((t) => t.reviewSubmittedAt).length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {copy.kpis.averageRating}
          </p>
          <p className="mt-2 font-barlow-condensed text-3xl font-extrabold text-gray-900">
            {pendingCount > 0 ? pendingCount : "—"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            {copy.listTitle}
          </h3>
        </div>

        {completedWithToken.length === 0 ? (
          <div className="py-16 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
            <p className="mb-2 text-sm font-semibold text-neutral-700">
              {copy.emptyTitle}
            </p>
            <p className="text-sm text-neutral-500">{copy.emptyDescription}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {completedWithToken.map((trip) => {
              const submitted = Boolean(trip.reviewSubmittedAt);
              return (
                <li
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={trip.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {trip.type} · {trip.level}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {new Date(trip.endDate).toLocaleDateString(dateLocale)}
                    </p>
                  </div>

                  {submitted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Enviada
                    </span>
                  ) : (
                    <a
                      className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-gray-900 transition-colors hover:bg-yellow-500"
                      href={`/${locale}/review/${trip.reviewToken}`}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Dejar reseña
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
