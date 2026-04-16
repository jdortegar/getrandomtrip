import { cn } from '@/lib/utils';

export type UserRole = 'CLIENT' | 'TRIPPER' | 'ADMIN';

export interface AdminUser {
  avatarUrl: string | null;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  role: UserRole;
  tripperSlug: string | null;
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  CLIENT: 'bg-blue-100 text-blue-800 border-blue-200',
  TRIPPER: 'bg-green-100 text-green-800 border-green-200',
};

interface UsersTableRowProps {
  isSelected: boolean;
  onEdit: (id: string) => void;
  user: AdminUser;
}

export function UsersTableRow({ isSelected, onEdit, user }: UsersTableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-100 last:border-0',
        isSelected && 'border-l-2 border-l-gray-900 bg-blue-50',
      )}
    >
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
        <p className="text-xs text-neutral-500">{user.email}</p>
      </td>
      <td className="px-4 py-3.5">
        <span
          className={cn(
            'px-2 py-0.5 text-xs rounded-full border font-medium',
            ROLE_COLORS[user.role],
          )}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-neutral-500">
        {user.tripperSlug ?? '—'}
      </td>
      <td className="px-4 py-3.5 text-xs text-neutral-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3.5 text-right">
        <button
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          onClick={() => onEdit(user.id)}
          type="button"
        >
          {isSelected ? 'editing' : 'Edit'}
        </button>
      </td>
    </tr>
  );
}
