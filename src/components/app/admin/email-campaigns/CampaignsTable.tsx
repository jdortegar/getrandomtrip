import Link from "next/link";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import { SortButton } from "@/components/ui/SortButton";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type {
  CampaignListItem,
  CampaignSortBy,
  CampaignSortOrder,
} from "@/types/emailCampaign";
import { CampaignRowActions } from "./CampaignRowActions";

const TH =
  "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap";
const SORT_TH = "px-5 py-3 text-left whitespace-nowrap";
const TD = "px-5 py-4 text-sm text-neutral-700 whitespace-nowrap";

interface CampaignsTableProps {
  campaigns: CampaignListItem[];
  copy: EmailCampaignsAdminDict["campaigns"];
  /** BCP 47 locale used for dates and money, e.g. `es-ES`. */
  dateLocale: string;
  /** Id of the campaign whose delete request is in flight, if any. */
  deletingId: string | null;
  /** Builds the locale-aware detail href for a campaign id. */
  detailHref: (id: string) => string;
  onDelete: (campaign: CampaignListItem) => void;
  onSort: (field: CampaignSortBy) => void;
  sortBy: CampaignSortBy;
  sortOrder: CampaignSortOrder;
}

/** Share of `sent` as a whole percentage; `—` before anything was sent. */
function rate(count: number, sent: number) {
  return sent > 0 ? `${Math.round((count / sent) * 100)}%` : "—";
}

/** Comparison view: one row per campaign with its summary metrics and actions. */
export function CampaignsTable({
  campaigns,
  copy,
  dateLocale,
  deletingId,
  detailHref,
  onDelete,
  onSort,
  sortBy,
  sortOrder,
}: CampaignsTableProps) {
  const cols = copy.columns;
  const money = new Intl.NumberFormat(dateLocale, {
    currency: "USD",
    style: "currency",
  });

  function ariaSortFor(field: CampaignSortBy): "ascending" | "descending" | "none" {
    if (sortBy !== field) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  }

  function sortableHeader(field: CampaignSortBy, label: string) {
    return (
      <th aria-sort={ariaSortFor(field)} className={SORT_TH}>
        <SortButton
          active={sortBy === field}
          ariaLabel={copy.sort.ariaSortBy.replace("{field}", label)}
          label={label}
          onSort={() => onSort(field)}
          order={sortOrder}
        />
      </th>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {campaigns.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink">{copy.noMatches}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {sortableHeader("name", cols.campaign)}
                <th className={TH}>{cols.status}</th>
                <th className={TH}>{cols.promoCode}</th>
                {sortableHeader("sentAt", cols.sentAt)}
                <th className={TH}>{cols.clicks}</th>
                {sortableHeader("conversions", cols.conversions)}
                {sortableHeader("revenue", cols.revenue)}
                <th className={TH}>{cols.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((campaign) => {
                const { summary } = campaign;
                const href = detailHref(campaign.id);
                return (
                  <tr className="transition-colors hover:bg-gray-50" key={campaign.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="text-sm font-semibold text-ink hover:text-primary hover:underline"
                        href={href}
                      >
                        {campaign.name}
                      </Link>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                        {campaign.subject}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusIndicatorBadge
                        family="email-campaign"
                        label={copy.status[campaign.status] ?? campaign.status}
                        status={campaign.status}
                      />
                    </td>
                    <td className={TD}>{campaign.promoCode ?? copy.noPromo}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-500">
                      {campaign.sentAt
                        ? new Date(campaign.sentAt).toLocaleDateString(dateLocale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : copy.notSent}
                    </td>
                    <td className={TD}>{rate(summary.uniqueClicks, summary.sent)}</td>
                    <td className={TD}>{summary.conversions}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-barlow-condensed text-lg font-bold leading-none text-ink">
                      {money.format(summary.revenue)}
                    </td>
                    <td className="px-5 py-4">
                      <CampaignRowActions
                        copy={copy.actions}
                        href={href}
                        isDeleting={deletingId === campaign.id}
                        onDelete={() => onDelete(campaign)}
                        status={campaign.status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
