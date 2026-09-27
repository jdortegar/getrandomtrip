"use client";

import { ChevronDown } from "lucide-react";
import {
  getBlogExcuseOptions,
  getBlogLevelOptions,
  getBlogTravelTypeOptions,
  type ExcuseFilterOption,
  type TripperFilterOption,
} from "@/lib/constants/blog-filters";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

export interface BlogFilterState {
  excuseKey: string | null;
  levelKey: string;
  tripperId: string | null;
  travelTypeKey: string;
}

export type BlogFilterLabels = MarketingDictionary["blogPage"]["filters"];

interface BlogFilterHeaderProps {
  className?: string;
  labels: BlogFilterLabels;
  locale: string;
  onChange: (next: BlogFilterState) => void;
  trippers: TripperFilterOption[];
  value: BlogFilterState;
}

interface FilterDropdownCardProps {
  children: React.ReactNode;
  subtitle: string;
  title: string;
}

function FilterDropdownCard({
  children,
  subtitle,
  title,
}: FilterDropdownCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-neutral-200 min-w-0 px-3 py-1.5 relative rounded-lg shadow-sm text-left w-full",
        "md:px-4 md:py-2",
        "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary",
      )}
    >
      <div className="flex gap-1 items-center justify-between w-full">
        <p
          className={cn(
            "font-semibold min-w-0 text-base text-ink truncate",
            "md:text-xl",
          )}
          title={title}
        >
          {title}
        </p>
        <span className="pointer-events-none shrink-0 text-ink">
          <ChevronDown className={cn("h-4 w-4", "md:h-5 md:w-5")} />
        </span>
      </div>
      <p className="text-ink text-xs">{subtitle}</p>
      {children}
    </div>
  );
}

function getTripperById(
  trippers: TripperFilterOption[],
  id: string,
): TripperFilterOption | undefined {
  return trippers.find((t) => t.id === id);
}

export function BlogFilterHeader({
  className,
  labels,
  locale,
  onChange,
  trippers,
  value,
}: BlogFilterHeaderProps) {
  const travelTypeOptions = getBlogTravelTypeOptions(locale);
  const excuseOptions = getBlogExcuseOptions(locale);
  const levelOptions = getBlogLevelOptions();

  const selectedTripper = value.tripperId
    ? getTripperById(trippers, value.tripperId)
    : null;
  const selectedExcuse: ExcuseFilterOption | null = value.excuseKey
    ? (excuseOptions.find((e) => e.key === value.excuseKey) ?? null)
    : null;

  const travelTypeTitle =
    value.travelTypeKey === ""
      ? labels.travelTypeLabel
      : (travelTypeOptions.find((o) => o.key === value.travelTypeKey)?.label ??
        labels.travelTypeLabel);

  const levelTitle =
    value.levelKey === ""
      ? labels.levelLabel
      : (levelOptions.find((o) => o.key === value.levelKey)?.label ??
        labels.levelLabel);

  const excuseTitle = selectedExcuse?.label ?? labels.excuseLabel;

  const tripperTitle = selectedTripper?.name ?? labels.tripperLabel;

  const handleTravelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, travelTypeKey: e.target.value });
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Level (BlogPost.level) and travel type are independent columns — both
    // filters can be applied together (e.g. an XSED post tagged "solo").
    onChange({ ...value, levelKey: e.target.value });
  };

  const handleTripperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    onChange({ ...value, tripperId: id });
  };

  return (
    <div
      className={cn(
        "border-b border-neutral-200 gap-3 grid grid-cols-1 pb-4",
        "md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
      data-component="BlogFilterHeader"
    >
      <FilterDropdownCard
        subtitle={labels.travelTypeSubtitle}
        title={travelTypeTitle}
      >
        <select
          aria-label={labels.travelTypeLabel}
          className="absolute cursor-pointer h-full inset-0 min-w-0 opacity-0 w-full"
          onChange={handleTravelTypeChange}
          value={value.travelTypeKey}
        >
          <option value="">{labels.allOption}</option>
          {travelTypeOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterDropdownCard>

      <FilterDropdownCard subtitle={labels.levelSubtitle} title={levelTitle}>
        <select
          aria-label={labels.levelLabel}
          className="absolute cursor-pointer h-full inset-0 min-w-0 opacity-0 w-full"
          onChange={handleLevelChange}
          value={value.levelKey}
        >
          <option value="">{labels.allOption}</option>
          {levelOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterDropdownCard>

      <FilterDropdownCard subtitle={labels.excuseSubtitle} title={excuseTitle}>
        <select
          aria-label={labels.excuseLabel}
          className="absolute cursor-pointer h-full inset-0 min-w-0 opacity-0 w-full"
          onChange={(e) => {
            const key = e.target.value;
            onChange({ ...value, excuseKey: key || null });
          }}
          value={value.excuseKey ?? ""}
        >
          <option value="">{labels.excuseLabel}</option>
          {excuseOptions.slice(0, 8).map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterDropdownCard>

      <FilterDropdownCard
        subtitle={labels.tripperSubtitle}
        title={tripperTitle}
      >
        <select
          aria-label={labels.tripperLabel}
          className="absolute cursor-pointer h-full inset-0 min-w-0 opacity-0 w-full"
          onChange={handleTripperChange}
          value={value.tripperId ?? ""}
        >
          <option value="">{labels.tripperLabel}</option>
          {trippers.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </FilterDropdownCard>
    </div>
  );
}
