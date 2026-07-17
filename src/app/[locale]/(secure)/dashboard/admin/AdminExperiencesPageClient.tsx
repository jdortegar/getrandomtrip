"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Pencil, Star, StarOff } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import { ExperienceTypePills } from "@/components/common/ExperienceTypePills";
import { TableIconButton, TableIconLink } from "@/components/ui/TableIconButton";
import type { AdminExperience } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending";

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

  const visible =
    tab === "pending"
      ? experiences.filter(
          (e) => e.status === "PENDING_REVIEW" || e.status === "PENDING_TRIPPER_REVIEW",
        )
      : experiences;

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
    </div>
  );
}
