import type {
  CampaignListFilters,
  CampaignListItem,
  CampaignSortBy,
  CampaignSortOrder,
} from "@/types/emailCampaign";

export const CAMPAIGN_SORT_DEFAULT: { sortBy: CampaignSortBy; sortOrder: CampaignSortOrder } = {
  sortBy: "sentAt",
  sortOrder: "desc",
};

/** Direction a column starts with when it becomes the active sort. */
export const CAMPAIGN_SORT_INITIAL_ORDER: Record<CampaignSortBy, CampaignSortOrder> = {
  conversions: "desc",
  name: "asc",
  revenue: "desc",
  sentAt: "desc",
};

export const EMPTY_CAMPAIGN_FILTERS: CampaignListFilters = {
  search: "",
  segment: "",
  status: "",
};

/** Next sort state after a header click: flip the active column, else its initial order. */
export function nextCampaignSort(
  current: { sortBy: CampaignSortBy; sortOrder: CampaignSortOrder },
  field: CampaignSortBy,
): { sortBy: CampaignSortBy; sortOrder: CampaignSortOrder } {
  if (current.sortBy !== field) {
    return { sortBy: field, sortOrder: CAMPAIGN_SORT_INITIAL_ORDER[field] };
  }
  return { sortBy: field, sortOrder: current.sortOrder === "asc" ? "desc" : "asc" };
}

export function filterCampaigns(
  campaigns: CampaignListItem[],
  filters: CampaignListFilters,
): CampaignListItem[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return campaigns.filter(
    (campaign) =>
      (!filters.status || campaign.status === filters.status) &&
      (!filters.segment || campaign.segmentSources.includes(filters.segment)) &&
      (!query ||
        campaign.name.toLocaleLowerCase().includes(query) ||
        campaign.subject.toLocaleLowerCase().includes(query)),
  );
}

/** Drafts have no `sentAt`; they sort by when they were created. */
function dateKey(campaign: CampaignListItem): number {
  return new Date(campaign.sentAt ?? campaign.createdAt).getTime();
}

function compareBy(sortBy: CampaignSortBy, a: CampaignListItem, b: CampaignListItem): number {
  switch (sortBy) {
    case "name":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "conversions":
      return a.summary.conversions - b.summary.conversions;
    case "revenue":
      return a.summary.revenue - b.summary.revenue;
    case "sentAt":
      return dateKey(a) - dateKey(b);
  }
}

/** Returns a sorted copy; ties fall back to newest first. */
export function sortCampaigns(
  campaigns: CampaignListItem[],
  sortBy: CampaignSortBy,
  sortOrder: CampaignSortOrder,
): CampaignListItem[] {
  const direction = sortOrder === "asc" ? 1 : -1;
  return [...campaigns].sort(
    (a, b) => direction * compareBy(sortBy, a, b) || dateKey(b) - dateKey(a),
  );
}
