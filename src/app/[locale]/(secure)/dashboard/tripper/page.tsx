import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTripperDashboardStats,
  getTripperRecentBookings,
} from "@/lib/db/tripper-queries";
import type { RecentBooking } from "@/types/tripper";
import TripperDashboardPageClient from "./TripperDashboardPageClient";

export default async function TripperPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [stats, recentBookings] = userId
    ? await Promise.all([
        getTripperDashboardStats(userId),
        // Pre-existing mismatch, not introduced here: this returns a
        // lowercased status/paymentStatus, while RecentBooking types them as
        // uppercase literals. Previously masked by the JSON round-trip
        // through /api/tripper/dashboard + an unchecked client-side cast —
        // preserved as-is rather than silently changed by this SSR move.
        getTripperRecentBookings(userId, 10) as Promise<RecentBooking[]>,
      ])
    : [null, [] as RecentBooking[]];

  return (
    <TripperDashboardPageClient
      initialRecentBookings={recentBookings}
      initialStats={stats}
    />
  );
}
