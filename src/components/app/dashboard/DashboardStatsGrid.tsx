import { Calendar, DollarSign, Plane, Star } from "lucide-react";
import type { DashboardCopy, DashboardStats } from "./types";
import type { LucideIcon } from "lucide-react";

interface DashboardStatsGridProps {
  copy: DashboardCopy;
  stats: DashboardStats;
}

export function DashboardStatsGrid({ copy, stats }: DashboardStatsGridProps) {
  const statCards: Array<{
    icon: LucideIcon;
    iconClassName: string;
    key: string;
    label: string;
    value: string | number;
  }> = [
    {
      icon: Plane,
      iconClassName: "text-[#4f96b6]",
      key: "total-trips",
      label: copy.stats.totalTrips,
      value: stats.totalTrips,
    },
    {
      icon: Calendar,
      iconClassName: "text-[#4f96b6]",
      key: "upcoming-trips",
      label: copy.stats.upcomingTrips,
      value: stats.upcomingTrips,
    },
    {
      icon: DollarSign,
      iconClassName: "text-[#4f96b6]",
      key: "total-spent",
      label: copy.stats.totalSpent,
      value: `$${(stats.totalSpent ?? 0).toFixed(0)}`,
    },
    {
      icon: Star,
      iconClassName: "text-[#4f96b6]",
      key: "average-rating",
      label: copy.stats.averageRating,
      value: stats.averageRating > 0 ? (stats.averageRating ?? 0).toFixed(1) : "—",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100"
            key={card.key}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-500">
                  {card.label}
                </p>
                <p className="font-barlow-condensed font-bold text-4xl text-gray-900">
                  {card.value}
                </p>
              </div>
              <Icon className={`h-10 w-10 ${card.iconClassName}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
