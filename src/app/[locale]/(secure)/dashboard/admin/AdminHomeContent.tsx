import { CheckCircle, ChevronRight, DollarSign, Mail, Megaphone } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { AdminOverviewStats } from "@/lib/admin/overview";
import type { AdminPagesDict } from "@/lib/types/dictionary";

interface AdminHomeContentProps {
  copy: AdminPagesDict["home"];
  locale: Locale;
  stats: AdminOverviewStats["stats"];
  pending: AdminOverviewStats["pending"];
}

/**
 * Presentational admin overview page — no hooks, no client fetch. All data
 * arrives pre-computed from the server component (`admin/page.tsx`). Every
 * stat card and pending-action row always renders, even at zero, per
 * `specs/admin-dashboard-overview`.
 */
export function AdminHomeContent({
  copy,
  locale,
  stats,
  pending,
}: AdminHomeContentProps) {
  const statCards: Array<{
    key: string;
    icon: LucideIcon;
    label: string;
    value: string | number;
  }> = [
    {
      icon: CheckCircle,
      key: "trips-sold",
      label: copy.stats.tripsSold,
      value: stats.tripsSold,
    },
    {
      icon: DollarSign,
      key: "earnings",
      label: copy.stats.earnings,
      value: formatUSD(stats.earnings),
    },
    {
      icon: Mail,
      key: "waitlist",
      label: copy.stats.waitlist,
      value: stats.waitlist,
    },
    {
      icon: Megaphone,
      key: "xsed-signups",
      label: copy.stats.xsedSignups,
      value: stats.xsedSignups,
    },
  ];

  const pendingRows: Array<{
    key: string;
    href: string;
    label: string;
    count: number;
  }> = [
    {
      count: pending.experiences,
      href: pathForLocale(locale, "/dashboard/admin/experiences"),
      key: "experiences-review",
      label: copy.pending.experiencesReview,
    },
    {
      count: pending.tripsDestination,
      href: pathForLocale(locale, "/dashboard/admin/trip-requests?status=CONFIRMED"),
      key: "trips-destination",
      label: copy.pending.tripsDestination,
    },
    {
      count: pending.reviews,
      href: pathForLocale(locale, "/dashboard/admin/reviews"),
      key: "reviews-approval",
      label: copy.pending.reviewsApproval,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Stats section header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.heading}
        </h2>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
              key={card.key}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  {card.label}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue/10 text-light-blue">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-stretch gap-3">
                <div className="w-1 shrink-0 self-stretch rounded-full bg-yellow-400" />
                <span className="font-barlow-condensed text-5xl font-extrabold leading-[.9] text-gray-900">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending actions panel */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.pending.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.pending.heading}
        </h2>
      </div>
      <div className="divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {pendingRows.map((row) => (
          <Link
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
            href={row.href}
            key={row.key}
          >
            <span className="text-sm text-neutral-700">{row.label}</span>
            <span className="flex items-center gap-3">
              <span className="font-barlow-condensed text-lg font-bold text-gray-900">
                {row.count}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
