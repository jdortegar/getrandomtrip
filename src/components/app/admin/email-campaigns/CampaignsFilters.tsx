"use client";

import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import type { EmailCampaignsAdminDict, MarketingDictionary } from "@/lib/types/dictionary";
import type {
  CampaignListFilters,
  CampaignStatus,
  ContactSource,
} from "@/types/emailCampaign";
import { EMPTY_CAMPAIGN_FILTERS } from "./campaignListSort";

const STATUSES: CampaignStatus[] = ["DRAFT", "SENDING", "SENT", "PARTIAL"];
const SEGMENTS: ContactSource[] = ["WAITLIST", "FRIENDS_FAMILY"];

interface CampaignsFiltersProps {
  copy: EmailCampaignsAdminDict["campaigns"];
  filterCopy: MarketingDictionary["common"]["tableFilters"];
  filters: CampaignListFilters;
  hasError: boolean;
  isLoading: boolean;
  onChange: (filters: CampaignListFilters) => void;
  segmentLabels: EmailCampaignsAdminDict["contacts"]["source"];
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
  segmentLabels,
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
          onChange: (value) => onChange({ ...filters, segment: value as ContactSource | "" }),
          options: [
            { label: copy.filters.allSegments, value: "" },
            ...SEGMENTS.map((value) => ({ label: segmentLabels[value], value })),
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
