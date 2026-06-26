"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/slices/userStore";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import { TripperDashboardSkeleton } from "@/components/app/dashboard/tripper/TripperDashboardSkeleton";
import { TripperStatsGrid } from "@/components/app/dashboard/tripper/TripperStatsGrid";
import { RecentBookingsList } from "@/components/app/dashboard/tripper/RecentBookingsList";
import { TripperKeyMetrics } from "@/components/app/dashboard/tripper/TripperKeyMetrics";
import { TripperQuickActions } from "@/components/app/dashboard/tripper/TripperQuickActions";
import type { TripperDashboardStats, RecentBooking } from "@/types/tripper";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

const EMPTY_STATS: TripperDashboardStats = {
  totalBookings: 0,
  monthlyRevenue: 0,
  averageRating: 0,
  activeExperiences: 0,
  totalClients: 0,
  conversionRate: 0,
};

function TripperContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();
  const copy = useDictionary((d) => d.tripperDashboard);
  const locale = useLocale();

  const currentUser = session?.user || user;

  const [stats, setStats] = useState<TripperDashboardStats>(EMPTY_STATS);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch("/api/tripper/dashboard");
        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.stats && data.recentBookings) {
          setStats(data.stats);
          setRecentBookings(data.recentBookings);
        } else {
          console.error("Error fetching tripper dashboard data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching tripper dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  return (
    <Section className="py-10!">
      <div className="rt-container">
        {loading ? (
          <TripperDashboardSkeleton />
        ) : (
          <div className="space-y-6">
            <TripperStatsGrid stats={stats} copy={copy.stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentBookingsList
                  bookings={recentBookings}
                  copy={{ ...copy.recentBookings, ...copy.status }}
                  locale={locale}
                />
              </div>
              <div className="space-y-6">
                <TripperKeyMetrics stats={stats} copy={copy.keyMetrics} />
                <TripperQuickActions copy={copy.quickActions} locale={locale} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

const TripperPage = dynamic(() => Promise.resolve(TripperPageComponent), {
  ssr: false,
});

function TripperPageComponent() {
  return (
    <SecureRoute requiredRole="tripper">
      <TripperContent />
    </SecureRoute>
  );
}

export default TripperPage;
