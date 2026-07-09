"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripperDashboardDict } from "@/lib/types/dictionary";
import {
  TRIPPER_TIER_ORDER,
  type TripperTierCopy,
  type TripperTierLevel,
} from "@/types/tripper";

const TIER_ORDER = TRIPPER_TIER_ORDER;

interface TripperSettingsAccountCardProps {
  copy: TripperDashboardDict["settingsProfile"]["account"];
  tierLabels: TripperTierCopy;
  tierDescriptions: TripperTierCopy;
  email: string;
  tierLevel: string;
  /** Fraction 0–1 (e.g. 0.15 means 15%). */
  commission: number;
}

function AdminSetBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[6px] border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
      <Lock className="h-3 w-3" />
      {label}
    </span>
  );
}

export function TripperSettingsAccountCard({
  copy,
  tierLabels,
  tierDescriptions,
  email,
  tierLevel,
  commission,
}: TripperSettingsAccountCardProps) {
  const tierKey = (
    TIER_ORDER.includes(tierLevel as TripperTierLevel)
      ? tierLevel
      : "wanderer"
  ) as TripperTierLevel;
  const tierIndex = TIER_ORDER.indexOf(tierKey);
  const commissionPct = Math.round(commission * 100);

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.heading}
        </h2>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-500">
          {copy.emailLabel}
        </p>
        <p className="mt-1 text-sm text-neutral-800">{email}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-500">
            {copy.tierLabel}
          </p>
          <AdminSetBadge label={copy.adminSet} />
        </div>
        <p className="text-sm font-semibold text-gray-900">
          {tierLabels[tierKey]}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {tierDescriptions[tierKey]}
        </p>
        <div className="mt-3 flex gap-1">
          {TIER_ORDER.map((key, i) => (
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= tierIndex ? "bg-light-blue" : "bg-gray-200",
              )}
              key={key}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-500">
            {copy.commissionLabel}
          </p>
          <AdminSetBadge label={copy.adminSet} />
        </div>
        <p className="font-barlow-condensed text-4xl font-extrabold leading-none text-gray-900">
          {commissionPct}%
        </p>
        <p className="mt-2 text-xs text-neutral-500">{copy.commissionHelper}</p>
      </div>
    </div>
  );
}
