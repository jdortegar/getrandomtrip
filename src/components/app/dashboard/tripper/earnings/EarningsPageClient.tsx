"use client";

import { useMemo } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  Download,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EarningStatusBadge } from "@/components/common/EarningStatusBadge";
import { Button } from "@/components/ui/Button";
import type { TripperEarningsDict } from "@/lib/types/dictionary";
import type { Earning } from "@/types/tripper";
import { cn } from "@/lib/utils";

interface EarningsPageClientProps {
  dict: TripperEarningsDict;
  earnings: Earning[];
  locale: string;
}

interface KpiCard {
  gold?: boolean;
  icon: LucideIcon;
  key: string;
  label: string;
  value: string | number;
}

function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}

export function EarningsPageClient({
  dict: copy,
  earnings,
  locale,
}: EarningsPageClientProps) {
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const current = earnings[0];

  const totalEarned = useMemo(
    () => earnings.reduce((sum, e) => sum + e.totalUSD, 0),
    [earnings],
  );
  const pendingPayout = useMemo(
    () =>
      earnings
        .filter((e) => e.status !== "paid")
        .reduce((sum, e) => sum + e.totalUSD, 0),
    [earnings],
  );
  const totalBookings = useMemo(
    () => earnings.reduce((sum, e) => sum + e.bookings, 0),
    [earnings],
  );

  const csv = useMemo(() => {
    const header = [
      "month",
      "bookings",
      "baseCommissionUSD",
      "bonusUSD",
      "totalUSD",
      "status",
      "payoutDate",
    ];
    const rows = earnings.map((e) =>
      [
        e.month,
        e.bookings,
        e.baseCommissionUSD,
        e.bonusUSD,
        e.totalUSD,
        e.status,
        e.payoutDate ?? "",
      ]
        .map(String)
        .join(","),
    );
    return [header.join(","), ...rows].join("\n");
  }, [earnings]);

  function handleExportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "earnings.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function statusLabel(status: Earning["status"]): string {
    return copy.status[status as keyof typeof copy.status] ?? status;
  }

  const kpis: KpiCard[] = [
    {
      icon: BadgeDollarSign,
      key: "current-cycle",
      label: copy.kpis.currentCycle,
      value: current ? formatUSD(current.totalUSD) : "—",
    },
    {
      gold: true,
      icon: Wallet,
      key: "total-earned",
      label: copy.kpis.totalEarned,
      value: formatUSD(totalEarned),
    },
    {
      icon: CalendarClock,
      key: "pending-payout",
      label: copy.kpis.pendingPayout,
      value: formatUSD(pendingPayout),
    },
    {
      icon: ShieldCheck,
      key: "bookings",
      label: copy.kpis.bookings,
      value: totalBookings,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
            {copy.title}
          </h2>
        </div>
        {earnings.length > 0 && (
          <Button
            className="h-11 shrink-0 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-gray-800"
            onClick={handleExportCsv}
          >
            <Download className="mr-2 h-4 w-4" />
            {copy.exportCsv}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((card) => {
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
                <p className="font-barlow-condensed text-5xl font-extrabold leading-[0.9] text-gray-900">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="text-xl font-semibold text-neutral-900">
            {copy.table.title}
          </h3>
        </div>
        {earnings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-2 text-sm font-semibold text-neutral-700">
              {copy.emptyState.title}
            </p>
            <p className="text-sm text-neutral-500">
              {copy.emptyState.description}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.month}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.bookings}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.base}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.bonus}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.total}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.payout}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {earnings.map((earning) => (
                  <tr
                    className="transition-colors hover:bg-gray-50"
                    key={earning.id}
                  >
                    <td className="px-5 py-4 text-sm font-semibold capitalize text-neutral-900">
                      {earning.month}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {earning.bookings}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {formatUSD(earning.baseCommissionUSD)}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {formatUSD(earning.bonusUSD)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-barlow-condensed text-lg font-bold leading-none text-gray-900">
                        {formatUSD(earning.totalUSD)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <EarningStatusBadge
                        label={statusLabel(earning.status)}
                        status={earning.status}
                      />
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {earning.payoutDate
                        ? new Date(earning.payoutDate).toLocaleDateString(
                            dateLocale,
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
