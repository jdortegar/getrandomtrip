// src/components/app/dashboard/tripper/experiences/ExperiencesPageClient.tsx
"use client";

import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import {
  TableIconButton,
  TableIconLink,
} from "@/components/ui/TableIconButton";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { ExperienceTypePills } from "@/components/common/ExperienceTypePills";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";
import {
  EXPERIENCE_LEVELS,
  EXPERIENCE_STATUSES,
  getExperienceTypes,
} from "@/lib/constants/packages";
import type { ExperienceListItem } from "@/types/tripper";
import type { TripperExperiencesDict } from "@/lib/types/dictionary";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

/** Splits a "...{{title}}..." template and renders the interpolated part in bold. */
function renderBoldTitleMessage(template: string, title: string) {
  const [before, after] = template.split("{{title}}");
  return (
    <>
      {before}
      <strong className="font-semibold text-ink">{title}</strong>
      {after}
    </>
  );
}

interface ExperiencesPageClientProps {
  dict: TripperExperiencesDict;
  locale: string;
}

export default function ExperiencesPageClient({
  dict: copy,
  locale,
}: ExperiencesPageClientProps) {
  const filterCopy = useDictionary((d) => d.common.tableFilters);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const [isPending, startTransition] = useTransition();
  const [experiences, setExperiences] = useState<ExperienceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [error, setError] = useState<string | null>(null);
  const [selectedTravelType, setSelectedTravelType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Holds the id of the experience the user wants to delete. null = modal closed.
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(
    null,
  );
  const filtersRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const scrollToFilters = useCallback(() => {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasActiveFilters =
    selectedStatus !== "all" ||
    selectedTravelType !== "all" ||
    selectedLevel !== "all" ||
    searchQuery !== "";

  const queryKey = JSON.stringify([
    page,
    selectedStatus,
    selectedLevel,
    selectedTravelType,
    searchQuery,
    debouncedSearch,
  ]);
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setLoading(true);
  }
  const queryPending = loading || searchQuery !== debouncedSearch;
  const beginRequest = useTableRequestGuard(queryKey);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchExperiences = useCallback(() => {
    if (searchQuery !== debouncedSearch) return;
    const isCurrent = beginRequest();
    if (!isCurrent()) return;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedTravelType !== "all") params.set("type", selectedTravelType);
    if (selectedLevel !== "all") params.set("level", selectedLevel);
    if (debouncedSearch) params.set("search", debouncedSearch);

    return fetch(`/api/tripper/experiences?${params.toString()}`)
      .then(async (res) => ({
        res,
        data: (await res.json()) as {
          experiences?: ExperienceListItem[];
          total?: number;
        },
      }))
      .then(({ res, data }) => {
        if (!isCurrent()) return;
        if (!res.ok || !data.experiences) {
          setError(filterCopy.errorLoad);
          return;
        }
        setError(null);
        setExperiences(data.experiences ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (isCurrent()) setError(filterCopy.errorLoad);
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }, [
    beginRequest,
    searchQuery,
    filterCopy.errorLoad,
    page,
    selectedStatus,
    selectedTravelType,
    selectedLevel,
    debouncedSearch,
  ]);
  const refreshCurrentQuery = useCurrentTableRefresh(async () => {
    if (searchQuery !== debouncedSearch) return;
    setLoading(true);
    await fetchExperiences();
  });

  useEffect(() => {
    void fetchExperiences();
  }, [fetchExperiences]);

  function clearFilters() {
    setSelectedStatus("all");
    setSelectedTravelType("all");
    setSelectedLevel("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedIds(new Set());
    setPage(1);
  }

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setSelectedIds(new Set());
      setPage(1);
    };
  }

  const setSelectedStatusAndClear = updateFilter(setSelectedStatus);
  const setSelectedTravelTypeAndClear = updateFilter(setSelectedTravelType);
  const setSelectedLevelAndClear = updateFilter(setSelectedLevel);

  function handlePageChange(next: number) {
    setPage(next);
    setSelectedIds(new Set());
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Only deletable rows (no bookings, not in review) can join a bulk delete.
  const deletableExperiences = experiences.filter((e) => e.canDelete);
  const allSelected =
    deletableExperiences.length > 0 &&
    deletableExperiences.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableExperiences.map((e) => e.id)));
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

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsBulkDeleting(true);
    startTransition(async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/tripper/experiences/${id}`, { method: "DELETE" }).then(
              (res) => {
                if (!res.ok) throw new Error(String(res.status));
              },
            ),
          ),
        );
        const failedCount = results.filter(
          (r) => r.status === "rejected",
        ).length;
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
        setBulkDeleteConfirmOpen(false);
        await refreshCurrentQuery();
      } finally {
        setIsBulkDeleting(false);
      }
    });
  }

  const basePath = `/${locale}/dashboard/tripper/experiences`;
  const deleteTargetExperience = experiences.find(
    (e) => e.id === deleteTargetId,
  );

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/experiences/${id}`, {
          method: "DELETE",
        });
        // 409 = the server's deletion rule refused (bookings / in review).
        setBulkFailureMessage(
          res.ok
            ? null
            : res.status === 409
              ? copy.table.deleteBlocked
              : copy.table.deleteFailed,
        );
        // Refetch either way so a stale canDelete flag is corrected.
        await refreshCurrentQuery();
      } catch {
        setBulkFailureMessage(copy.table.deleteFailed);
      } finally {
        setDeletingId(null);
      }
    });
  }

  function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/experiences/${id}`, {
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
          body: JSON.stringify({ isActive: !current }),
        });
        if (res.ok) {
          await refreshCurrentQuery();
        }
      } finally {
        setTogglingId(null);
      }
    });
  }

  if (loading && !hasLoadedOnce)
    return <LoadingSpinner data-component="ExperiencesPageClient" />;

  return (
    <div className="space-y-6 text-left" data-component="ExperiencesPageClient">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
            {copy.title}
          </h2>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800"
        >
          <Link href={`${basePath}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.newExperience}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div ref={filtersRef}>
        <TableFilterToolbar
          actions={
            <Button
              className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              type="button"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {copy.bulkActions.deleteSelected.replace(
                "{count}",
                String(selectedIds.size),
              )}
            </Button>
          }
          copy={filterCopy}
          filters={[
            {
              id: "tripper-experiences-status",
              label: filterCopy.status,
              value: selectedStatus,
              onChange: (value) => {
                setSelectedStatusAndClear(value);
                scrollToFilters();
              },
              options: [
                { value: "all", label: filterCopy.all },
                ...EXPERIENCE_STATUSES.map((option) => ({
                  value: option.value,
                  label: copy.status[option.value as keyof typeof copy.status],
                })),
              ],
            },
            {
              id: "tripper-experiences-type",
              label: filterCopy.type,
              value: selectedTravelType,
              onChange: (value) => {
                setSelectedTravelTypeAndClear(value);
                scrollToFilters();
              },
              options: [
                { value: "all", label: filterCopy.all },
                ...getExperienceTypes(locale),
              ],
            },
            {
              id: "tripper-experiences-experience",
              label: filterCopy.experience,
              value: selectedLevel,
              onChange: (value: string) => {
                setSelectedLevelAndClear(value);
                scrollToFilters();
              },
              options: [
                { value: "all", label: filterCopy.all },
                ...EXPERIENCE_LEVELS,
              ],
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          hasError={!!error}
          isLoading={queryPending}
          onClear={clearFilters}
          search={{
            id: "tripper-experiences-search",
            label: filterCopy.searchLabel,
            placeholder: filterCopy.searchTitle,
            value: searchQuery,
            onChange: (value) => {
              setSearchQuery(value);
              setSelectedIds(new Set());
              setPage(1);
            },
          }}
          shown={experiences.length}
          total={total}
        />
      </div>

      {bulkFailureMessage && (
        <p className="text-xs text-red-600">{bulkFailureMessage}</p>
      )}

      {/* Table panel */}
      <TableQueryBoundary
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        copy={filterCopy}
        error={error}
        isLoading={queryPending}
        onRetry={() => {
          if (!queryPending) void refreshCurrentQuery();
        }}
      >
        {experiences.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-sm text-ink">
              {queryPending
                ? filterCopy.loading
                : total === 0 && !hasActiveFilters
                  ? copy.emptyState.noExperiences
                  : copy.emptyState.noMatch}
            </p>
            {!queryPending && total === 0 && !hasActiveFilters && (
              <Button asChild className="mx-auto max-w-xs" size="sm">
                <Link href={`${basePath}/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {copy.emptyState.createFirst}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left">
                    <input
                      aria-label={copy.table.selectAll}
                      checked={allSelected}
                      className="h-4 w-4 rounded border-gray-300"
                      disabled={deletableExperiences.length === 0}
                      onChange={toggleSelectAll}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.package}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.typeLevel}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.duration}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.capacity}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.price}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.updated}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {copy.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {experiences.map((experience) => {
                  const editHref =
                    experience.status === "PENDING_TRIPPER_REVIEW"
                      ? `${basePath}/${experience.id}/review-copy`
                      : `${basePath}/${experience.id}`;
                  const isBusy =
                    deletingId === experience.id ||
                    togglingId === experience.id ||
                    isPending;

                  return (
                    <tr
                      key={experience.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <input
                          aria-label={copy.table.selectRow}
                          checked={selectedIds.has(experience.id)}
                          className="h-4 w-4 rounded border-gray-300"
                          disabled={!experience.canDelete}
                          onChange={() => toggleRowSelected(experience.id)}
                          type="checkbox"
                        />
                      </td>
                      {/* Experience */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {experience.title}
                        </p>
                        <p className="text-xs text-ink">
                          {experience.destinationCity},{" "}
                          {experience.destinationCountry}
                        </p>
                      </td>

                      {/* Type / Level */}
                      <td className="px-5 py-4">
                        <ExperienceTypePills
                          types={experience.type}
                          level={experience.level}
                          locale={locale}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <ExperienceStatusBadge
                          status={experience.status}
                          label={
                            copy.status[
                              experience.status as keyof typeof copy.status
                            ] ?? experience.status
                          }
                        />
                      </td>

                      {/* Duration */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-700">
                        {experience.minNights === experience.maxNights
                          ? `${experience.minNights}n`
                          : `${experience.minNights}–${experience.maxNights}n`}
                      </td>

                      {/* Capacity */}
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-700">
                        {experience.minPax === experience.maxPax
                          ? `${experience.minPax}`
                          : `${experience.minPax}–${experience.maxPax}`}
                        {" pax"}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <span className="font-barlow-condensed text-lg font-bold leading-none text-ink">
                          {experience.pricingByType
                            ? `USD ${Math.min(
                                ...Object.values(experience.pricingByType),
                              ).toLocaleString()}+`
                            : "—"}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-5 py-4 text-sm text-ink">
                        {new Date(experience.updatedAt).toLocaleDateString(
                          locale.startsWith("en") ? "en-US" : "es-ES",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <TableIconLink
                            href={editHref}
                            title={copy.table.edit}
                          >
                            <Pencil className="h-4 w-4" />
                          </TableIconLink>
                          <TableIconButton
                            disabled={isBusy}
                            onClick={() =>
                              handleToggleActive(
                                experience.id,
                                experience.isActive,
                              )
                            }
                            title={
                              experience.isActive
                                ? copy.table.unpublish
                                : copy.table.publish
                            }
                          >
                            {experience.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4 text-secondary" />
                            )}
                          </TableIconButton>
                          <TableIconButton
                            danger
                            disabled={isBusy || !experience.canDelete}
                            onClick={() => handleDelete(experience.id)}
                            title={
                              experience.canDelete
                                ? copy.table.delete
                                : copy.table.deleteBlocked
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </TableIconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableQueryBoundary>

      <div inert={queryPending || !!error || undefined}>
        <Pagination
          nextLabel={paginationCopy.next}
          onPageChange={(next) => {
            if (!queryPending && !error) handlePageChange(next);
          }}
          page={page}
          pageOfLabel={paginationCopy.pageOf}
          previousLabel={paginationCopy.previous}
          totalPages={totalPages}
        />
      </div>

      <ConfirmModal
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        isConfirming={isPending}
        icon={Trash2}
        tone="danger"
        title={copy.table.deleteTitle}
        description={
          deleteTargetExperience
            ? renderBoldTitleMessage(
                copy.table.deleteConfirmMessage,
                deleteTargetExperience.title,
              )
            : null
        }
        cancelLabel={copy.form.cancel}
        confirmLabel={copy.table.delete}
      />

      <ConfirmModal
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        onConfirm={handleBulkDelete}
        isConfirming={isBulkDeleting}
        icon={Trash2}
        tone="danger"
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
