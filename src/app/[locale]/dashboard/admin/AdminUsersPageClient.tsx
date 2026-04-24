"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { UserRoleModal } from "@/components/app/admin/UserRoleModal";
import { UsersTable } from "@/components/app/admin/UsersTable";
import type { AdminUser } from "@/components/app/admin/UsersTableRow";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface AdminUsersPageClientProps {
  copy: MarketingDictionary["adminUsers"];
}

function withCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function AdminUsersPageClient({ copy }: AdminUsersPageClientProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = (await res.json()) as { users?: AdminUser[]; error?: string };
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

  useEffect(() => { void fetchUsers(); }, []);

  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="p-8 text-center text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-5 py-4">
        <p className="text-xs text-neutral-500">{withCount(copy.usersCount, users.length)}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <UsersTable
          copy={copy}
          onEdit={setSelectedUserId}
          selectedId={selectedUserId}
          users={users}
        />
      </div>
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
    </div>
  );
}
