"use client";

import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import type { EmailCampaignsAdminDict, MarketingDictionary } from "@/lib/types/dictionary";
import type {
  ContactListFilters,
  ContactSource,
  ContactStatus,
  SegmentRef,
} from "@/types/emailCampaign";

const SOURCES: ContactSource[] = ["WAITLIST", "FRIENDS_FAMILY"];
const STATUSES: ContactStatus[] = ["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED"];

interface ContactsFiltersProps {
  copy: EmailCampaignsAdminDict["contacts"];
  filterCopy: MarketingDictionary["common"]["tableFilters"];
  filters: ContactListFilters;
  hasError: boolean;
  isLoading: boolean;
  onChange: (patch: Partial<ContactListFilters>) => void;
  onClear: () => void;
  /** Segment filter options, in the segments API order. */
  segments: SegmentRef[];
  shown: number;
  total: number;
}

/** Search + source + segment + status toolbar of the contacts list (server-side filtering). */
export function ContactsFilters({
  copy,
  filterCopy,
  filters,
  hasError,
  isLoading,
  onChange,
  onClear,
  segments,
  shown,
  total,
}: ContactsFiltersProps) {
  const hasActiveFilters =
    filters.source !== "" ||
    filters.status !== "" ||
    filters.segmentId !== "" ||
    filters.search !== "";

  return (
    <TableFilterToolbar
      copy={filterCopy}
      filters={[
        {
          id: "email-contacts-source",
          label: copy.filters.source,
          onChange: (value) => onChange({ source: value as ContactSource | "" }),
          options: [
            { label: copy.filters.allSources, value: "" },
            ...SOURCES.map((value) => ({ label: copy.source[value], value })),
          ],
          value: filters.source,
        },
        {
          id: "email-contacts-segment",
          label: copy.filters.segment,
          onChange: (value) => onChange({ segmentId: value }),
          options: [
            { label: copy.filters.allSegments, value: "" },
            ...segments.map((segment) => ({ label: segment.name, value: segment.id })),
          ],
          value: filters.segmentId,
        },
        {
          id: "email-contacts-status",
          label: copy.filters.status,
          onChange: (value) => onChange({ status: value as ContactStatus | "" }),
          options: [
            { label: copy.filters.allStatuses, value: "" },
            ...STATUSES.map((value) => ({ label: copy.status[value], value })),
          ],
          value: filters.status,
        },
      ]}
      hasActiveFilters={hasActiveFilters}
      hasError={hasError}
      isLoading={isLoading}
      onClear={onClear}
      search={{
        id: "email-contacts-search",
        label: filterCopy.searchLabel,
        onChange: (value) => onChange({ search: value }),
        placeholder: copy.searchPlaceholder,
        value: filters.search,
      }}
      shown={shown}
      total={total}
    />
  );
}
