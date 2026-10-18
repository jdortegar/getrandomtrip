"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  DollarSign,
  MailOpen,
  MousePointerClick,
  Send,
  ShoppingBag,
  TicketPercent,
} from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { CampaignReport } from "@/types/emailCampaign";
import { CAMPAIGNS_API, fillTemplate } from "./campaignApi";
import { CampaignKpiCard } from "./CampaignKpiCard";
import { CampaignLoadError } from "./CampaignLoadError";
import { CampaignRecipientsTable } from "./CampaignRecipientsTable";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";

interface CampaignMetricsPanelProps {
  campaignId: string;
  copy: EmailCampaignsAdminDict["metrics"];
  /** App locale (`es` | `en`). */
  locale: string;
  recipientsCopy: EmailCampaignsAdminDict["recipients"];
  /** Change it to refetch, e.g. after a send. */
  refreshKey?: number;
  retryCopy: { loading: string; retry: string };
}

/** Share of `sent` as a whole percentage; `—` before anything was sent. */
function rate(count: number, sent: number) {
  return sent > 0 ? `${Math.round((count / sent) * 100)}%` : "—";
}

/** Campaign results: KPI cards, bounced/failed strip and the recipients table. */
export function CampaignMetricsPanel({
  campaignId,
  copy,
  locale,
  recipientsCopy,
  refreshKey = 0,
  retryCopy,
}: CampaignMetricsPanelProps) {
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  // State is only set in promise callbacks: this also runs from the mount effect.
  const load = useCallback(() => {
    const id = ++requestId.current;
    const isCurrent = () => id === requestId.current;
    return fetch(`${CAMPAIGNS_API}/${campaignId}/metrics`)
      .then(async (res) => (res.ok ? ((await res.json()) as CampaignReport) : null))
      .then((data) => {
        if (!isCurrent()) return;
        setReport(data);
        setError(!data);
      })
      .catch(() => {
        if (isCurrent()) setError(true);
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const numberLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const metrics = report?.metrics;
  const money = metrics
    ? new Intl.NumberFormat(numberLocale, { currency: metrics.currency, style: "currency" })
    : null;

  return (
    <section className="space-y-6" data-component="CampaignMetricsPanel">
      <EmailCampaignsSectionHeader eyebrow={copy.eyebrow} heading={copy.heading} />
      {error ? (
        <CampaignLoadError
          copy={retryCopy}
          message={copy.errorLoad}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
          retrying={loading}
        />
      ) : !report || !metrics || !money ? (
        loading ? <LoadingSpinner /> : null
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <CampaignKpiCard icon={Send} label={copy.kpis.sent} value={String(metrics.sent)} />
            <CampaignKpiCard
              icon={CheckCheck}
              label={copy.kpis.delivered}
              value={String(metrics.delivered)}
            />
            <CampaignKpiCard
              hint={fillTemplate(copy.rateHint, { count: metrics.uniqueOpens })}
              icon={MailOpen}
              label={copy.kpis.opens}
              value={rate(metrics.uniqueOpens, metrics.sent)}
            />
            <CampaignKpiCard
              hint={fillTemplate(copy.rateHint, { count: metrics.uniqueClicks })}
              icon={MousePointerClick}
              label={copy.kpis.clicks}
              value={rate(metrics.uniqueClicks, metrics.sent)}
            />
            <CampaignKpiCard
              hint={fillTemplate(copy.conversionsHint, { shared: metrics.conversions.shared })}
              icon={ShoppingBag}
              label={copy.kpis.conversions}
              value={String(metrics.conversions.attributed)}
            />
            <CampaignKpiCard
              icon={DollarSign}
              label={copy.kpis.revenue}
              value={money.format(metrics.revenue)}
            />
            <CampaignKpiCard
              icon={TicketPercent}
              label={copy.kpis.discount}
              value={metrics.discountTotal === null ? "—" : money.format(metrics.discountTotal)}
            />
          </div>
          <div
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 sm:flex-row"
            data-component="CampaignMetricsStrip"
          >
            {[
              { label: copy.bounced, value: metrics.bounced },
              { label: copy.failed, value: metrics.failed },
            ].map((item) => (
              <div
                className="flex flex-1 items-center justify-between border-t border-gray-200 px-6 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
                key={item.label}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  {item.label}
                </span>
                <span className="font-barlow-condensed text-3xl font-extrabold text-ink">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs text-neutral-500">
            <p>{copy.opensNote}</p>
            {metrics.otherCurrencyConversions > 0 && (
              <p>{fillTemplate(copy.otherCurrency, { count: metrics.otherCurrencyConversions })}</p>
            )}
          </div>
          <CampaignRecipientsTable copy={recipientsCopy} recipients={report.recipients} />
        </>
      )}
    </section>
  );
}
