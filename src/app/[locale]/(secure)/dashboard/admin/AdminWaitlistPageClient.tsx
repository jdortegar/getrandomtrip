"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { TableIconButton } from "@/components/ui/TableIconButton";
import { cn } from "@/lib/utils";
import type { AdminWaitlistEntry } from "@/lib/admin/types";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

const PAGE_SIZE = 20;

const inviteChipClass: Record<"invited" | "expired" | "alreadyMember", string> = {
  invited: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
  alreadyMember: "border-neutral-200 bg-neutral-50 text-neutral-600",
};

export function AdminWaitlistPageClient() {
  const copy = useDictionary((d) => d.adminPages.waitlist);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const locale = useLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";

  const [entries, setEntries] = useState<AdminWaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkInviteConfirmOpen, setBulkInviteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [isBulkInviting, setIsBulkInviting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(
    null,
  );
  const selectAllRef = useRef<HTMLInputElement>(null);

  async function fetchEntries() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/waitlist?page=${page}&limit=${PAGE_SIZE}`,
      );
      const data = (await res.json()) as {
        entries?: AdminWaitlistEntry[];
        error?: string;
        total?: number;
      };
      if (!res.ok || !data.entries) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setEntries(data.entries);
      setTotal(data.total ?? 0);
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
      setTotal((prev) => Math.max(0, prev - 1));
    } finally {
      setDeletingId(null);
    }
  }

  async function inviteAsTripper(id: string) {
    setInvitingId(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}/invite`, {
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
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const allChecked =
    entries.length > 0 && entries.every((e) => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0 && !allChecked;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleSelectAll() {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const invitableSelectedIds = entries
    .filter((e) => selectedIds.has(e.id) && !e.alreadyMember)
    .map((e) => e.id);
  const inviteDisabled = invitableSelectedIds.length === 0;
  const deleteDisabled = selectedIds.size === 0;
  const skippedCount = selectedIds.size - invitableSelectedIds.length;

  function handleBulkInvite() {
    const ids = invitableSelectedIds;
    setIsBulkInviting(true);
    (async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/admin/waitlist/${id}/invite`, {
              method: "POST",
            }).then((res) => {
              if (!res.ok) throw new Error(String(res.status));
            }),
          ),
        );
        const failedCount = results.filter(
          (r) => r.status === "rejected",
        ).length;
        const successCount = ids.length - failedCount;
        setBulkFailureMessage(
          failedCount > 0
            ? copy.bulkActions.partialFailure
                .replace("{success}", String(successCount))
                .replace("{total}", String(ids.length))
                .replace("{failed}", String(failedCount))
            : null,
        );
        setSelectedIds(new Set());
        setBulkInviteConfirmOpen(false);
        await fetchEntries();
      } finally {
        setIsBulkInviting(false);
      }
    })();
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsBulkDeleting(true);
    (async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" }).then(
              (res) => {
                if (!res.ok) throw new Error(String(res.status));
              },
            ),
          ),
        );
        const failedCount = results.filter(
          (r) => r.status === "rejected",
        ).length;
        const successCount = ids.length - failedCount;
        setBulkFailureMessage(
          failedCount > 0
            ? copy.bulkActions.partialFailure
                .replace("{success}", String(successCount))
                .replace("{total}", String(ids.length))
                .replace("{failed}", String(failedCount))
            : null,
        );
        setSelectedIds(new Set());
        setBulkDeleteConfirmOpen(false);
        await fetchEntries();
      } finally {
        setIsBulkDeleting(false);
      }
    })();
  }

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            className="h-11 rounded-sm border-2 border-gray-900 bg-gray-900 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            disabled={inviteDisabled}
            onClick={() => setBulkInviteConfirmOpen(true)}
            title={
              inviteDisabled && selectedIds.size > 0
                ? copy.bulkActions.inviteNothingToDo
                : undefined
            }
            type="button"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {copy.bulkActions.inviteSelected.replace(
              "{count}",
              String(selectedIds.size),
            )}
          </Button>
          <Button
            className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            disabled={deleteDisabled}
            onClick={() => setBulkDeleteConfirmOpen(true)}
            type="button"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {copy.bulkActions.deleteSelected.replace(
              "{count}",
              String(selectedIds.size),
            )}
          </Button>
        </div>
        <span className="text-[13px] text-neutral-400">
          {copy.count.replace("{n}", String(total))}
        </span>
      </div>

      {bulkFailureMessage && (
        <p className="text-xs text-red-600">{bulkFailureMessage}</p>
      )}

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
                  <th className="px-5 py-3 text-left">
                    <input
                      aria-label={copy.selectAll}
                      checked={allChecked}
                      className="h-4 w-4 rounded border-gray-300"
                      onChange={toggleSelectAll}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </th>
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
                    <td className="px-5 py-4">
                      <input
                        aria-label={copy.selectRow}
                        checked={selectedIds.has(entry.id)}
                        className="h-4 w-4 rounded border-gray-300"
                        onChange={() => toggleRow(entry.id)}
                        type="checkbox"
                      />
                    </td>
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
                      {entry.alreadyMember ? (
                        <span
                          className={cn(
                            "rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
                            inviteChipClass.alreadyMember,
                          )}
                        >
                          {copy.alreadyMemberBadge}
                        </span>
                      ) : (
                        entry.inviteStatus && (
                          <span
                            className={cn(
                              "rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
                              inviteChipClass[entry.inviteStatus],
                            )}
                          >
                            {copy.inviteStatus[entry.inviteStatus]}
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <TableIconButton
                          disabled={invitingId === entry.id || entry.alreadyMember}
                          onClick={() => void inviteAsTripper(entry.id)}
                          title={
                            entry.alreadyMember
                              ? copy.alreadyMemberHint
                              : invitingId === entry.id
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

      <Pagination
        nextLabel={paginationCopy.next}
        onPageChange={setPage}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />

      <ConfirmModal
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={copy.bulkActions.confirm}
        description={
          skippedCount > 0
            ? `${copy.bulkActions.inviteConfirmBody.replace(
                "{count}",
                String(invitableSelectedIds.length),
              )} ${copy.bulkActions.inviteSkippedNote.replace(
                "{skipped}",
                String(skippedCount),
              )}`
            : copy.bulkActions.inviteConfirmBody.replace(
                "{count}",
                String(invitableSelectedIds.length),
              )
        }
        icon={UserPlus}
        isConfirming={isBulkInviting}
        onConfirm={handleBulkInvite}
        onOpenChange={setBulkInviteConfirmOpen}
        open={bulkInviteConfirmOpen}
        title={copy.bulkActions.inviteConfirmTitle}
        tone="neutral"
      />

      <ConfirmModal
        cancelLabel={copy.bulkActions.cancel}
        confirmLabel={copy.bulkActions.confirm}
        description={copy.bulkActions.deleteConfirmBody.replace(
          "{count}",
          String(selectedIds.size),
        )}
        icon={Trash2}
        isConfirming={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onOpenChange={setBulkDeleteConfirmOpen}
        open={bulkDeleteConfirmOpen}
        title={copy.bulkActions.deleteConfirmTitle}
        tone="danger"
      />
    </div>
  );
}
