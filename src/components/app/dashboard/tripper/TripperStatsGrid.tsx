import {
  ShieldCheck,
  BadgeDollarSign,
  Star,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripperDashboardStats } from "@/types/tripper";
import type { TripperDashboardDict } from "@/lib/types/dictionary";

interface TripperStatsGridProps {
  stats: TripperDashboardStats;
  copy: TripperDashboardDict["stats"];
  /** Was the separate "Key Metrics" card; now folded in as the supporting strip. */
  metricsCopy: TripperDashboardDict["keyMetrics"];
}

/**
 * Performance band — replaces the old 4-card StatsGrid AND the Key Metrics card.
 * Brand section header (eyebrow + condensed heading) → 4 hero cards (yellow divider,
 * cyan/gold icon puck, condensed value) → one supporting strip with the remaining KPIs.
 */
export function TripperStatsGrid({ stats, copy, metricsCopy }: TripperStatsGridProps) {
  const hero: Array<{
    icon: LucideIcon;
    key: string;
    label: string;
    value: string | number;
    gold?: boolean;
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
      gold: true,
    },
    {
      icon: ClipboardList,
      key: "active-packages",
      label: copy.activeExperiences,
      value: stats.activeExperiences,
    },
  ];

  return (
    <section>
      {/* Brand section header */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {metricsCopy.sectionEyebrow ?? "This month"}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-neutral-900">
          {metricsCopy.sectionTitle ?? "Your performance"}
        </h2>
      </div>

      {/* Hero KPI cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {hero.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="flex flex-col gap-5 rounded-2xl bg-white p-6 font-barlow shadow-sm ring-1 ring-gray-200"
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

      {/* Supporting metrics strip (was Key Metrics) */}
      <div className="mt-4 flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 sm:flex-row">
        <Metric label={metricsCopy.totalClients} value={stats.totalClients} />
        <Metric
          label={metricsCopy.conversionRate}
          value={`${stats.conversionRate}%`}
          divider
        />
        <Metric label={metricsCopy.growth} value="+12.5%" trend divider />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  trend = false,
  divider = false,
}: {
  label: string;
  value: string | number;
  trend?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-between gap-3 px-7 py-5",
        divider && "border-t border-gray-200 sm:border-l sm:border-t-0",
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-1.5 font-barlow-condensed text-3xl font-extrabold leading-none",
          trend ? "text-green-600" : "text-neutral-900",
        )}
      >
        {trend && <TrendingUp className="h-[18px] w-[18px] text-green-500" />}
        {value}
      </span>
    </div>
  );
}
