import {
  ShieldCheck,
  BadgeDollarSign,
  Star,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TripperDashboardStats } from "@/types/tripper";
import type { TripperDashboardDict } from "@/lib/types/dictionary";

interface TripperStatsGridProps {
  stats: TripperDashboardStats;
  copy: TripperDashboardDict["stats"];
}

export function TripperStatsGrid({ stats, copy }: TripperStatsGridProps) {
  const cards: Array<{
    icon: LucideIcon;
    key: string;
    label: string;
    value: string | number;
  }> = [
    {
      icon: ShieldCheck,
      key: "total-bookings",
      label: copy.totalBookings,
      value: stats.totalBookings,
    },
    {
      icon: BadgeDollarSign,
      key: "monthly-revenue",
      label: copy.monthlyRevenue,
      value: `$${stats.monthlyRevenue.toLocaleString("es-AR")}`,
    },
    {
      icon: Star,
      key: "average-rating",
      label: copy.averageRating,
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—",
    },
    {
      icon: ClipboardList,
      key: "active-packages",
      label: copy.activeExperiences,
      value: stats.activeExperiences,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            className="flex flex-col justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 font-barlow"
            key={card.key}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-snug text-neutral-500">
                {card.label}
              </p>
              <Icon
                className="h-9 w-9 shrink-0 text-light-blue"
                strokeWidth={1.5}
              />
            </div>
            <p className="font-barlow font-bold text-4xl text-gray-900 text-left">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
