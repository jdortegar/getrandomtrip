"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { AdminXsedExperience } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  ARCHIVED: "bg-neutral-100 text-neutral-600 border-neutral-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVE: "bg-red-100 text-red-800 border-red-200",
};

const STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;

function fmt(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(
    locale.startsWith("en") ? "en-US" : "es-AR",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export function AdminXsedPageClient() {
  const locale = useLocale();
  const copy = useDictionary(d => d.adminXsed);
  const cols = copy.list.columns;

  const [experiences, setExperiences] = useState<AdminXsedExperience[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchExperiences() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/xsed");
      const data = (await res.json()) as {
        error?: string;
        experiences?: AdminXsedExperience[];
      };
      if (!res.ok || !data.experiences) {
        setError(data.error ?? copy.list.errorLoad);
        return;
      }
      setExperiences(data.experiences);
    } catch {
      setError(copy.list.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/xsed/${id}`, {
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) return;
      setExperiences((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e)),
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteExperience(id: string) {
    if (!confirm(copy.list.confirmDelete)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/xsed/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setExperiences((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void fetchExperiences();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const filtered =
    statusFilter === "all"
      ? experiences
      : experiences.filter((e) => e.status === statusFilter);

  const newDropPath = `/${locale}/dashboard/admin/xsed/new`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2">
          Admin
        </p>
        <h1 className="font-barlow-condensed font-bold text-5xl text-neutral-900 uppercase">
          XSED Drops
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {copy.list.dropsCount.replace("{n}", String(experiences.length))}
        </p>
      </div>

      {/* Filters + new button */}
      <div className="flex items-center justify-between gap-3">
        <Select
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
        >
          <option value="all">{copy.list.filterAllStatuses}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button asChild>
          <Link href={newDropPath}>
            <Plus className="h-4 w-4 mr-2" />
            {copy.list.newDrop}
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-500 mb-4">
              {experiences.length === 0 ? copy.list.empty : copy.list.filterAllStatuses}
            </p>
            {experiences.length === 0 && (
              <Button asChild size="sm" className="mx-auto max-w-xs">
                <Link href={newDropPath}>
                  <Plus className="h-4 w-4 mr-2" />
                  {copy.list.newDrop}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    cols.title,
                    cols.destination,
                    cols.tripDate,
                    cols.revealAt,
                    cols.pricePerPerson,
                    cols.spots,
                    cols.sold,
                    cols.status,
                    cols.updated,
                    cols.actions,
                  ].map((h) => (
                    <th
                      className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                      key={h}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-left">
                {filtered.map((e) => (
                  <tr
                    className="hover:bg-gray-50 transition-colors"
                    key={e.id}
                  >
                    {/* Drop */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                        {e.titleInternal}
                      </p>
                      {e.titlePublicTeaser && (
                        <p className="text-xs text-neutral-500 max-w-48 truncate">
                          {e.titlePublicTeaser}
                        </p>
                      )}
                      {e.slug && (
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          {e.slug}
                        </p>
                      )}
                    </td>

                    {/* Destination */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm text-neutral-700">
                        {e.destinationCity ?? "—"}
                        {e.destinationState ? `, ${e.destinationState}` : ""}
                      </p>
                      {e.originCity && (
                        <p className="text-xs text-neutral-500">
                          {cols.origin}: {e.originCity}
                          {e.originCountry ? `, ${e.originCountry}` : ""}
                        </p>
                      )}
                    </td>

                    {/* Trip Date */}
                    <td className="px-5 py-4 text-sm text-neutral-700 whitespace-nowrap">
                      {fmt(e.tripDate, locale)}
                    </td>

                    {/* Reveal At */}
                    <td className="px-5 py-4 text-sm text-neutral-700 whitespace-nowrap">
                      {fmt(e.revealAt, locale)}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 text-sm text-neutral-700 whitespace-nowrap">
                      {e.pricePerPerson != null
                        ? `${e.currency} ${e.pricePerPerson.toLocaleString()}`
                        : "—"}
                    </td>

                    {/* Spots */}
                    <td className="px-5 py-4 text-sm text-neutral-700 whitespace-nowrap">
                      {e.minSpots ?? "—"} – {e.maxSpots ?? "—"}
                    </td>

                    {/* Sold */}
                    <td className="px-5 py-4 text-sm font-semibold text-neutral-900">
                      {e.soldCount}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[e.status] ?? STATUS_COLORS.DRAFT}`}
                      >
                        {e.status}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-4 text-sm text-neutral-500 whitespace-nowrap">
                      {fmt(e.updatedAt, locale)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/${locale}/dashboard/admin/xsed/${e.id}`}>
                          {copy.list.actions.edit}
                        </Link>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
