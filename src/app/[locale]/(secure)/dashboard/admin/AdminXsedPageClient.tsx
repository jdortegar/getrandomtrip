"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown, Pencil, Trash2, Loader2 } from "lucide-react";
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

type SortKey = "dropNumber" | "titleInternal" | "destinationCity" | "tripDate" | "revealAt" | "pricePerPerson" | "soldCount" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

function fmt(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(
    locale.startsWith("en") ? "en-US" : "es-AR",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

function dropNumber(slug: string | null): number {
  if (!slug) return 0;
  const n = parseInt(slug, 10);
  return isFinite(n) ? n : 0;
}

function sortValue(e: AdminXsedExperience, key: SortKey): string | number {
  switch (key) {
    case "dropNumber":     return dropNumber(e.slug);
    case "titleInternal":  return e.titleInternal?.toLowerCase() ?? "";
    case "destinationCity": return e.destinationCity?.toLowerCase() ?? "";
    case "tripDate":       return e.tripDate ?? "";
    case "revealAt":       return e.revealAt ?? "";
    case "pricePerPerson": return e.pricePerPerson ?? 0;
    case "soldCount":      return e.soldCount;
    case "status":         return e.status;
    case "updatedAt":      return e.updatedAt ?? "";
  }
}

function applySorting(rows: AdminXsedExperience[], key: SortKey, dir: SortDir) {
  return [...rows].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  active: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKey, active, dir, onSort }: SortHeaderProps) {
  const isActive = active === sortKey;
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
      <button
        className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors"
        onClick={() => onSort(sortKey)}
      >
        {label}
        {isActive ? (
          dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
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
  const [sortKey, setSortKey] = useState<SortKey | null>("dropNumber");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

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

  let filtered =
    statusFilter === "all"
      ? experiences
      : experiences.filter((e) => e.status === statusFilter);

  if (sortKey) {
    filtered = applySorting(filtered, sortKey, sortDir);
  }

  const newDropPath = `/${locale}/dashboard/admin/xsed/new`;
  const sortProps = { active: sortKey, dir: sortDir, onSort: handleSort };

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
                  <SortHeader label="Nº" sortKey="dropNumber" {...sortProps} />
                  <SortHeader label={cols.title} sortKey="titleInternal" {...sortProps} />
                  <SortHeader label={cols.destination} sortKey="destinationCity" {...sortProps} />
                  <SortHeader label={cols.tripDate} sortKey="tripDate" {...sortProps} />
                  <SortHeader label={cols.revealAt} sortKey="revealAt" {...sortProps} />
                  <SortHeader label={cols.pricePerPerson} sortKey="pricePerPerson" {...sortProps} />
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{cols.spots}</th>
                  <SortHeader label={cols.sold} sortKey="soldCount" {...sortProps} />
                  <SortHeader label={cols.status} sortKey="status" {...sortProps} />
                  <SortHeader label={cols.updated} sortKey="updatedAt" {...sortProps} />
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{cols.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-left">
                {filtered.map((e) => (
                  <tr
                    className="hover:bg-gray-50 transition-colors"
                    key={e.id}
                  >
                    {/* Nº */}
                    <td className="px-5 py-4 text-sm font-mono font-semibold text-xsed whitespace-nowrap">
                      {dropNumber(e.slug) > 0 ? `#${dropNumber(e.slug)}` : "—"}
                    </td>

                    {/* Title */}
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
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/${locale}/dashboard/admin/xsed/${e.slug}`} title={copy.list.actions.edit}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          disabled={deletingId === e.id}
                          onClick={() => deleteExperience(e.id)}
                          size="sm"
                          title={copy.list.actions.delete}
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingId === e.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </Button>
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
