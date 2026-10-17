"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatusIndicatorBadge } from "@/components/common/StatusIndicatorBadge";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Campaign } from "@/types/emailCampaign";
import { CAMPAIGNS_API, CAMPAIGNS_PATH, fillTemplate } from "./campaignApi";
import { CampaignDeleteControl } from "./CampaignDeleteControl";
import { CampaignEditorForm } from "./CampaignEditorForm";
import { CampaignLoadError } from "./CampaignLoadError";
import { CampaignMetricsPanel } from "./CampaignMetricsPanel";
import { CampaignPreviewPanel } from "./CampaignPreviewPanel";
import { CampaignSendPanel } from "./CampaignSendPanel";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";
import { EmailCampaignsSubnav } from "./EmailCampaignsSubnav";

type LoadState = "loading" | "ready" | "notFound" | "error";

interface CampaignDetailPageClientProps {
  campaignId: string;
}

/**
 * Campaign detail: DRAFTs are edited, previewed, test-sent, sent or deleted;
 * once sent the page shows the send outcome and the campaign metrics.
 */
export function CampaignDetailPageClient({ campaignId }: CampaignDetailPageClientProps) {
  const pageCopy = useDictionary((d) => d.adminPages.emailCampaigns);
  const retryCopy = useDictionary((d) => d.common.tableFilters);
  const locale = useLocale();
  const router = useRouter();
  const safeLocale = hasLocale(locale) ? locale : "es";
  const dateLocale = safeLocale === "en" ? "en-US" : "es-ES";
  const listHref = pathForLocale(safeLocale, CAMPAIGNS_PATH);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [metricsKey, setMetricsKey] = useState(0);
  const requestId = useRef(0);

  // State is only set in promise callbacks: this also runs from the mount effect.
  const load = useCallback(() => {
    const id = ++requestId.current;
    const isCurrent = () => id === requestId.current;
    return fetch(`${CAMPAIGNS_API}/${campaignId}`)
      .then(async (res) => ({
        data: res.ok ? ((await res.json()) as { campaign: Campaign }) : null,
        res,
      }))
      .then(({ data, res }) => {
        if (!isCurrent()) return;
        if (data) {
          setCampaign(data.campaign);
          setState("ready");
        } else {
          setState(res.status === 404 ? "notFound" : "error");
        }
      })
      .catch(() => {
        if (isCurrent()) setState("error");
      });
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  const subnav = <EmailCampaignsSubnav active="campaigns" copy={pageCopy.tabs} locale={locale} />;

  if (state !== "ready" || !campaign) {
    return (
      <div className="space-y-10">
        {subnav}
        {state === "loading" ? (
          <LoadingSpinner />
        ) : state === "error" ? (
          <CampaignLoadError
            copy={retryCopy}
            message={pageCopy.detail.errorLoad}
            onRetry={() => {
              setState("loading");
              void load();
            }}
            retrying={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-neutral-700">{pageCopy.detail.notFound}</p>
            <Button asChild size="sm" variant="secondary">
              <Link href={listHref}>
                <ArrowLeft aria-hidden className="h-4 w-4" />
                {pageCopy.detail.backToList}
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const isDraft = campaign.status === "DRAFT";
  const sentOn = campaign.sentAt
    ? fillTemplate(pageCopy.detail.sentOn, {
        date: new Date(campaign.sentAt).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })
    : null;

  return (
    <div className="space-y-10">
      {subnav}
      <div className="space-y-3">
        <EmailCampaignsSectionHeader
          action={
            <StatusIndicatorBadge
              family="email-campaign"
              label={pageCopy.campaigns.status[campaign.status] ?? campaign.status}
              status={campaign.status}
            />
          }
          eyebrow={isDraft ? pageCopy.editor.editEyebrow : pageCopy.detail.eyebrow}
          heading={campaign.name}
        />
        <p className="text-sm text-neutral-500">
          {campaign.subject}
          {sentOn ? ` · ${sentOn}` : ""}
        </p>
      </div>

      {isDraft ? (
        <div className="space-y-4">
          <CampaignEditorForm
            campaign={campaign}
            copy={pageCopy.editor}
            dateLocale={dateLocale}
            defaultLocale={campaign.locale}
            errorsCopy={pageCopy.errors}
            localeLabels={pageCopy.locales}
            onSaved={setCampaign}
            sourceLabels={pageCopy.contacts.source}
          />
          <CampaignDeleteControl
            campaignId={campaign.id}
            copy={pageCopy.editor.delete}
            errorsCopy={pageCopy.errors}
            onDeleted={() => router.push(listHref)}
          />
        </div>
      ) : null}

      <CampaignPreviewPanel
        campaignId={campaign.id}
        copy={pageCopy.preview}
        errorsCopy={pageCopy.errors}
        version={campaign.updatedAt}
      />

      <CampaignSendPanel
        campaignId={campaign.id}
        copy={pageCopy.send}
        errorsCopy={pageCopy.errors}
        onSent={() => {
          setMetricsKey((key) => key + 1);
          void load();
        }}
        status={campaign.status}
        statusCopy={pageCopy.campaigns.status}
      />

      {isDraft ? null : (
        <CampaignMetricsPanel
          campaignId={campaign.id}
          copy={pageCopy.metrics}
          locale={safeLocale}
          recipientsCopy={pageCopy.recipients}
          refreshKey={metricsKey}
          retryCopy={retryCopy}
        />
      )}
    </div>
  );
}
