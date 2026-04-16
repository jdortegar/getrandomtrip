import type { AdminUser } from './UsersTableRow';
import { UsersTableRow } from './UsersTableRow';

const HEADERS = ['User', 'Role', 'Tripper slug', 'Joined', ''];

interface UsersTableProps {
  onEdit: (id: string) => void;
  selectedId: string | null;
  users: AdminUser[];
}

export function UsersTable({ onEdit, selectedId, users }: UsersTableProps) {
  return (
    <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-sm font-medium text-neutral-600 last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UsersTableRow
              key={user.id}
              isSelected={selectedId === user.id}
              onEdit={onEdit}
              user={user}
            />
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-400">No users found.</p>
      )}
    </div>
  );
}
