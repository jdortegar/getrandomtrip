"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import { hasLocale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type {
  CampaignListFilters,
  CampaignListItem,
  CampaignSortBy,
} from "@/types/emailCampaign";
import { CAMPAIGNS_API, campaignFailureMessage, readCampaignFailure } from "./campaignApi";
import {
  CAMPAIGN_SORT_DEFAULT,
  EMPTY_CAMPAIGN_FILTERS,
  filterCampaigns,
  nextCampaignSort,
  sortCampaigns,
} from "./campaignListSort";
import { CampaignsFilters } from "./CampaignsFilters";
import { CampaignsTable } from "./CampaignsTable";
import { EmailCampaignsSectionHeader } from "./EmailCampaignsSectionHeader";
import { EmailCampaignsSubnav } from "./EmailCampaignsSubnav";
import { useSegments } from "./useSegments";

const BASE_PATH = "/dashboard/admin/email-campaigns";
const CTA_CLASS =
  "h-11 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800";

/**
 * Campaigns list: the side-by-side comparison of every campaign's results.
 * The API returns every campaign, so filtering and sorting happen client-side.
 */
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
  const [filters, setFilters] = useState<CampaignListFilters>(EMPTY_CAMPAIGN_FILTERS);
  const [sort, setSort] = useState(CAMPAIGN_SORT_DEFAULT);
  const { segments } = useSegments();
  const [deleteTarget, setDeleteTarget] = useState<CampaignListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInFlight = useRef(false);

  const visibleCampaigns = useMemo(
    () => sortCampaigns(filterCampaigns(campaigns, filters), sort.sortBy, sort.sortOrder),
    [campaigns, filters, sort],
  );

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

  function openDelete(campaign: CampaignListItem) {
    setDeleteError(null);
    setDeleteTarget(campaign);
  }

  function closeDelete() {
    if (deleteInFlight.current) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    const target = deleteTarget;
    if (!target || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeletingId(target.id);
    setDeleteError(null);
    try {
      const res = await fetch(`${CAMPAIGNS_API}/${target.id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== target.id));
        setDeleteTarget(null);
        return;
      }
      setDeleteError(campaignFailureMessage(await readCampaignFailure(res), pageCopy.errors));
    } catch {
      setDeleteError(pageCopy.errors.generic);
    } finally {
      deleteInFlight.current = false;
      setDeletingId(null);
    }
  }

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
            <div className="space-y-6">
              <CampaignsFilters
                copy={copy}
                filterCopy={queryCopy}
                filters={filters}
                hasError={!!error}
                isLoading={loading}
                onChange={setFilters}
                segments={segments}
                shown={visibleCampaigns.length}
                total={campaigns.length}
              />
              <CampaignsTable
                campaigns={visibleCampaigns}
                copy={copy}
                dateLocale={dateLocale}
                deletingId={deletingId}
                detailHref={(id) => pathForLocale(safeLocale, `${BASE_PATH}/${id}`)}
                onDelete={openDelete}
                onSort={(field: CampaignSortBy) => setSort((prev) => nextCampaignSort(prev, field))}
                sortBy={sort.sortBy}
                sortOrder={sort.sortOrder}
              />
            </div>
          )}
        </TableQueryBoundary>
      )}

      <ConfirmModal
        cancelLabel={copy.delete.cancel}
        confirmLabel={copy.delete.confirm}
        confirmingLabel={copy.delete.deleting}
        description={
          <>
            {copy.delete.body.replace("{name}", deleteTarget?.name ?? "")}
            {deleteError && (
              <span className="mt-3 block text-sm text-red-700" role="alert">
                {deleteError}
              </span>
            )}
          </>
        }
        icon={Trash2}
        isConfirming={deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open) closeDelete();
        }}
        open={deleteTarget !== null}
        title={copy.delete.title}
        tone="danger"
      />
    </div>
  );
}
