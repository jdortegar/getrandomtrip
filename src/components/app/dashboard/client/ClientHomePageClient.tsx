"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DashboardStatsGrid,
  UnpaidTripsAlert,
  type DashboardStats,
} from "@/components/app/dashboard";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
import { UpcomingTripsList } from "@/components/app/dashboard/client/UpcomingTripsList";
import type { DashboardCopy } from "@/components/app/dashboard/types";
import {
  getPayments,
  getTrips,
  type Payment,
  type Trip,
} from "@/lib/utils/trips";

interface ClientHomePageClientProps {
  copy: DashboardCopy;
  eyebrow: string;
  heading: string;
  locale: string;
}

function computeDashboardStats(
  mappedTrips: Trip[],
  allPayments: Payment[],
): DashboardStats {
  const completed = mappedTrips.filter((t) => t.status === "COMPLETED").length;
  const upcoming = mappedTrips.filter(
    (t) => t.status === "CONFIRMED" || t.status === "REVEALED",
  ).length;
  const totalSpent = allPayments
    .filter((p) => p.status === "APPROVED" || p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const ratingsTrips = mappedTrips.filter((t) => t.customerRating);
  const avgRating =
    ratingsTrips.length > 0
      ? ratingsTrips.reduce((sum, t) => sum + (t.customerRating || 0), 0) /
        ratingsTrips.length
      : 0;

  return {
    averageRating: avgRating,
    completedTrips: completed,
    totalSpent,
    totalTrips: mappedTrips.length,
    upcomingTrips: upcoming,
  };
}

export function ClientHomePageClient({
  copy,
  eyebrow,
  heading,
  locale,
}: ClientHomePageClientProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    averageRating: 0,
    completedTrips: 0,
    totalSpent: 0,
    totalTrips: 0,
    upcomingTrips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const mappedTrips = await getTrips();
        if (cancelled) return;
        setTrips(mappedTrips);

        const allPayments = await getPayments();
        if (cancelled) return;
        setPayments(allPayments);
        setStats(computeDashboardStats(mappedTrips, allPayments));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  const unpaidTrips = useMemo(
    () =>
      trips.filter((t) => {
        if (t.status === "CANCELLED") return false;
        const ps = t.payment?.status;
        if (ps === "APPROVED" || ps === "COMPLETED") return false;
        return true;
      }),
    [trips],
  );

  const handleTripDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/trips/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(copy.unpaidTrips.deleteFailed);
        throw new Error("Trip delete failed");
      }
      setTrips((prev) => {
        const next = prev.filter((t) => t.id !== id);
        setStats(computeDashboardStats(next, payments));
        return next;
      });
    },
    [copy.unpaidTrips.deleteFailed, payments],
  );

  if (loading) {
    return <DashboardSkeleton variant="home" />;
  }

  return (
    <div className="space-y-10 py-10">
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-neutral-900">
            {heading}
          </h2>
        </div>
        <DashboardStatsGrid copy={copy} stats={stats} />
      </section>

      <UnpaidTripsAlert
        copy={copy}
        locale={locale}
        onDelete={handleTripDelete}
        trips={unpaidTrips}
      />

      <UpcomingTripsList copy={copy} locale={locale} trips={trips} />
    </div>
  );
}
