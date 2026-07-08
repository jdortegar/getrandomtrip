import type { AdminUser } from "./UsersTableRow";
import { UsersTableRow } from "./UsersTableRow";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface UsersTableProps {
  copy: MarketingDictionary["adminUsers"];
  locale: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectedId: string | null;
  users: AdminUser[];
}

export function UsersTable({
  copy,
  locale,
  onDelete,
  onEdit,
  selectedId,
  users,
}: UsersTableProps) {
  const headers = [
    copy.headers.user,
    copy.headers.roles,
    copy.headers.tripperSlug,
    copy.headers.joined,
    copy.headers.actions,
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {users.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          {copy.empty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
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
                  isSelected={selectedId === user.id}
                  key={user.id}
                  locale={locale}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  user={user}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
