"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { ExperienceStatusBadge } from "@/components/common/ExperienceStatusBadge";
import type { AdminExperience } from "@/lib/admin/types";
import { useDictionary } from "@/hooks/useDictionary";


type Tab = "all" | "pending";

export function AdminExperiencesPageClient() {
  const copy = useDictionary((d) => d.adminPages.experiences);
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
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
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 border-b border-gray-200 px-5 pt-4 flex items-end gap-1">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "all"
              ? "bg-white border border-b-white border-gray-200 text-neutral-900 -mb-px"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
            tab === "pending"
              ? "bg-white border border-b-white border-gray-200 text-neutral-900 -mb-px"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Pending / In review
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              {pendingCount}
            </span>
          )}
        </button>
        <div className="ml-auto pb-2">
          <p className="text-xs text-neutral-500">
            {copy.count.replace("{n}", String(visible.length))}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                {[
                  cols.experience,
                  cols.tripper,
                  cols.status,
                  cols.updated,
                  cols.actions,
                ].map((h) => (
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-neutral-600"
                    key={h}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const isPending = item.status === "PENDING_REVIEW";
                return (
                  <tr
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                      isPending ? "cursor-pointer" : ""
                    }`}
                    key={item.id}
                    onClick={() => {
                      if (isPending) {
                        router.push(
                          `/${locale}/dashboard/admin/experiences/${item.id}`,
                        );
                      }
                    }}
                  >
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-neutral-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.destinationCity
                          ? `${item.destinationCity}, ${item.destinationCountry}`
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-neutral-900">{item.owner.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.owner.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <ExperienceStatusBadge
                        status={item.status}
                        label={
                          copy.status[
                            item.status as keyof typeof copy.status
                          ] ?? item.status
                        }
                      />
                      <p className="text-xs text-neutral-400 mt-1">
                        {item.isFeatured ? st.featured : st.normal}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-neutral-400">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      {isPending ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-100 transition-colors"
                          onClick={() =>
                            router.push(
                              `/${locale}/dashboard/admin/experiences/${item.id}`,
                            )
                          }
                        >
                          Review
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                            disabled={savingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void updateExperience(item.id, {
                                isActive: !item.isActive,
                              });
                            }}
                            type="button"
                          >
                            {item.isActive ? act.disable : act.enable}
                          </button>
                          <span className="text-neutral-200">·</span>
                          <button
                            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                            disabled={savingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void updateExperience(item.id, {
                                isFeatured: !item.isFeatured,
                              });
                            }}
                            type="button"
                          >
                            {item.isFeatured ? act.unfeature : act.feature}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              {tab === "pending"
                ? "No experiences pending review."
                : copy.empty}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
