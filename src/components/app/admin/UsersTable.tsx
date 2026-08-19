import type { RefObject } from "react";
import type { AdminUser } from "./UsersTableRow";
import { UsersTableRow } from "./UsersTableRow";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface UsersTableProps {
  allSelectableChecked: boolean;
  bulkSelectedIds: Set<string>;
  copy: MarketingDictionary["adminUsers"];
  currentUserId: string | null;
  error: string | null;
  invitingId: string | null;
  isLoading: boolean;
  locale: string;
  onDelete: (id: string) => void;
  onInvite: (id: string) => void;
  onToggleBulkSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  selectAllRef: RefObject<HTMLInputElement | null>;
  users: AdminUser[];
}

export function UsersTable({
  allSelectableChecked,
  bulkSelectedIds,
  copy,
  currentUserId,
  error,
  invitingId,
  isLoading,
  locale,
  onDelete,
  onInvite,
  onToggleBulkSelect,
  onToggleSelectAll,
  selectAllRef,
  users,
}: UsersTableProps) {
  const headers = [
    copy.headers.user,
    copy.headers.roles,
    copy.headers.commission,
    copy.headers.tripperSlug,
    copy.headers.joined,
    copy.headers.status,
    copy.headers.actions,
  ];
  return (
    <TableLoadingOverlay
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      isLoading={isLoading}
    >
      {error && (
        <div
          className="border-b border-red-100 bg-red-50 p-3 text-center text-sm text-red-600"
          role="alert"
        >
          {error}
        </div>
      )}
      {users.length === 0 ? (
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
                    checked={allSelectableChecked}
                    className="h-4 w-4 rounded border-gray-300"
                    onChange={onToggleSelectAll}
                    ref={selectAllRef}
                    type="checkbox"
                  />
                </th>
                {headers.map((h) => (
                  <th
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                    key={h}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <UsersTableRow
                  copy={copy}
                  invitingId={invitingId}
                  isCheckedForBulk={bulkSelectedIds.has(user.id)}
                  key={user.id}
                  locale={locale}
                  onDelete={onDelete}
                  onInvite={onInvite}
                  onToggleBulkSelect={onToggleBulkSelect}
                  rowLockedForBulk={user.id === currentUserId}
                  user={user}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TableLoadingOverlay>
  );
}
