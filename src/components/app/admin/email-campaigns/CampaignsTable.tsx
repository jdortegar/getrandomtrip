import Link from "next/link";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { CampaignListItem } from "@/types/emailCampaign";

const TH =
  "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap";
const TD = "px-5 py-4 text-sm text-neutral-700 whitespace-nowrap";

interface CampaignsTableProps {
  campaigns: CampaignListItem[];
  copy: EmailCampaignsAdminDict["campaigns"];
  /** BCP 47 locale used for dates and money, e.g. `es-ES`. */
  dateLocale: string;
  /** Builds the locale-aware detail href for a campaign id. */
  detailHref: (id: string) => string;
  localeLabels: EmailCampaignsAdminDict["locales"];
  sourceLabels: EmailCampaignsAdminDict["contacts"]["source"];
}

/** Share of `sent` as a whole percentage; `—` before anything was sent. */
function rate(count: number, sent: number) {
  return sent > 0 ? `${Math.round((count / sent) * 100)}%` : "—";
}

/** Comparison view: one row per campaign with its summary metrics. */
export function CampaignsTable({
  campaigns,
  copy,
  dateLocale,
  detailHref,
  localeLabels,
  sourceLabels,
}: CampaignsTableProps) {
  const cols = copy.columns;
  const money = new Intl.NumberFormat(dateLocale, {
    currency: "USD",
    style: "currency",
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={TH}>{cols.campaign}</th>
              <th className={TH}>{cols.status}</th>
              <th className={TH}>{cols.locale}</th>
              <th className={TH}>{cols.segment}</th>
              <th className={TH}>{cols.promoCode}</th>
              <th className={TH}>{cols.sentAt}</th>
              <th className={TH}>{cols.sent}</th>
              <th className={TH}>{cols.opens}</th>
              <th className={TH}>{cols.clicks}</th>
              <th className={TH}>{cols.conversions}</th>
              <th className={TH}>{cols.revenue}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {campaigns.map((campaign) => {
              const { summary } = campaign;
              return (
                <tr className="transition-colors hover:bg-gray-50" key={campaign.id}>
                  <td className="px-5 py-4">
                    <Link
                      className="text-sm font-semibold text-ink hover:text-primary hover:underline"
                      href={detailHref(campaign.id)}
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
                  <td className={TD}>{localeLabels[campaign.locale]}</td>
                  <td className={TD}>
                    {campaign.segmentSources
                      .map((source) => sourceLabels[source])
                      .join(", ")}
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
                  <td className={TD}>{summary.sent}</td>
                  <td className={TD}>{rate(summary.uniqueOpens, summary.sent)}</td>
                  <td className={TD}>{rate(summary.uniqueClicks, summary.sent)}</td>
                  <td className={TD}>{summary.conversions}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-barlow-condensed text-lg font-bold leading-none text-ink">
                    {money.format(summary.revenue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
