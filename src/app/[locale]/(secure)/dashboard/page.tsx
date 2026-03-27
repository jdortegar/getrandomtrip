"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import SecureRoute from "@/components/auth/SecureRoute";
import {
  AllTripsGrid,
  DashboardStatsGrid,
  FinancialSummary,
  getDashboardCopy,
  QuickActions,
  RecentPaymentsTable,
  UnpaidTripsAlert,
  UpcomingTripsPanel,
  type DashboardStats,
} from "@/components/app/dashboard";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { useUserStore } from "@/store/slices";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { useParams, useRouter } from "next/navigation";
import {
  getPayments,
  getTrips,
  type Payment,
  type Trip,
} from "@/lib/utils/trips";

function DashboardContent() {
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const { user } = useUserStore();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "es";
  const copy = getDashboardCopy(locale);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    totalSpent: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  const currentUser = session?.user || user;

  // Normalize role - handle both uppercase (DB) and lowercase (store) formats
  const normalizeRole = (role: string | undefined): string | null => {
    if (!role) return null;
    return role.toLowerCase();
  };

  // Get role from multiple possible sources (session might have uppercase TRIPPER)
  const rawRole =
    (session?.user as any)?.role || (currentUser as any)?.role || user?.role;

  const userRole = normalizeRole(rawRole);

  // Redirect trippers to their dashboard - check once and redirect immediately
  useEffect(() => {
    if (!hasRedirected && userRole === "tripper") {
      setHasRedirected(true);
      // Use push with replace: true to avoid adding to history
      router.push("/dashboard/tripper");
    }
  }, [userRole, router, hasRedirected]);

  // Fetch user trips and payments (must run before any conditional return — Rules of Hooks)
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (userRole === "tripper") return;
    if (!session?.user?.email) return;

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

        const completed = mappedTrips.filter(
          (t: Trip) => t.status === "COMPLETED",
        ).length;
        const upcoming = mappedTrips.filter(
          (t: Trip) => t.status === "CONFIRMED" || t.status === "REVEALED",
        ).length;

        const totalSpent = allPayments
          .filter(
            (p: Payment) => p.status === "APPROVED" || p.status === "COMPLETED",
          )
          .reduce((sum: number, p: Payment) => sum + p.amount, 0);

        const ratingsTrips = mappedTrips.filter((t: Trip) => t.customerRating);
        const avgRating =
          ratingsTrips.length > 0
            ? ratingsTrips.reduce(
                (sum: number, t: Trip) => sum + (t.customerRating || 0),
                0,
              ) / ratingsTrips.length
            : 0;

        setStats({
          totalTrips: mappedTrips.length,
          upcomingTrips: upcoming,
          completedTrips: completed,
          totalSpent,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, sessionStatus, userRole]);

  const unpaidTrips = useMemo(() => {
    return trips.filter((t) => {
      if (t.status === "CANCELLED") return false;
      const ps = t.payment?.status;
      if (ps === "APPROVED" || ps === "COMPLETED") return false;
      return true;
    });
  }, [trips]);

  const upcomingTrips = trips
    .filter((t) => t.status === "CONFIRMED" || t.status === "REVEALED")
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "REVEALED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return copy.tripStatus[status] ?? status;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "text-green-600";
      case "PENDING":
        return "text-yellow-600";
      case "FAILED":
      case "REJECTED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (userRole === "tripper") {
    return <LoadingSpinner />;
  }

  if (sessionStatus === "loading" || (!session?.user?.email && !user?.id)) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <HeaderHero
        description={copy.header.description}
        fallbackImage="/images/hero-image-1.jpeg"
        title={`${copy.header.helloPrefix}, ${currentUser?.name || copy.header.helloFallbackName}!`}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <Section>
        <div className="rt-container">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <DashboardStatsGrid copy={copy} stats={stats} />
              <UnpaidTripsAlert
                copy={copy}
                locale={locale}
                trips={unpaidTrips}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <UpcomingTripsPanel
                  copy={copy}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  trips={upcomingTrips}
                />

                {/* Sidebar */}
                <div className="space-y-6">
                  <QuickActions copy={copy} />
                  <FinancialSummary
                    copy={copy}
                    payments={payments}
                    stats={stats}
                  />
                </div>
              </div>
              <RecentPaymentsTable
                copy={copy}
                getPaymentStatusColor={getPaymentStatusColor}
                payments={payments}
              />
              <AllTripsGrid
                copy={copy}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                trips={trips}
              />
            </>
          )}
        </div>
      </Section>
    </>
  );
}

const DashboardPage = dynamic(() => Promise.resolve(DashboardPageComponent), {
  ssr: false,
});

function DashboardPageComponent() {
  return (
    <SecureRoute>
      <DashboardContent />
    </SecureRoute>
  );
}

export default DashboardPage;
