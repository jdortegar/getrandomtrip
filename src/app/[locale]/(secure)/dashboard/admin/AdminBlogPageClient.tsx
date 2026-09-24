"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Pencil, Search, Trash2, X } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { BlogStatusBadge } from "@/components/common/BlogStatusBadge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { getBlogLevelOptions, getBlogTravelTypeOptions } from "@/lib/constants/blog-filters";
import { EXPERIENCE_LEVELS } from "@/lib/constants/packages";
import type { AdminBlog } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending";

const PENDING_STATUSES = new Set(["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"]);
const PAGE_SIZE = 20;
const SELECT_CLASS = "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";
const SEARCH_DEBOUNCE_MS = 350;

export function AdminBlogPageClient() {
  const copy = useDictionary((d) => d.adminPages.blog);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const router = useRouter();
  const travelTypeOptions = getBlogTravelTypeOptions(locale);
  const levelOptions = getBlogLevelOptions();

  function levelLabel(level: string | null): string {
    if (!level) return "—";
    return EXPERIENCE_LEVELS.find((l) => l.value === level)?.label ?? level;
  }

  function travelTypeLabel(travelType: string[]): string {
    if (!travelType || travelType.length === 0) return "—";
    return travelType
      .map((tt) => travelTypeOptions.find((o) => o.key === tt)?.label ?? tt)
      .join(", ");
  }

  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  // Defaults to "all" — RANDOMTRIP (admin-created) posts skip PENDING_REVIEW
  // entirely and auto-publish, so a "pending"-first default would hide them.
  const [tab, setTab] = useState<Tab>("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedTravelType, setSelectedTravelType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Id of the post pending delete confirmation. null = modal closed.
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    selectedLevel !== "all" || selectedTravelType !== "all" || searchQuery !== "";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function fetchBlogs() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (tab === "pending") {
        params.set("status", Array.from(PENDING_STATUSES).join(","));
      }
      if (selectedLevel !== "all") params.set("level", selectedLevel);
      if (selectedTravelType !== "all") params.set("travelType", selectedTravelType);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/blogs?${params.toString()}`);
      const data = (await res.json()) as {
        error?: string;
        blogs?: AdminBlog[];
        total?: number;
        pendingCount?: number;
      };
      if (!res.ok || !data.blogs) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setBlogs(data.blogs);
      setTotal(data.total ?? 0);
      setPendingCount(data.pendingCount ?? 0);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBlogs();
  }, [page, tab, selectedLevel, selectedTravelType, debouncedSearch]);

  // All hooks must run before the early returns below (Rules of Hooks) —
  // this derives from `blogs`/`selectedIds`, which are already up to date
  // even while `loading` is true (they hold the previous page's data).
  const selectableBlogs = blogs.filter((b) => !PENDING_STATUSES.has(b.status));
  const allSelectableSelected =
    selectableBlogs.length > 0 &&
    selectableBlogs.every((b) => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0 && !allSelectableSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;
  if (error && !hasLoadedOnce)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const act = copy.actions;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleTabChange(next: Tab) {
    setTab(next);
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

  const setSelectedLevelAndClear = updateFilter(setSelectedLevel);
  const setSelectedTravelTypeAndClear = updateFilter(setSelectedTravelType);

  function clearFilters() {
    setSelectedLevel("all");
    setSelectedTravelType("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedIds(new Set());
    setPage(1);
  }

  function handlePageChange(next: number) {
    setPage(next);
    setSelectedIds(new Set());
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableBlogs.map((b) => b.id)));
    }
  }

  function toggleRowSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setDeletingId(id);
    void fetch(`/api/admin/blogs/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) return fetchBlogs();
      })
      .finally(() => setDeletingId(null));
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsBulkDeleting(true);
    void (async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/admin/blogs/${id}`, { method: "DELETE" }).then((res) => {
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
        setBulkDeleteConfirmOpen(false);
        await fetchBlogs();
      } finally {
        setIsBulkDeleting(false);
      }
    })();
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
            onChange={(e) => handleTabChange(e.target.value as Tab)}
            value={tab}
          >
            <option value="all">{copy.tabs.all}</option>
            <option value="pending">
              {pendingCount > 0
                ? `${copy.tabs.pending} (${pendingCount})`
                : copy.tabs.pending}
            </option>
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => setSelectedLevelAndClear(e.target.value)}
            value={selectedLevel}
          >
            <option value="all">{copy.filters.allExperiences}</option>
            {levelOptions.map((level) => (
              <option key={level.key} value={level.key}>
                {level.label}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => setSelectedTravelTypeAndClear(e.target.value)}
            value={selectedTravelType}
          >
            <option value="all">{copy.filters.allTravelTypes}</option>
            {travelTypeOptions.map((travelType) => (
              <option key={travelType.key} value={travelType.key}>
                {travelType.label}
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
            className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-4 text-[13px] font-semibold uppercase tracking-[1px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            disabled={selectedIds.size === 0}
            onClick={() => setBulkDeleteConfirmOpen(true)}
            type="button"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {copy.bulkActions.deleteSelected.replace("{count}", String(selectedIds.size))}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-400">
            {blogs.length} {copy.filters.of} {total} {copy.filters.count}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-11 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm shadow-sm placeholder:text-neutral-400 focus:border-gray-300 focus:outline-none"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIds(new Set());
                setPage(1);
              }}
              placeholder={copy.filters.searchPlaceholder}
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
        {blogs.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink">
            {tab === "pending" ? copy.emptyPending : copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left">
                    <input
                      aria-label={copy.table.selectAll}
                      checked={allSelectableSelected}
                      className="h-4 w-4 rounded border-gray-300"
                      onChange={toggleSelectAll}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </th>
                  {[
                    cols.post,
                    cols.tripper,
                    cols.level,
                    cols.travelType,
                    cols.status,
                    cols.updated,
                    cols.actions,
                  ].map(
                    (h) => (
                      <th
                        className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink"
                        key={h}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {blogs.map((item) => {
                  const isPending = PENDING_STATUSES.has(item.status);
                  // RANDOMTRIP (admin-created) posts skip PENDING_REVIEW and
                  // auto-publish — there's nothing to "review" for them, so
                  // they get a direct edit link instead of the review flow.
                  const isRandomtrip = item.source === "RANDOMTRIP";
                  const isBusy = deletingId === item.id;
                  return (
                    <tr
                      className={cn(
                        "transition-colors hover:bg-gray-50",
                        (isPending || isRandomtrip) && "cursor-pointer",
                      )}
                      key={item.id}
                      onClick={() => {
                        if (isPending) {
                          router.push(`/${locale}/dashboard/admin/blog/${item.id}`);
                        } else if (isRandomtrip) {
                          router.push(`/${locale}/dashboard/admin/blog/${item.id}/edit`);
                        }
                      }}
                    >
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          aria-label={copy.table.selectRow}
                          checked={selectedIds.has(item.id)}
                          className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={isPending}
                          onChange={() => toggleRowSelected(item.id)}
                          title={isPending ? act.lockedForDeletion : undefined}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="mt-0.5 text-xs text-ink">
                            {item.subtitle}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-ink">{item.author.name}</p>
                        <p className="mt-0.5 text-xs text-ink">
                          {item.author.email}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">
                        {levelLabel(item.level)}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">
                        {travelTypeLabel(item.travelType)}
                      </td>
                      <td className="px-5 py-4">
                        <BlogStatusBadge
                          status={item.status}
                          label={
                            copy.status[item.status as keyof typeof copy.status] ??
                            item.status
                          }
                        />
                      </td>
                      <td className="px-5 py-4 text-sm text-ink">
                        {new Date(item.updatedAt).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {isPending && (
                            <TableIconLink
                              href={`/${locale}/dashboard/admin/blog/${item.id}`}
                              title={act.review}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </TableIconLink>
                          )}
                          {isRandomtrip && (
                            <TableIconLink
                              href={`/${locale}/dashboard/admin/blog/${item.id}/edit`}
                              title={act.edit}
                            >
                              <Pencil className="h-4 w-4" />
                            </TableIconLink>
                          )}
                          <TableIconButton
                            danger
                            disabled={isBusy || isPending}
                            onClick={() => setDeleteTargetId(item.id)}
                            title={isPending ? act.lockedForDeletion : act.delete}
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
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        isConfirming={deletingId !== null}
        icon={Trash2}
        tone="danger"
        title={act.deleteTitle}
        description={act.deleteConfirm}
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={act.delete}
      />

      <ConfirmModal
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        onConfirm={handleBulkDelete}
        isConfirming={isBulkDeleting}
        icon={Trash2}
        tone="danger"
        title={copy.bulkActions.confirmTitle.replace("{count}", String(selectedIds.size))}
        description={copy.bulkActions.confirmBody}
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={copy.bulkActions.confirm}
      />
    </div>
  );
}
