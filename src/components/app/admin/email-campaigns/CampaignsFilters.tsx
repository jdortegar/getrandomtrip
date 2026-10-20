"use client";

import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import type { EmailCampaignsAdminDict, MarketingDictionary } from "@/lib/types/dictionary";
import type {
  CampaignListFilters,
  CampaignStatus,
  SegmentRef,
} from "@/types/emailCampaign";
import { EMPTY_CAMPAIGN_FILTERS } from "./campaignListSort";

const STATUSES: CampaignStatus[] = ["DRAFT", "SENDING", "SENT", "PARTIAL"];

interface CampaignsFiltersProps {
  copy: EmailCampaignsAdminDict["campaigns"];
  filterCopy: MarketingDictionary["common"]["tableFilters"];
  filters: CampaignListFilters;
  hasError: boolean;
  isLoading: boolean;
  onChange: (filters: CampaignListFilters) => void;
  /** Segment filter options, in the segments API order. */
  segments: SegmentRef[];
  shown: number;
  total: number;
}

/** Search + status + segment toolbar of the campaigns list (client-side filtering). */
export function CampaignsFilters({
  copy,
  filterCopy,
  filters,
  hasError,
  isLoading,
  onChange,
  segments,
  shown,
  total,
}: CampaignsFiltersProps) {
  const hasActiveFilters = filters.search !== "" || filters.status !== "" || filters.segment !== "";

  return (
    <TableFilterToolbar
      copy={filterCopy}
      filters={[
        {
          id: "email-campaigns-status",
          label: copy.filters.status,
          onChange: (value) => onChange({ ...filters, status: value as CampaignStatus | "" }),
          options: [
            { label: copy.filters.allStatuses, value: "" },
            ...STATUSES.map((value) => ({ label: copy.status[value], value })),
          ],
          value: filters.status,
        },
        {
          id: "email-campaigns-segment",
          label: copy.filters.segment,
          onChange: (value) => onChange({ ...filters, segment: value }),
          options: [
            { label: copy.filters.allSegments, value: "" },
            ...segments.map((segment) => ({ label: segment.name, value: segment.id })),
          ],
          value: filters.segment,
        },
      ]}
      hasActiveFilters={hasActiveFilters}
      hasError={hasError}
      isLoading={isLoading}
      onClear={() => onChange(EMPTY_CAMPAIGN_FILTERS)}
      search={{
        id: "email-campaigns-search",
        label: filterCopy.searchLabel,
        onChange: (value) => onChange({ ...filters, search: value }),
        placeholder: copy.searchPlaceholder,
        value: filters.search,
      }}
      shown={shown}
      total={total}
    />
  );
}
