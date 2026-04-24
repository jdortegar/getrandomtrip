import type { AdminUser } from "./UsersTableRow";
import { UsersTableRow } from "./UsersTableRow";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface UsersTableProps {
  copy: MarketingDictionary["adminUsers"];
  onEdit: (id: string) => void;
  selectedId: string | null;
  users: AdminUser[];
}

export function UsersTable({ copy, onEdit, selectedId, users }: UsersTableProps) {
  const headers = [
    copy.headers.user,
    copy.headers.roles,
    copy.headers.tripperSlug,
    copy.headers.joined,
    copy.headers.actions,
  ];
  return (
    <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-sm font-medium text-neutral-600 "
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UsersTableRow
              copy={copy}
              key={user.id}
              isSelected={selectedId === user.id}
              onEdit={onEdit}
              user={user}
            />
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-400">
          {copy.empty}
        </p>
      )}
    </div>
  );
}
