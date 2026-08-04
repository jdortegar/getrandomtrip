"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  Eye,
  EyeOff,
  Pencil,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { ExperienceTypePills } from "@/components/common/ExperienceTypePills";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { AdminExperience } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending";

const SELECT_CLASS = "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";

function isLockedForSelection(status: string): boolean {
  return status === "PENDING_REVIEW" || status === "PENDING_TRIPPER_REVIEW";
}

export function AdminExperiencesPageClient() {
  const copy = useDictionary((d) => d.adminPages.experiences);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const router = useRouter();

  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visible = (
    tab === "pending"
      ? experiences.filter(
          (e) => e.status === "PENDING_REVIEW" || e.status === "PENDING_TRIPPER_REVIEW",
        )
      : experiences
  ).filter(
    (e) => normalizedQuery === "" || e.title.toLowerCase().includes(normalizedQuery),
  );

  const selectableVisible = visible.filter((e) => !isLockedForSelection(e.status));
  const allSelectableSelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0 && !allSelectableSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function setTabAndClear(next: Tab) {
    setTab(next);
    setSelectedIds(new Set());
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableVisible.map((e) => e.id)));
    }
  }

  function toggleRowSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkArchive() {
    const ids = Array.from(selectedIds);
    setIsBulkArchiving(true);
    (async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/admin/experiences/${id}`, {
              body: JSON.stringify({ status: "ARCHIVED" }),
              headers: { "Content-Type": "application/json" },
              method: "PATCH",
            }).then((res) => {
              if (!res.ok) throw new Error(String(res.status));
            }),
          ),
        );
        const failedCount = results.filter((r) => r.status === "rejected").length;
        const successCount = ids.length - failedCount;
        setBulkFailureMessage(
          failedCount > 0
            ? copy.bulkActions.partialFailure
                .replace("{success}", String(successCount))
                .replace("{total}", String(ids.length))
                .replace("{failed}", String(failedCount))
            : null,
        );
        setSelectedIds(new Set());
        setArchiveConfirmOpen(false);
        await fetchExperiences();
      } finally {
        setIsBulkArchiving(false);
      }
    })();
  }

  async function fetchExperiences() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/experiences");
      const data = (await res.json()) as {
        error?: string;
        experiences?: AdminExperience[];
      };
      if (!res.ok || !data.experiences) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setExperiences(data.experiences);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  async function updateExperience(
    id: string,
    payload: { isActive?: boolean; isFeatured?: boolean },
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) return;
      await fetchExperiences();
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    void fetchExperiences();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const st = copy.status;
  const act = copy.actions;

  const pendingCount = experiences.filter(
    (e) => e.status === "PENDING_REVIEW" || e.status === "PENDING_TRIPPER_REVIEW",
  ).length;

  return (
    <div className="space-y-10">
      {/* Section header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.title}
        </h2>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            className={SELECT_CLASS}
            onChange={(e) => setTabAndClear(e.target.value as Tab)}
            value={tab}
          >
            <option value="all">{copy.tabs.all}</option>
            <option value="pending">
              {pendingCount > 0
                ? `${copy.tabs.pending} (${pendingCount})`
                : copy.tabs.pending}
            </option>
          </Select>
          <Button
            className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            disabled={selectedIds.size === 0}
            onClick={() => setArchiveConfirmOpen(true)}
            type="button"
          >
            <Archive className="mr-2 h-4 w-4" />
            {copy.bulkActions.archiveSelected.replace(
              "{count}",
              String(selectedIds.size),
            )}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-400">
            {copy.count.replace("{n}", String(visible.length))}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-11 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm shadow-sm placeholder:text-neutral-400 focus:border-gray-300 focus:outline-none"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIds(new Set());
              }}
              placeholder={copy.searchPlaceholder}
              type="text"
              value={searchQuery}
            />
          </div>
        </div>
      </div>

      {bulkFailureMessage && (
        <p className="text-xs text-red-600">{bulkFailureMessage}</p>
      )}

      {/* Table panel */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {tab === "pending" ? copy.emptyPending : copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left">
                    <input
                      aria-label={copy.selectAll}
                      checked={allSelectableSelected}
                      className="h-4 w-4 rounded border-gray-300"
                      onChange={toggleSelectAll}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </th>
                  {[
                    cols.experience,
                    cols.tripper,
                    cols.typeLevel,
                    cols.status,
                    cols.updated,
                    cols.actions,
                  ].map((h) => (
                    <th
                      className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                      key={h}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((item) => {
                  const isPending =
                    item.status === "PENDING_REVIEW" ||
                    item.status === "PENDING_TRIPPER_REVIEW";
                  const isBusy = savingId === item.id;
                  const rowLocked = isLockedForSelection(item.status);
                  return (
                    <tr
                      className={cn(
                        "transition-colors hover:bg-gray-50",
                        isPending && "cursor-pointer",
                      )}
                      key={item.id}
                      onClick={() => {
                        if (isPending) {
                          router.push(
                            `/${locale}/dashboard/admin/experiences/${item.id}`,
                          );
                        }
                      }}
                    >
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          aria-label={copy.selectRow}
                          checked={selectedIds.has(item.id)}
                          className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={rowLocked}
                          onChange={() => toggleRowSelected(item.id)}
                          title={rowLocked ? copy.lockedForSelection : undefined}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {item.destinationCity
                            ? `${item.destinationCity}, ${item.destinationCountry}`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-900">{item.owner.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {item.owner.email}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <ExperienceTypePills
                          types={item.type}
                          level={item.level}
                          locale={locale}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <ExperienceStatusBadge
                          status={item.status}
                          label={
                            copy.status[
                              item.status as keyof typeof copy.status
                            ] ?? item.status
                          }
                        />
                        <p className="mt-1 text-xs text-neutral-400">
                          {item.isFeatured ? st.featured : st.normal}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-500">
                        {new Date(item.updatedAt).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {isPending ? (
                          <TableIconLink
                            href={`/${locale}/dashboard/admin/experiences/${item.id}`}
                            title={act.review}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </TableIconLink>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {item.type.includes("XSED") ? (
                              <TableIconLink
                                href={`/${locale}/dashboard/admin/xsed/${item.id}/edit`}
                                title={act.edit}
                              >
                                <Pencil className="h-4 w-4" />
                              </TableIconLink>
                            ) : (
                              item.source === "RANDOMTRIP" && (
                                <TableIconLink
                                  href={`/${locale}/dashboard/admin/experiences/${item.id}/edit`}
                                  title={act.edit}
                                >
                                  <Pencil className="h-4 w-4" />
                                </TableIconLink>
                              )
                            )}
                            <TableIconButton
                              disabled={isBusy}
                              onClick={() =>
                                void updateExperience(item.id, {
                                  isActive: !item.isActive,
                                })
                              }
                              title={item.isActive ? act.disable : act.enable}
                            >
                              {item.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4 text-light-blue" />
                              )}
                            </TableIconButton>
                            <TableIconButton
                              disabled={isBusy}
                              onClick={() =>
                                void updateExperience(item.id, {
                                  isFeatured: !item.isFeatured,
                                })
                              }
                              title={item.isFeatured ? act.unfeature : act.feature}
                            >
                              {item.isFeatured ? (
                                <StarOff className="h-4 w-4" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </TableIconButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        onConfirm={handleBulkArchive}
        isConfirming={isBulkArchiving}
        icon={Archive}
        tone="neutral"
        title={copy.bulkActions.confirmTitle.replace(
          "{count}",
          String(selectedIds.size),
        )}
        description={copy.bulkActions.confirmBody}
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={copy.bulkActions.confirm}
      />
    </div>
  );
}
