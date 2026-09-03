"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowRight,
  Eye,
  EyeOff,
  Pencil,
  Search,
  Star,
  StarOff,
  X,
} from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { ExperienceTypePills } from "@/components/common/ExperienceTypePills";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { SortButton } from "@/components/ui/SortButton";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  EXPERIENCE_SORT_DEFAULT,
  EXPERIENCE_SORT_INITIAL_ORDER,
  parseExperienceSortBy,
  parseExperienceSortOrder,
  type ExperienceSortBy,
  type ExperienceSortOrder,
} from "@/lib/admin/experiencesSort";
import type { AdminExperience } from "@/lib/admin/types";
import {
  EXPERIENCE_LEVELS,
  EXPERIENCE_TYPES,
  getExperienceTypes,
} from "@/lib/constants/packages";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { useQuerySync } from "@/hooks/useQuerySync";
import { cn } from "@/lib/utils";

/** "PENDING" is a synthetic value spanning both pending-review statuses —
 * everything else maps 1:1 to an Experience.status value. */
type StatusFilter =
  | "ALL"
  | "PENDING"
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

const SELECT_CLASS = "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const PENDING_STATUSES = "PENDING_REVIEW,PENDING_TRIPPER_REVIEW";

function isLockedForSelection(status: string): boolean {
  return status === "PENDING_REVIEW" || status === "PENDING_TRIPPER_REVIEW";
}

const STATUS_FILTER_VALUES: readonly StatusFilter[] = [
  "ALL",
  "PENDING",
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];

/** Whitelist-validated URL param readers — a stale/tampered query string must
 * never crash the page or reach the API with a bogus filter value. */
function parseStatusFilter(value: string | null): StatusFilter {
  return (STATUS_FILTER_VALUES as readonly string[]).includes(value ?? "")
    ? (value as StatusFilter)
    : "PENDING";
}

function parseTypeFilter(value: string | null): string {
  return value && EXPERIENCE_TYPES.some((t) => t.value === value) ? value : "ALL";
}

function parseLevelFilter(value: string | null): string {
  return value && EXPERIENCE_LEVELS.some((l) => l.value === value) ? value : "ALL";
}

