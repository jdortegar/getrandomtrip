"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { BlogStatusBadge } from "@/components/common/BlogStatusBadge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { BLOG_TRAVEL_TYPE_OPTIONS } from "@/lib/constants/blog-filters";
import { resolveBlogRowAction } from "@/lib/blog/row-actions";
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

interface BlogPageClientProps {
  dict: TripperBlogsDict;
  locale: string;
  posts: BlogPost[];
}

export function BlogPageClient({
  dict: copy,
  locale,
  posts,
}: BlogPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTravelType, setSelectedTravelType] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [unpublishTargetId, setUnpublishTargetId] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const basePath = `/${locale}/dashboard/tripper/blog`;

  const scrollToFilters = useCallback(() => {
    filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hasActiveFilters =
    selectedFormat !== "all" ||
    selectedStatus !== "all" ||
    selectedTravelType !== "all";

  function clearFilters() {
    setSelectedFormat("all");
    setSelectedStatus("all");
    setSelectedTravelType("all");
  }

  const filtered = posts.filter((post) => {
    const formatMatch =
      selectedFormat === "all" || post.format === selectedFormat;
    const statusMatch =
      selectedStatus === "all" || post.status === selectedStatus;
    const travelTypeMatch =
      selectedTravelType === "all" ||
      post.travelType === selectedTravelType;
    return formatMatch && statusMatch && travelTypeMatch;
  });

  function handleDelete(id: string) {
    if (!confirm(copy.table.deleteConfirm)) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tripper/blogs/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.refresh();
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
          router.refresh();
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
              setSelectedStatus(e.target.value);
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
              setSelectedFormat(e.target.value);
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
              setSelectedTravelType(e.target.value);
              scrollToFilters();
            }}
            value={selectedTravelType}
          >
            <option value="all">{copy.filters.allTravelTypes}</option>
            {BLOG_TRAVEL_TYPE_OPTIONS.map((travelType) => (
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
        </div>
        <span className="text-[13px] text-neutral-400">
          {filtered.length} {copy.filters.of} {posts.length}{" "}
          {copy.filters.count}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-sm text-neutral-500">
              {posts.length === 0
                ? copy.emptyState.noPosts
                : copy.emptyState.noMatch}
            </p>
            {posts.length === 0 && (
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
                {filtered.map((post) => {
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

                  return (
                    <tr
                      className="transition-colors hover:bg-gray-50"
                      key={post.id}
                    >
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
                            disabled={isBusy}
                            onClick={() => handleDelete(post.id)}
                            title={copy.table.delete}
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
    </div>
  );
}
