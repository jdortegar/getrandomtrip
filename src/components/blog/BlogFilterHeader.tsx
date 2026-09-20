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
  className?: string;
  subtitle: string;
  title: string;
}

function FilterDropdownCard({
  children,
  className,
  subtitle,
  title,
}: FilterDropdownCardProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border border-neutral-200 bg-white py-1.5 px-3 shadow-sm text-left md:w-auto md:min-w-[220px] md:py-2 md:px-4",
        className,
      )}
    >
      <div className="flex justify-between gap-1 items-center w-full">
        <p className="text-base font-semibold text-ink md:text-xl">{title}</p>
        <span className="pointer-events-none text-ink">
          <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
        </span>
      </div>
      <p className="text-xs text-ink">{subtitle}</p>
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
    onChange({ ...value, levelKey: "", travelTypeKey: e.target.value });
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLevel = e.target.value;
    onChange({
      ...value,
      levelKey: nextLevel,
      // XSED is stored on travelType — clear traveler-type when selecting a level
      // so the two filters don't fight (mirrors /api/tripper/blogs else-if).
      travelTypeKey: nextLevel ? "" : value.travelTypeKey,
    });
  };

  const handleTripperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    onChange({ ...value, tripperId: id });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-neutral-200 pb-4 md:flex-row md:flex-wrap md:items-center",
        className,
      )}
      data-component="BlogFilterHeader"
    >
      <FilterDropdownCard
        subtitle={labels.travelTypeSubtitle}
        title={travelTypeTitle}
      >
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
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
          className="absolute inset-0 cursor-pointer opacity-0"
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
          className="absolute inset-0 cursor-pointer opacity-0"
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
        className="md:ml-auto"
        subtitle={labels.tripperSubtitle}
        title={tripperTitle}
      >
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
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
