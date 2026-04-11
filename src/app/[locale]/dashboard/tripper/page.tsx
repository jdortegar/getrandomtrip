"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useUserStore } from "@/store/slices/userStore";
import SecureRoute from "@/components/auth/SecureRoute";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { TripperDashboardSkeleton } from "@/components/app/dashboard/tripper/TripperDashboardSkeleton";
import { TripperStatsGrid } from "@/components/app/dashboard/tripper/TripperStatsGrid";
import { RecentBookingsList } from "@/components/app/dashboard/tripper/RecentBookingsList";
import { TripperQuickActions } from "@/components/app/dashboard/tripper/TripperQuickActions";
import { TripperKeyMetrics } from "@/components/app/dashboard/tripper/TripperKeyMetrics";
import { TripperPackagesSummary } from "@/components/app/dashboard/tripper/TripperPackagesSummary";
import type { TripperDashboardStats, RecentBooking } from "@/types/tripper";
import esCopy from "@/dictionaries/es.json";
import enCopy from "@/dictionaries/en.json";

function getTripperCopy(locale: string) {
  return locale.startsWith("en")
    ? enCopy.tripperDashboard
    : esCopy.tripperDashboard;
}

const EMPTY_STATS: TripperDashboardStats = {
  totalBookings: 0,
  monthlyRevenue: 0,
  averageRating: 0,
  activePackages: 0,
  totalClients: 0,
  conversionRate: 0,
};

function TripperContent() {
  const { data: session } = useSession();
  const { user } = useUserStore();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = getTripperCopy(locale);

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
      <HeaderHero
        title={copy.header.title}
        description={copy.header.description}
        videoSrc="/videos/hero-video-1.mp4"
        fallbackImage="/images/bg-playa-mexico.jpg"
      />

      <Section>
        <div className="rt-container">
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
                activePackages={stats.activePackages}
                copy={copy.packages}
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
