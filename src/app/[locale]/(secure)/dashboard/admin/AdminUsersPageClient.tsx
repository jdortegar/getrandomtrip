"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { DeleteUserModal } from "@/components/app/admin/DeleteUserModal";
import { UserRoleModal } from "@/components/app/admin/UserRoleModal";
import { UsersTable } from "@/components/app/admin/UsersTable";
import type { AdminUser } from "@/components/app/admin/UsersTableRow";
import { useLocale } from "@/hooks/useDictionary";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface AdminUsersPageClientProps {
  copy: MarketingDictionary["adminUsers"];
}

function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function AdminUsersPageClient({ copy }: AdminUsersPageClientProps) {
  const locale = useLocale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = (await res.json()) as {
        users?: AdminUser[];
        error?: string;
      };
      if (res.ok && data.users) {
        setUsers(data.users);
      } else {
        setError(data.error ?? copy.errorFallback);
      }
    } catch {
      setError(copy.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
  }, []);

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  const deleteTarget = deleteTargetId
    ? users.find((u) => u.id === deleteTargetId)
    : null;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-end">
        <span className="text-[13px] text-neutral-400">
          {withCount(copy.usersCount, users.length)}
        </span>
      </div>

      <UsersTable
        copy={copy}
        locale={locale}
        onDelete={setDeleteTargetId}
        onEdit={setSelectedUserId}
        selectedId={selectedUserId}
        users={users}
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
            setDeleteTargetId(null);
          }}
          open
          user={deleteTarget}
        />
      )}
    </div>
  );
}
