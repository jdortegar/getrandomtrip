"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { BulkDeleteUsersModal } from "@/components/app/admin/BulkDeleteUsersModal";
import { DeleteUserModal } from "@/components/app/admin/DeleteUserModal";
import { UserRoleModal } from "@/components/app/admin/UserRoleModal";
import { UsersTable } from "@/components/app/admin/UsersTable";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import type { AdminUser } from "@/components/app/admin/UsersTableRow";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { useHasLoadedOnce } from "@/hooks/useHasLoadedOnce";
import type { MarketingDictionary } from "@/lib/types/dictionary";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

interface AdminUsersPageClientProps {
  copy: MarketingDictionary["adminUsers"];
}

function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function AdminUsersPageClient({ copy }: AdminUsersPageClientProps) {
  const locale = useLocale();
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = (await res.json()) as {
        users?: AdminUser[];
        error?: string;
        total?: number;
      };
      if (res.ok && data.users) {
        setUsers(data.users);
        setTotal(data.total ?? 0);
      } else {
        setError(data.error ?? copy.errorFallback);
      }
    } catch {
      setError(copy.errorFallback);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, copy.errorFallback]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  function handlePageChange(next: number) {
    setPage(next);
    setBulkSelectedIds(new Set());
  }

  async function inviteAsTripper(id: string) {
    setInvitingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/invite-tripper`, {
        method: "POST",
      });
      if (!res.ok) return;
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, inviteStatus: "invited" } : u)),
      );
    } finally {
      setInvitingId(null);
    }
  }

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const deleteTarget = deleteTargetId
    ? users.find((u) => u.id === deleteTargetId)
    : null;

  const selectableVisible = users.filter((u) => u.id !== currentUserId);
  const allSelectableChecked =
    selectableVisible.length > 0 &&
    selectableVisible.every((u) => bulkSelectedIds.has(u.id));
  const someSelected = bulkSelectedIds.size > 0 && !allSelectableChecked;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function toggleSelectAll() {
    if (allSelectableChecked) {
      setBulkSelectedIds(new Set());
    } else {
      setBulkSelectedIds(new Set(selectableVisible.map((u) => u.id)));
    }
  }

  function toggleBulkSelect(id: string) {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(bulkSelectedIds);
    setIsBulkDeleting(true);
    (async () => {
      try {
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`/api/admin/users/${id}`, { method: "DELETE" }).then((res) => {
              if (!res.ok) throw new Error(String(res.status));
            }),
          ),
        );
        const failedCount = results.filter((r) => r.status === "rejected").length;
        const successCount = ids.length - failedCount;
        setBulkFailureMessage(
          failedCount > 0
            ? copy.bulkActions.partialFailure
                .replace("{success}", String(successCount))
                .replace("{total}", String(ids.length))
                .replace("{failed}", String(failedCount))
            : null,
        );
        setBulkSelectedIds(new Set());
        setBulkDeleteOpen(false);
        await fetchUsers();
      } finally {
        setIsBulkDeleting(false);
      }
    })();
  }

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;

  if (error && !hasLoadedOnce) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          className="h-11 rounded-sm border-2 border-red-600 bg-red-600 px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          disabled={bulkSelectedIds.size === 0}
          onClick={() => setBulkDeleteOpen(true)}
          type="button"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {copy.bulkActions.deleteSelected.replace(
            "{count}",
            String(bulkSelectedIds.size),
          )}
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-400">
            {withCount(copy.usersCount, total)}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-11 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm shadow-sm placeholder:text-neutral-400 focus:border-gray-300 focus:outline-none"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setBulkSelectedIds(new Set());
                setPage(1);
              }}
              placeholder={copy.searchPlaceholder}
              type="text"
              value={searchQuery}
            />
          </div>
        </div>
      </div>

      {bulkFailureMessage && (
        <p className="text-xs text-red-600">{bulkFailureMessage}</p>
      )}

      <UsersTable
        allSelectableChecked={allSelectableChecked}
        bulkSelectedIds={bulkSelectedIds}
        copy={copy}
        currentUserId={currentUserId}
        error={error}
        invitingId={invitingId}
        isLoading={loading}
        locale={locale}
        onDelete={setDeleteTargetId}
        onEdit={setSelectedUserId}
        onInvite={(id) => void inviteAsTripper(id)}
        onToggleBulkSelect={toggleBulkSelect}
        onToggleSelectAll={toggleSelectAll}
        selectAllRef={selectAllRef}
        selectedId={selectedUserId}
        users={users}
      />

      <Pagination
        nextLabel={paginationCopy.next}
        onPageChange={handlePageChange}
        page={page}
        pageOfLabel={paginationCopy.pageOf}
        previousLabel={paginationCopy.previous}
        totalPages={totalPages}
      />

      <BulkDeleteUsersModal
        copy={copy}
        count={bulkSelectedIds.size}
        isDeleting={isBulkDeleting}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        open={bulkDeleteOpen}
      />

      {selectedUser && (
        <UserRoleModal
          copy={copy}
          key={selectedUser.id}
          onClose={() => setSelectedUserId(null)}
          onSaved={() => void fetchUsers()}
          open
          user={selectedUser}
        />
      )}
      {deleteTarget && (
        <DeleteUserModal
          copy={copy}
          key={deleteTarget.id}
          onClose={() => setDeleteTargetId(null)}
          onDeleted={() => {
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setTotal((prev) => Math.max(0, prev - 1));
            setDeleteTargetId(null);
          }}
          open
          user={deleteTarget}
        />
      )}
    </div>
  );
}
