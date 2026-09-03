"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { BlogStatusBadge } from "@/components/common/BlogStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { TableIconLink } from "@/components/ui/TableIconButton";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import type { AdminBlog } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending";

const PENDING_STATUSES = new Set(["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"]);
const PAGE_SIZE = 20;
const SELECT_CLASS = "h-11 rounded-lg border border-gray-200 shadow-sm text-sm";

export function AdminBlogPageClient() {
  const copy = useDictionary((d) => d.adminPages.blog);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const router = useRouter();

  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [tab, setTab] = useState<Tab>("pending");

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
  }, [page, tab]);

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;
  if (error && !hasLoadedOnce)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const act = copy.actions;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleTabChange(next: Tab) {
    setTab(next);
    setPage(1);
  }

  return (
    <div className="space-y-10">
      {/* Section header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
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
        </div>
        <span className="text-[13px] text-neutral-400">
          {copy.count.replace("{n}", String(total))}
        </span>
      </div>

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
          <p className="py-16 text-center text-sm text-neutral-500">
            {tab === "pending" ? copy.emptyPending : copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {[cols.post, cols.tripper, cols.status, cols.updated, cols.actions].map(
                    (h) => (
                      <th
                        className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
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
                  return (
                    <tr
                      className={cn(
                        "transition-colors hover:bg-gray-50",
                        isPending && "cursor-pointer",
                      )}
                      key={item.id}
                      onClick={() => {
                        if (isPending) {
                          router.push(`/${locale}/dashboard/admin/blog/${item.id}`);
                        }
                      }}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-neutral-900">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {item.subtitle}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-neutral-900">{item.author.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {item.author.email}
                        </p>
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
                      <td className="px-5 py-4 text-sm text-neutral-500">
                        {new Date(item.updatedAt).toLocaleDateString(dateLocale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {isPending && (
                          <TableIconLink
                            href={`/${locale}/dashboard/admin/blog/${item.id}`}
                            title={act.review}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </TableIconLink>
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
        onPageChange={setPage}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />
    </div>
  );
}
