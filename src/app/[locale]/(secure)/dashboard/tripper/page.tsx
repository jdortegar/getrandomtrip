"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/slices/userStore";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import { PageHeading } from "@/components/layout/PageHeading";
import { TripperDashboardSkeleton } from "@/components/app/dashboard/tripper/TripperDashboardSkeleton";
import { TripperStatsGrid } from "@/components/app/dashboard/tripper/TripperStatsGrid";
import { RecentBookingsList } from "@/components/app/dashboard/tripper/RecentBookingsList";
import { TripperQuickActions } from "@/components/app/dashboard/tripper/TripperQuickActions";
import { TripperKeyMetrics } from "@/components/app/dashboard/tripper/TripperKeyMetrics";
import { TripperPackagesSummary } from "@/components/app/dashboard/tripper/TripperPackagesSummary";
import type { TripperDashboardStats, RecentBooking } from "@/types/tripper";
import { useDictionary } from "@/hooks/useDictionary";

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
  const copy = useDictionary(d => d.tripperDashboard);

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
    <>
      <Section>
        <div className="rt-container">
          <PageHeading
            description={copy.header.description}
            title={copy.header.title}
          />
          {loading ? (
            <TripperDashboardSkeleton />
          ) : (
            <div className="space-y-8">
              <TripperStatsGrid stats={stats} copy={copy.stats} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RecentBookingsList
                  bookings={recentBookings}
                  copy={{ ...copy.recentBookings, ...copy.status }}
                />
                <div className="space-y-6">
                  <TripperQuickActions copy={copy.quickActions} />
                  <TripperKeyMetrics stats={stats} copy={copy.keyMetrics} />
                </div>
              </div>

              <TripperPackagesSummary
                activeExperiences={stats.activeExperiences}
                copy={copy.experiences}
              />
            </div>
          )}
        </div>
      </Section>
    </>
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
