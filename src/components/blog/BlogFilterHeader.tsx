'use client';

import { ChevronDown } from 'lucide-react';
import {
  BLOG_EXCUSE_OPTIONS,
  BLOG_TRAVEL_TYPE_OPTIONS,
  type ExcuseFilterOption,
  type TripperFilterOption,
} from '@/lib/constants/blog-filters';
import type { MarketingDictionary } from '@/lib/types/dictionary';
import { cn } from '@/lib/utils';

export interface BlogFilterState {
  excuseKey: string | null;
  tripperId: string | null;
  travelTypeKey: string;
}

export type BlogFilterLabels = MarketingDictionary['blogPage']['filters'];

interface BlogFilterHeaderProps {
  className?: string;
  labels: BlogFilterLabels;
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
        'relative min-w-[220px] rounded-lg border border-neutral-200 bg-white py-2 px-4 shadow-sm text-left',
        className,
      )}
    >
      <div className="flex justify-between gap-1 items-center w-full">
        <p className="text-xl font-semibold text-neutral-900">{title}</p>
        <span className="pointer-events-none text-neutral-900">
          <ChevronDown className="h-5 w-5" />
        </span>
      </div>
      <p className="text-xs text-neutral-500">{subtitle}</p>
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
  onChange,
  trippers,
  value,
}: BlogFilterHeaderProps) {
  const selectedTripper = value.tripperId
    ? getTripperById(trippers, value.tripperId)
    : null;
  const selectedExcuse: ExcuseFilterOption | null = value.excuseKey
    ? (BLOG_EXCUSE_OPTIONS.find((e) => e.key === value.excuseKey) ?? null)
    : null;

  const travelTypeTitle =
    value.travelTypeKey === ''
      ? labels.travelTypeLabel
      : (BLOG_TRAVEL_TYPE_OPTIONS.find((o) => o.key === value.travelTypeKey)
          ?.label ?? labels.travelTypeLabel);

  const excuseTitle = selectedExcuse?.label ?? labels.excuseLabel;

  const tripperTitle = selectedTripper?.name ?? labels.tripperLabel;

  const handleTravelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...value, travelTypeKey: e.target.value });
  };

  const handleExcuseSelect = (key: string) => {
    const next = value.excuseKey === key ? null : key;
    onChange({ ...value, excuseKey: next });
  };

  const handleTripperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    onChange({ ...value, tripperId: id });
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-4 justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
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
            {BLOG_TRAVEL_TYPE_OPTIONS.map((opt) => (
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
            value={value.excuseKey ?? ''}
          >
            <option value="">{labels.excuseLabel}</option>
            {BLOG_EXCUSE_OPTIONS.slice(0, 8).map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterDropdownCard>
      </div>
      <FilterDropdownCard subtitle={labels.tripperSubtitle} title={tripperTitle}>
        <select
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleTripperChange}
          value={value.tripperId ?? ''}
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
