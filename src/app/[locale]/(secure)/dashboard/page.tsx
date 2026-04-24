"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import SecureRoute from "@/components/auth/SecureRoute";
import {
  AllTripsGrid,
  DashboardStatsGrid,
  FinancialSummary,
  QuickActions,
  UnpaidTripsAlert,
  UpcomingTripsPanel,
  type DashboardStats,
} from "@/components/app/dashboard";

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
      ? ratingsTrips.reduce(
          (sum, t) => sum + (t.customerRating || 0),
          0,
        ) / ratingsTrips.length
      : 0;
  return {
    totalTrips: mappedTrips.length,
    upcomingTrips: upcoming,
    completedTrips: completed,
    totalSpent,
    averageRating: avgRating,
  };
}
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { useUserStore } from "@/store/slices";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
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
  const copy = locale.startsWith("en") ? enCopy.dashboard : esCopy.dashboard;
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

        setStats(computeDashboardStats(mappedTrips, allPayments));
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

  const paidTrips = useMemo(() => {
    return trips.filter((t) => {
      const ps = t.payment?.status;
      return ps === "APPROVED" || ps === "COMPLETED";
    });
  }, [trips]);

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
    const typedStatus = status as keyof typeof copy.tripStatus;
    return copy.tripStatus[typedStatus] ?? status;
  };

  if (userRole === "tripper") {
    return <LoadingSpinner />;
  }

  if (sessionStatus === "loading") {
    return <LoadingSpinner />;
  }

  if (!session?.user?.email && !user?.id) {
    return null;
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
            <DashboardSkeleton />
          ) : (
            <div className="space-y-8">
              <DashboardStatsGrid copy={copy} stats={stats} />
              <UnpaidTripsAlert
                copy={copy}
                locale={locale}
                onDelete={handleTripDelete}
                trips={unpaidTrips}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <UpcomingTripsPanel
                  copy={copy}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  locale={locale}
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
              <AllTripsGrid
                copy={copy}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                locale={locale}
                trips={paidTrips}
              />
            </div>
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
