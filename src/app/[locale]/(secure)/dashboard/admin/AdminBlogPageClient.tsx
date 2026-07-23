"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { BlogStatusBadge } from "@/components/common/BlogStatusBadge";
import { TableIconLink } from "@/components/ui/TableIconButton";
import type { AdminBlog } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending";

const PENDING_STATUSES = new Set(["PENDING_REVIEW", "PENDING_TRIPPER_REVIEW"]);

export function AdminBlogPageClient() {
  const copy = useDictionary((d) => d.adminPages.blog);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const router = useRouter();

  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");

  async function fetchBlogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blogs");
      const data = (await res.json()) as {
        error?: string;
        blogs?: AdminBlog[];
      };
      if (!res.ok || !data.blogs) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setBlogs(data.blogs);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBlogs();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const act = copy.actions;

  const pendingCount = blogs.filter((b) => PENDING_STATUSES.has(b.status)).length;

  const visible =
    tab === "pending" ? blogs.filter((b) => PENDING_STATUSES.has(b.status)) : blogs;

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
          <button
            type="button"
            onClick={() => setTab("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              tab === "all"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300",
            )}
          >
            {copy.tabs.all}
          </button>
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              tab === "pending"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300",
            )}
          >
            {copy.tabs.pending}
            {pendingCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1 text-xs font-semibold text-amber-800">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
        <span className="text-[13px] text-neutral-400">
          {copy.count.replace("{n}", String(visible.length))}
        </span>
      </div>

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
                {visible.map((item) => {
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
      </div>
    </div>
  );
}