function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function AdminExperiencesPageClient() {
  const copy = useDictionary((d) => d.adminPages.experiences);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const router = useRouter();
  const searchParams = useSearchParams();
  const updateQuery = useQuerySync();

  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(() => parsePage(searchParams.get("page")));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusFilter(searchParams.get("status")),
  );
  const [typeFilter, setTypeFilter] = useState<string>(() =>
    parseTypeFilter(searchParams.get("type")),
  );
  const [levelFilter, setLevelFilter] = useState<string>(() =>
    parseLevelFilter(searchParams.get("level")),
  );
  const [sortBy, setSortBy] = useState<ExperienceSortBy>(() =>
    parseExperienceSortBy(searchParams.get("sortBy")),
  );
  const [sortOrder, setSortOrder] = useState<ExperienceSortOrder>(() =>
    parseExperienceSortOrder(searchParams.get("sortOrder")),
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      updateQuery({ search: searchQuery || undefined, page: undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const selectableVisible = experiences.filter((e) => !isLockedForSelection(e.status));
  const allSelectableSelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0 && !allSelectableSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function handleStatusChange(next: StatusFilter) {
    setStatusFilter(next);
    setSelectedIds(new Set());
    setPage(1);
    updateQuery({ status: next === "PENDING" ? undefined : next, page: undefined });
  }

  function handleTypeChange(next: string) {
    setTypeFilter(next);
    setSelectedIds(new Set());
    setPage(1);
    updateQuery({ type: next === "ALL" ? undefined : next, page: undefined });
  }

  function handleLevelChange(next: string) {
    setLevelFilter(next);
    setSelectedIds(new Set());
    setPage(1);
    updateQuery({ level: next === "ALL" ? undefined : next, page: undefined });
  }

  function toggleSort(field: ExperienceSortBy) {
    const nextOrder: ExperienceSortOrder =
      field === sortBy
        ? sortOrder === "asc"
          ? "desc"
          : "asc"
        : EXPERIENCE_SORT_INITIAL_ORDER[field];
    setSortBy(field);
    setSortOrder(nextOrder);
    setSelectedIds(new Set());
    setPage(1);
    updateQuery({
      sortBy: field === EXPERIENCE_SORT_DEFAULT.sortBy ? undefined : field,
      sortOrder:
        nextOrder === EXPERIENCE_SORT_DEFAULT.sortOrder ? undefined : nextOrder,
      page: undefined,
    });
  }

  function clearFilters() {
    setStatusFilter("PENDING");
    setTypeFilter("ALL");
    setLevelFilter("ALL");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedIds(new Set());
    setPage(1);
    updateQuery({
      status: undefined,
      type: undefined,
      level: undefined,
      search: undefined,
      page: undefined,
    });
  }

  function handlePageChange(next: number) {
    setPage(next);
    setSelectedIds(new Set());
    updateQuery({ page: next === 1 ? undefined : String(next) });
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

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy,
        sortOrder,
      });
      if (statusFilter === "PENDING") {
        params.set("status", PENDING_STATUSES);
      } else if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (levelFilter !== "ALL") params.set("level", levelFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/experiences?${params.toString()}`);
      const data = (await res.json()) as {
        error?: string;
        experiences?: AdminExperience[];
        total?: number;
        pendingCount?: number;
      };
      if (!res.ok || !data.experiences) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setExperiences(data.experiences);
      setTotal(data.total ?? 0);
      setPendingCount(data.pendingCount ?? 0);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    statusFilter,
    typeFilter,
    levelFilter,
    sortBy,
    sortOrder,
    debouncedSearch,
    copy.errorLoad,
  ]);

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
  }, [fetchExperiences]);

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;
  if (error && !hasLoadedOnce)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const st = copy.status;
  const act = copy.actions;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const experienceTypes = getExperienceTypes(locale);
  const hasActiveFilters =
    statusFilter !== "PENDING" ||
    typeFilter !== "ALL" ||
    levelFilter !== "ALL" ||
    searchQuery !== "";

  function ariaSortFor(
    field: ExperienceSortBy,
  ): "ascending" | "descending" | "none" {
    if (sortBy !== field) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  }

  function sortAriaLabel(label: string): string {
    return copy.sort.ariaSortBy.replace("{field}", label);
  }

  return (
    <div className="space-y-10">
      {/* Section header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {copy.title}
        </h2>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            className={SELECT_CLASS}
            onChange={(e) =>
              handleStatusChange(e.target.value as StatusFilter)
            }
            value={statusFilter}
          >
            <option value="ALL">{copy.tabs.all}</option>
            <option value="PENDING">
              {pendingCount > 0
                ? `${copy.tabs.pending} (${pendingCount})`
                : copy.tabs.pending}
            </option>
            <option value="DRAFT">{st.DRAFT}</option>
            <option value="ACTIVE">{st.ACTIVE}</option>
            <option value="INACTIVE">{st.INACTIVE}</option>
            <option value="ARCHIVED">{st.ARCHIVED}</option>
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => handleTypeChange(e.target.value)}
            value={typeFilter}
          >
            <option value="ALL">{copy.filters.allTypes}</option>
            {experienceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => handleLevelChange(e.target.value)}
            value={levelFilter}
          >
            <option value="ALL">{copy.filters.allLevels}</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
          {hasActiveFilters && (
            <button
              className="flex h-11 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-4 text-[13px] font-medium text-neutral-600 transition-colors hover:border-gray-300 hover:bg-neutral-50"
              onClick={clearFilters}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
              {copy.filters.clearFilters}
            </button>
          )}
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
            {copy.count.replace("{n}", String(total))}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-11 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm shadow-sm placeholder:text-neutral-400 focus:border-gray-300 focus:outline-none"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIds(new Set());
                setPage(1);
                updateQuery({ page: undefined });
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
      <TableLoadingOverlay
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        isLoading={loading}
      >
        {error && (
          <div
            className="border-b border-red-100 bg-red-50 p-3 text-center text-sm text-red-600"
            role="alert"
          >
            {error}
          </div>
        )}
        {experiences.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink">
            {statusFilter === "PENDING" ? copy.emptyPending : copy.empty}
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
                  <th aria-sort={ariaSortFor("experience")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "experience"}
                      ariaLabel={sortAriaLabel(cols.experience)}
                      label={cols.experience}
                      onSort={() => toggleSort("experience")}
                      order={sortOrder}
                    />
                  </th>
                  <th aria-sort={ariaSortFor("tripper")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "tripper"}
                      ariaLabel={sortAriaLabel(cols.tripper)}
                      label={cols.tripper}
                      onSort={() => toggleSort("tripper")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {cols.typeLevel}
                  </th>
                  <th aria-sort={ariaSortFor("status")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "status"}
                      ariaLabel={sortAriaLabel(cols.status)}
                      label={cols.status}
                      onSort={() => toggleSort("status")}
                      order={sortOrder}
                    />
                  </th>
                  <th aria-sort={ariaSortFor("updated")} className="px-5 py-3 text-left">
                    <SortButton
                      active={sortBy === "updated"}
                      ariaLabel={sortAriaLabel(cols.updated)}
                      label={cols.updated}
                      onSort={() => toggleSort("updated")}
                      order={sortOrder}
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink">
                    {cols.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {experiences.map((item) => {
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
                        <p className="text-sm font-semibold text-ink">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-ink">
                          {item.destinationCity
                            ? `${item.destinationCity}, ${item.destinationCountry}`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-ink">{item.owner.name}</p>
                        <p className="mt-0.5 text-xs text-ink">
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
                      <td className="px-5 py-4 text-sm text-ink">
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
                                <Eye className="h-4 w-4 text-secondary" />
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
      </TableLoadingOverlay>

      <Pagination
        nextLabel={paginationCopy.next}
        onPageChange={handlePageChange}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />

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
