"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { AdminWaitlistEntry } from "@/lib/admin/types";

export function AdminWaitlistPageClient() {
  const [entries, setEntries] = useState<AdminWaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchEntries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/waitlist");
      const data = (await res.json()) as {
        entries?: AdminWaitlistEntry[];
        error?: string;
      };
      if (!res.ok || !data.entries) {
        setError(data.error ?? "Failed to load waitlist");
        return;
      }
      setEntries(data.entries);
    } catch {
      setError("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }

  async function removeEntry(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void fetchEntries();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-5 py-4">
        <p className="text-xs text-neutral-500">{entries.length} waitlist entries</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                {["Name", "Email", "Joined", "Actions"].map((h) => (
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr className="border-b border-gray-100 last:border-0" key={entry.id}>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    {entry.name || entry.lastName
                      ? `${entry.name ?? ""} ${entry.lastName ?? ""}`.trim()
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">{entry.email}</td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      disabled={deletingId === entry.id}
                      onClick={() => void removeEntry(entry.id)}
                      type="button"
                    >
                      {deletingId === entry.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              No waitlist entries found.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
