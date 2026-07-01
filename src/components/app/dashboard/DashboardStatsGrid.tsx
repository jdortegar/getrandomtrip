import { Calendar, DollarSign, Plane, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { DashboardCopy, DashboardStats } from "./types";

interface DashboardStatsGridProps {
  copy: DashboardCopy;
  stats: DashboardStats;
}

export function DashboardStatsGrid({ copy, stats }: DashboardStatsGridProps) {
  const statCards: Array<{
    gold?: boolean;
    icon: LucideIcon;
    key: string;
    label: string;
    value: string | number;
  }> = [
    {
      icon: Plane,
      key: "total-trips",
      label: copy.stats.totalTrips,
      value: stats.totalTrips,
    },
    {
      icon: Calendar,
      key: "upcoming-trips",
      label: copy.stats.upcomingTrips,
      value: stats.upcomingTrips,
    },
    {
      icon: DollarSign,
      key: "total-spent",
      label: copy.stats.totalSpent,
      value: `$${(stats.totalSpent ?? 0).toFixed(0)}`,
    },
    {
      gold: true,
      icon: Star,
      key: "average-rating",
      label: copy.stats.averageRating,
      value: stats.averageRating > 0 ? (stats.averageRating ?? 0).toFixed(1) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
            key={card.key}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {card.label}
              </p>
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                  card.gold ? "bg-yellow-400/15" : "bg-light-blue/10",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    card.gold ? "text-yellow-500" : "text-light-blue",
                  )}
                  strokeWidth={1.8}
                />
              </span>
            </div>
            <div className="flex items-stretch gap-3.5">
              <span className="w-1 rounded-full bg-yellow-400" />
              <p className="font-barlow-condensed text-5xl font-extrabold leading-[0.9] text-neutral-900">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
