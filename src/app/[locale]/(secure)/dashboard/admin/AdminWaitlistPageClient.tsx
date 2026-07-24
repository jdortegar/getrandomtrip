"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { TableIconButton } from "@/components/ui/TableIconButton";
import { cn } from "@/lib/utils";
import type { AdminWaitlistEntry } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

const inviteChipClass: Record<"invited" | "expired", string> = {
  invited: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
};

export function AdminWaitlistPageClient() {
  const copy = useDictionary((d) => d.adminPages.waitlist);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  const [entries, setEntries] = useState<AdminWaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

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
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setEntries(data.entries);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  async function removeEntry(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function inviteAsTripper(id: string) {
    setInvitingId(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}/invite-tripper`, {
        method: "POST",
      });
      if (!res.ok) return;
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, inviteStatus: "invited" } : e)),
      );
    } finally {
      setInvitingId(null);
    }
  }

  useEffect(() => {
    void fetchEntries();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-end">
        <span className="text-[13px] text-neutral-400">
          {copy.count.replace("{n}", String(entries.length))}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-500">
            {copy.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.name}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.email}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.joined}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.status}
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    {cols.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <tr className="transition-colors hover:bg-gray-50" key={entry.id}>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {entry.name || entry.lastName
                        ? `${entry.name ?? ""} ${entry.lastName ?? ""}`.trim()
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-700">
                      {entry.email}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {new Date(entry.createdAt).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {entry.inviteStatus && (
                        <span
                          className={cn(
                            "rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
                            inviteChipClass[entry.inviteStatus],
                          )}
                        >
                          {copy.inviteStatus[entry.inviteStatus]}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <TableIconButton
                          disabled={invitingId === entry.id}
                          onClick={() => void inviteAsTripper(entry.id)}
                          title={
                            invitingId === entry.id
                              ? copy.actions.inviting
                              : entry.inviteStatus
                                ? copy.actions.resend
                                : copy.actions.inviteTripper
                          }
                        >
                          {invitingId === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </TableIconButton>
                        <TableIconButton
                          danger
                          disabled={deletingId === entry.id}
                          onClick={() => void removeEntry(entry.id)}
                          title={
                            deletingId === entry.id
                              ? copy.actions.deleting
                              : copy.actions.delete
                          }
                        >
                          {deletingId === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </TableIconButton>
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
