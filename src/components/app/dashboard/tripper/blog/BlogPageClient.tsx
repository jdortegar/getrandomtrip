"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { BlogStatusBadge } from "@/components/common/BlogStatusBadge";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { getBlogTravelTypeOptions } from "@/lib/constants/blog-filters";
import { resolveBlogRowAction, isBlogRowLockedForDeletion } from "@/lib/blog/row-actions";
import { useDictionary } from "@/hooks/useDictionary";
import type { TripperBlogsDict } from "@/lib/types/dictionary";
import type { BlogFormat, BlogPost } from "@/types/blog";

const BLOG_FORMATS: BlogFormat[] = ["article", "photo", "video", "mixed"];
const BLOG_STATUSES = [
  "draft",
  "pending_review",
  "pending_tripper_review",
  "published",
] as const;

const SELECT_CLASS =
  "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

interface BlogPageClientProps {
  dict: TripperBlogsDict;
  locale: string;
}

export function BlogPageClient({ dict: copy, locale }: BlogPageClientProps) {
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTravelType, setSelectedTravelType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [unpublishTargetId, setUnpublishTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const basePath = `/${locale}/dashboard/tripper/blog`;
  const travelTypeOptions = getBlogTravelTypeOptions(locale);

  const scrollToFilters = useCallback(() => {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasActiveFilters =
    selectedFormat !== "all" ||
    selectedStatus !== "all" ||
    selectedTravelType !== "all" ||
    searchQuery !== "";

  // Debounce the search input — it now drives a server query, not an
  // in-memory filter, so we don't want a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedFormat !== "all") params.set("format", selectedFormat);
      if (selectedTravelType !== "all") params.set("travelType", selectedTravelType);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/tripper/blogs?${params.toString()}`);
      const data = (await res.json()) as {
        blogs?: BlogPost[];
        total?: number;
      };
      setPosts(data.blogs ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, selectedFormat, selectedTravelType, debouncedSearch]);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  function clearFilters() {
    setSelectedFormat("all");
    setSelectedStatus("all");
    setSelectedTravelType("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedIds(new Set());
    setPage(1);
  }

  // Any filter, search, or page change invalidates the current selection —
  // a destructive bulk action should only ever act on rows the user can
  // currently see, never on rows a filter/search/page change has hidden.
  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setSelectedIds(new Set());
      setPage(1);
    };
  }

  const setSelectedFormatAndClear = updateFilter(setSelectedFormat);
  const setSelectedStatusAndClear = updateFilter(setSelectedStatus);
  const setSelectedTravelTypeAndClear = updateFilter(setSelectedTravelType);

  function handlePageChange(next: number) {
    setPage(next);
    setSelectedIds(new Set());
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectablePosts = posts.filter(
    (post) => !isBlogRowLockedForDeletion(post.status),
  );
  const allSelectableSelected =
    selectablePosts.length > 0 &&
    selectablePosts.every((post) => selectedIds.has(post.id));
  const someSelected = selectedIds.size > 0 && !allSelectableSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectablePosts.map((post) => post.id)));
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
            fetch(`/api/tripper/blogs/${id}`, { method: "DELETE" }).then((res) => {
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
    });
  }

  function handleDelete(id: string) {
    if (!confirm(copy.table.deleteConfirm)) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/blogs/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchBlogs();
        }
      } finally {
        setDeletingId(null);
      }
    });
  }

  function setIsActive(id: string, isActive: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/blogs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        if (res.ok) {
          await fetchBlogs();
        }
      } finally {
        setTogglingId(null);
      }
    });
  }

  function handleTogglePublish(post: BlogPost) {
    if (post.isActive) {
      setUnpublishTargetId(post.id);
    } else {
      setIsActive(post.id, true);
    }
  }

  function confirmUnpublish() {
    if (!unpublishTargetId) return;
    setIsActive(unpublishTargetId, false);
    setUnpublishTargetId(null);
  }

  function formatLabel(format: BlogFormat): string {
    return copy.format[format] ?? format;
  }

  function statusLabel(status: BlogPost["status"]): string {
    const key = status.toUpperCase() as keyof typeof copy.status;
    return copy.status[key] ?? status;
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
            {copy.title}
          </h2>
        </div>
        <Button
          asChild
          className="h-11 shrink-0 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-gray-800"
        >
          <Link href={`${basePath}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.newPost}
          </Link>
        </Button>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3"
        ref={filtersRef}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className={SELECT_CLASS}
            onChange={(e) => {
              setSelectedStatusAndClear(e.target.value);
              scrollToFilters();
            }}
            value={selectedStatus}
          >
            <option value="all">{copy.filters.allStatuses}</option>
            {BLOG_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => {
              setSelectedFormatAndClear(e.target.value);
              scrollToFilters();
            }}
            value={selectedFormat}
          >
            <option value="all">{copy.filters.allFormats}</option>
            {BLOG_FORMATS.map((format) => (
              <option key={format} value={format}>
                {formatLabel(format)}
              </option>
            ))}
          </Select>
          <Select
            className={SELECT_CLASS}
            onChange={(e) => {
              setSelectedTravelTypeAndClear(e.target.value);
              scrollToFilters();
            }}
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
            {copy.bulkActions.deleteSelected.replace(
              "{count}",
              String(selectedIds.size),
            )}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-400">
            {posts.length} {copy.filters.of} {total} {copy.filters.count}
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-sm text-neutral-500">
              {total === 0 && !hasActiveFilters
                ? copy.emptyState.noPosts
                : copy.emptyState.noMatch}
            </p>
            {total === 0 && !hasActiveFilters && (
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
                      checked={allSelectableSelected}
                      className="h-4 w-4 rounded border-gray-300"
                      onChange={toggleSelectAll}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.post}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.format}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.updated}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {copy.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map((post) => {
                  const isBusy =
                    deletingId === post.id ||
                    togglingId === post.id ||
                    isPending;
                  const editHref = `${basePath}/${post.id}`;
                  const reviewCopyHref = `${basePath}/${post.id}/review-copy`;
                  const publicHref = post.slug
                    ? `/${locale}/blog/${post.slug}`
                    : null;
                  const rowAction = resolveBlogRowAction(post.status);
                  const rowLocked = isBlogRowLockedForDeletion(post.status);

                  return (
                    <tr
                      className="transition-colors hover:bg-gray-50"
                      key={post.id}
                    >
                      <td className="px-5 py-4">
                        <input
                          aria-label={copy.table.selectRow}
                          checked={selectedIds.has(post.id)}
                          className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={rowLocked}
                          onChange={() => toggleRowSelected(post.id)}
                          title={rowLocked ? copy.table.lockedForDeletion : undefined}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          {post.title}
                        </p>
                        {post.subtitle && (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {post.subtitle}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-[6px] border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                          {formatLabel(post.format)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <BlogStatusBadge
                          label={statusLabel(post.status)}
                          status={post.status}
                        />
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-500">
                        {new Date(post.updatedAt).toLocaleDateString(
                          dateLocale,
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {/* No edit link while an admin's copy holds the source of truth — the
                              original is locked_for_review (409) until the tripper resolves it
                              via the review-copy action below. */}
                          {post.status !== "pending_tripper_review" && (
                            <TableIconLink
                              href={editHref}
                              title={copy.table.edit}
                            >
                              <Pencil className="h-4 w-4" />
                            </TableIconLink>
                          )}
                          {publicHref && post.status === "published" && post.isActive && (
                            <TableIconLink
                              href={publicHref}
                              title={copy.table.view}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </TableIconLink>
                          )}
                          {post.status === "published" && (
                            <TableIconButton
                              disabled={isBusy}
                              onClick={() => handleTogglePublish(post)}
                              title={
                                post.isActive
                                  ? copy.table.unpublish
                                  : copy.table.publish
                              }
                            >
                              {post.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4 text-light-blue" />
                              )}
                            </TableIconButton>
                          )}
                          {rowAction === "waiting" && (
                            <TableIconButton
                              disabled
                              title={copy.table.waitingReview}
                            >
                              <Clock className="h-4 w-4 text-neutral-400" />
                            </TableIconButton>
                          )}
                          {rowAction === "review" && (
                            <TableIconLink
                              href={reviewCopyHref}
                              title={copy.table.reviewChanges}
                            >
                              <ArrowRight className="h-4 w-4 text-light-blue" />
                            </TableIconLink>
                          )}
                          <TableIconButton
                            danger
                            disabled={isBusy || rowLocked}
                            onClick={() => handleDelete(post.id)}
                            title={
                              rowLocked
                                ? copy.table.lockedForDeletion
                                : copy.table.delete
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
      </div>

      <Pagination
        nextLabel={paginationCopy.next}
        onPageChange={handlePageChange}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />

      <ConfirmModal
        open={unpublishTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setUnpublishTargetId(null);
        }}
        onConfirm={confirmUnpublish}
        isConfirming={togglingId === unpublishTargetId}
        icon={EyeOff}
        tone="neutral"
        title={copy.unpublishConfirm.title}
        description={copy.unpublishConfirm.body}
        cancelLabel={copy.unpublishConfirm.cancel}
        confirmLabel={copy.unpublishConfirm.confirm}
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
