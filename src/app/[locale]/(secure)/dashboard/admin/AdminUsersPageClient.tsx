"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { TableFilterToolbar } from "@/components/ui/TableFilterToolbar";
import { TableQueryBoundary } from "@/components/ui/TableQueryBoundary";
import { useCurrentTableRefresh } from "@/hooks/useCurrentTableRefresh";
import { useTableRequestGuard } from "@/hooks/useTableRequestGuard";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { BulkDeleteUsersModal } from "@/components/app/admin/BulkDeleteUsersModal";
import { DeleteUserModal } from "@/components/app/admin/DeleteUserModal";
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

export function AdminUsersPageClient({ copy }: AdminUsersPageClientProps) {
  const locale = useLocale();
  const filterCopy = useDictionary((d) => d.common.tableFilters);
  const paginationCopy = useDictionary((d) => d.common.pagination);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useHasLoadedOnce(loading);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFailureMessage, setBulkFailureMessage] = useState<string | null>(
    null,
  );
  const selectAllRef = useRef<HTMLInputElement>(null);

  const queryPending = loading || searchQuery !== debouncedSearch;
  const beginRequest = useTableRequestGuard(
    JSON.stringify([page, searchQuery, debouncedSearch]),
  );

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    if (searchQuery !== debouncedSearch) return;
    const isCurrent = beginRequest();
    if (!isCurrent()) return;
    setLoading(true);
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
      if (!isCurrent()) return;
      if (res.ok && data.users) {
        setError(null);
        setUsers(data.users);
        setTotal(data.total ?? 0);
      } else {
        setError(data.error ?? copy.errorFallback);
      }
    } catch {
      if (isCurrent()) setError(copy.errorFallback);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [beginRequest, searchQuery, page, debouncedSearch, copy.errorFallback]);
  const refreshCurrentQuery = useCurrentTableRefresh(fetchUsers);

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
      await refreshCurrentQuery();
    } finally {
      setInvitingId(null);
    }
  }

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
            fetch(`/api/admin/users/${id}`, { method: "DELETE" }).then(
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
        setBulkSelectedIds(new Set());
        setBulkDeleteOpen(false);
        await refreshCurrentQuery();
      } finally {
        setIsBulkDeleting(false);
      }
    })();
  }

  const hasActiveFilters = searchQuery !== "";
  function clearFilters() {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
    setBulkSelectedIds(new Set());
  }

  if (loading && !hasLoadedOnce) return <LoadingSpinner />;

  if (error && !hasLoadedOnce) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <TableFilterToolbar
        actions={
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
        }
        copy={filterCopy}
        filters={[]}
        hasActiveFilters={hasActiveFilters}
        hasError={!!error}
        isLoading={queryPending}
        onClear={clearFilters}
        search={{
          id: "admin-users-search",
          label: filterCopy.searchLabel,
          placeholder: filterCopy.searchName,
          value: searchQuery,
          onChange: (value) => {
            setSearchQuery(value);
            setBulkSelectedIds(new Set());
            setPage(1);
          },
        }}
        shown={users.length}
        total={total}
      />

      {bulkFailureMessage && (
        <p className="text-xs text-red-600">{bulkFailureMessage}</p>
      )}

      <TableQueryBoundary
        copy={filterCopy}
        error={error}
        isLoading={queryPending}
        onRetry={() => {
          if (!queryPending) void fetchUsers();
        }}
      >
        <UsersTable
          allSelectableChecked={allSelectableChecked}
          bulkSelectedIds={bulkSelectedIds}
          copy={copy}
          currentUserId={currentUserId}
          error={null}
          invitingId={invitingId}
          isLoading={queryPending}
          locale={locale}
          onDelete={setDeleteTargetId}
          onInvite={(id) => void inviteAsTripper(id)}
          onToggleBulkSelect={toggleBulkSelect}
          onToggleSelectAll={toggleSelectAll}
          selectAllRef={selectAllRef}
          users={users}
        />
      </TableQueryBoundary>

      <div inert={queryPending || !!error || undefined}>
        <Pagination
          nextLabel={paginationCopy.next}
          onPageChange={(next) => {
            if (!queryPending && !error) handlePageChange(next);
          }}
          page={page}
          pageOfLabel={paginationCopy.pageOf}
          previousLabel={paginationCopy.previous}
          totalPages={totalPages}
        />
      </div>

      <BulkDeleteUsersModal
        copy={copy}
        count={bulkSelectedIds.size}
        isDeleting={isBulkDeleting}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        open={bulkDeleteOpen}
      />

      {deleteTarget && (
        <DeleteUserModal
          copy={copy}
          key={deleteTarget.id}
          onClose={() => setDeleteTargetId(null)}
          onDeleted={() => {
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setTotal((prev) => Math.max(0, prev - 1));
            setDeleteTargetId(null);
            void refreshCurrentQuery();
          }}
          open
          user={deleteTarget}
        />
      )}
    </div>
  );
}
