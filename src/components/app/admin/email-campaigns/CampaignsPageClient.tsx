"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { CampaignListItem } from "@/types/emailCampaign";
import { CampaignsTable } from "./CampaignsTable";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";
import { EmailCampaignsSubnav } from "./EmailCampaignsSubnav";

const BASE_PATH = "/dashboard/admin/email-campaigns";
const CTA_CLASS =
  "h-11 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800";

/** Campaigns list: the side-by-side comparison of every campaign's results. */
export function CampaignsPageClient() {
  const pageCopy = useDictionary((d) => d.adminPages.emailCampaigns);
  const queryCopy = useDictionary((d) => d.common.tableFilters);
  const locale = useLocale();
  const safeLocale = hasLocale(locale) ? locale : "es";
  const dateLocale = safeLocale === "en" ? "en-US" : "es-ES";
  const copy = pageCopy.campaigns;

  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const beginRequest = useTableRequestGuard("campaigns");

  const fetchCampaigns = useCallback(() => {
    const isCurrent = beginRequest();
    if (!isCurrent()) return;
    return fetch("/api/admin/email-campaigns/campaigns")
      .then(async (res) => ({
        data: (await res.json()) as { campaigns?: CampaignListItem[] },
        res,
      }))
      .then(({ data, res }) => {
        if (!isCurrent()) return;
        if (res.ok && data.campaigns) {
          setError(null);
          setCampaigns(data.campaigns);
        } else {
          setError(copy.errorLoad);
        }
      })
      .catch(() => {
        if (isCurrent()) setError(copy.errorLoad);
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }, [beginRequest, copy.errorLoad]);
  const refresh = useCurrentTableRefresh(async () => {
    setLoading(true);
    await fetchCampaigns();
  });

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const newHref = pathForLocale(safeLocale, `${BASE_PATH}/new`);
  const newCampaignCta = (
    <Button asChild className={CTA_CLASS}>
      <Link href={newHref}>
        <Plus aria-hidden className="h-4 w-4" />
        {copy.newCampaign}
      </Link>
    </Button>
  );

  return (
    <div className="space-y-10">
      <EmailCampaignsSubnav active="campaigns" copy={pageCopy.tabs} locale={locale} />
      <EmailCampaignsSectionHeader
        action={newCampaignCta}
        eyebrow={copy.eyebrow}
        heading={copy.heading}
      />

      {loading && !hasLoadedOnce ? (
        <LoadingSpinner />
      ) : (
        <TableQueryBoundary
          copy={queryCopy}
          error={error}
          isLoading={loading}
          onRetry={() => {
            if (!loading) void refresh();
          }}
        >
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <h3 className="text-xl font-semibold text-ink">{copy.empty.title}</h3>
              <p className="max-w-md text-sm text-neutral-700">{copy.empty.body}</p>
              {newCampaignCta}
            </div>
          ) : (
            <CampaignsTable
              campaigns={campaigns}
              copy={copy}
              dateLocale={dateLocale}
              detailHref={(id) => pathForLocale(safeLocale, `${BASE_PATH}/${id}`)}
              localeLabels={pageCopy.locales}
              sourceLabels={pageCopy.contacts.source}
            />
          )}
        </TableQueryBoundary>
      )}
    </div>
  );
}
