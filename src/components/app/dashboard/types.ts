import type { DashboardDict } from "@/lib/types/dictionary";

export interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalSpent: number;
  averageRating: number;
}

export type DashboardCopy = DashboardDict;
