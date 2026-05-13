"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { AdminXsedExperience } from "@/lib/admin/types";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  ARCHIVED: "bg-red-100 text-red-800 border-red-200",
  DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

function getCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.adminXsed : esCopy.adminXsed;
}

export function AdminXsedPageClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = getCopy(locale);
  const cols = copy.list.columns;

  const COLUMNS = [
    cols.title,
    cols.slug,
    cols.status,
    cols.destination,
    cols.origin,
    cols.distKm,
    cols.tripDate,
    cols.revealAt,
    cols.pricePerPerson,
    cols.spots,
    cols.sold,
    cols.costTotal,
    cols.marginPct,
    cols.included,
    cols.notIncluded,
    cols.conditions,
    cols.cancellation,
    cols.weather,
    cols.accessibility,
    cols.safety,
    cols.revealCopy,
    cols.preRevealCopy,
    cols.packingHints,
    cols.whatsappMsg,
    cols.adminNotes,
    cols.supplierNotes,
    cols.created,
    cols.updated,
    cols.actions,
  ];

  const [experiences, setExperiences] = useState<AdminXsedExperience[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
        <p className="text-xs text-neutral-500">
          {copy.list.dropsCount.replace("{n}", String(experiences.length))}
        </p>
        <Link
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
          href={`/${locale}/dashboard/admin/xsed/new`}
        >
          <Plus className="h-3.5 w-3.5" />
          {copy.list.newDrop}
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                {COLUMNS.map((h) => (
                  <th
                    className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-600"
                    key={h}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {experiences.map((e) => (
                <tr
                  className="border-b border-gray-100 last:border-0"
                  key={e.id}
                >
                  {/* Title */}
                  <td className="px-4 py-3.5">
                    <p className="whitespace-nowrap text-sm font-semibold text-neutral-900">
                      {e.titleInternal}
                    </p>
                    {e.titlePublicTeaser && (
                      <p className="max-w-48 truncate text-xs text-neutral-500">
                        {e.titlePublicTeaser}
                      </p>
                    )}
                  </td>
                  {/* Slug */}
                  <td className="px-4 py-3.5 text-xs text-neutral-500">
                    {e.slug ?? "—"}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={e.status} />
                  </td>
                  {/* Destination */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-700">
                    {e.destinationCity ?? "—"}
                    {e.destinationState ? `, ${e.destinationState}` : ""}
                  </td>
                  {/* Origin */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-700">
                    {e.originCity ?? "—"}
                    {e.originCountry ? `, ${e.originCountry}` : ""}
                  </td>
                  {/* Distance */}
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {e.distanceKmFromOrigin ?? "—"}
                  </td>
                  {/* Trip Date */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-700">
                    {fmt(e.tripDate)}
                  </td>
                  {/* Reveal At */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-700">
                    {fmt(e.revealAt)}
                  </td>
                  {/* Price/person */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-700">
                    {e.pricePerPerson != null
                      ? `${e.currency} ${e.pricePerPerson.toLocaleString()}`
                      : "—"}
                  </td>
                  {/* Spots */}
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {e.minSpots ?? "—"} – {e.maxSpots ?? "—"}
                  </td>
                  {/* Sold */}
                  <td className="px-4 py-3.5 text-sm font-medium text-neutral-900">
                    {e.soldCount}
                  </td>
                  {/* Cost total */}
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {e.costEstimateTotal != null
                      ? `${e.currency} ${e.costEstimateTotal.toLocaleString()}`
                      : "—"}
                  </td>
                  {/* Margin % */}
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {e.targetMarginPercent != null
                      ? `${e.targetMarginPercent}%`
                      : "—"}
                  </td>
                  {/* Text fields — truncated */}
                  {(
                    [
                      e.included,
                      e.notIncluded,
                      e.generalConditions,
                      e.cancellationPolicy,
                      e.weatherPolicy,
                      e.accessibilityNotes,
                      e.safetyNotes,
                      e.revealCopy,
                      e.preRevealCopy,
                      e.packingHints,
                      e.whatsappMessageTemplate,
                      e.adminNotes,
                      e.supplierNotes,
                    ] as (string | null)[]
                  ).map((val, i) => (
                    <td
                      className="px-4 py-3.5"
                      // eslint-disable-next-line react/no-array-index-key
                      key={i}
                    >
                      {val ? (
                        <span
                          className="block max-w-40 truncate text-xs text-neutral-600"
                          title={val}
                        >
                          {val}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-300">—</span>
                      )}
                    </td>
                  ))}
                  {/* Created */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-neutral-400">
                    {fmt(e.createdAt)}
                  </td>
                  {/* Updated */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-neutral-400">
                    {fmt(e.updatedAt)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      {e.status !== "ACTIVE" && (
                        <button
                          className="whitespace-nowrap text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50"
                          disabled={savingId === e.id}
                          onClick={() => void updateStatus(e.id, "ACTIVE")}
                          type="button"
                        >
                          {copy.list.actions.activate}
                        </button>
                      )}
                      {e.status === "ACTIVE" && (
                        <button
                          className="whitespace-nowrap text-xs font-medium text-yellow-700 hover:text-yellow-900 disabled:opacity-50"
                          disabled={savingId === e.id}
                          onClick={() => void updateStatus(e.id, "INACTIVE")}
                          type="button"
                        >
                          {copy.list.actions.deactivate}
                        </button>
                      )}
                      {e.status !== "ARCHIVED" && (
                        <button
                          className="whitespace-nowrap text-xs font-medium text-neutral-500 hover:text-neutral-800 disabled:opacity-50"
                          disabled={savingId === e.id}
                          onClick={() => void updateStatus(e.id, "ARCHIVED")}
                          type="button"
                        >
                          {copy.list.actions.archive}
                        </button>
                      )}
                      <button
                        className="whitespace-nowrap text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={deletingId === e.id}
                        onClick={() => void deleteExperience(e.id)}
                        type="button"
                      >
                        {deletingId === e.id
                          ? copy.list.actions.deleting
                          : copy.list.actions.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {experiences.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              {copy.list.empty}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
