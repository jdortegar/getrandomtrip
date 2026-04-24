import { cn } from "@/lib/utils";
import type { MarketingDictionary } from "@/lib/types/dictionary";

export type UserRole = "CLIENT" | "TRIPPER" | "ADMIN";

export interface AdminUser {
  avatarUrl: string | null;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  roles: UserRole[];
  tripperSlug: string | null;
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  CLIENT: "bg-blue-100 text-blue-800 border-blue-200",
  TRIPPER: "bg-green-100 text-green-800 border-green-200",
};

interface UsersTableRowProps {
  copy: MarketingDictionary["adminUsers"];
  isSelected: boolean;
  onEdit: (id: string) => void;
  user: AdminUser;
}

export function UsersTableRow({
  copy,
  isSelected,
  onEdit,
  user,
}: UsersTableRowProps) {
  const displayRoles = [...user.roles].sort((a, b) => a.localeCompare(b));
  return (
    <tr
      className={cn(
        "border-b border-gray-100 last:border-0",
        isSelected && "border-l-2 border-l-gray-900 bg-blue-50",
      )}
    >
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
        <p className="text-xs text-neutral-500">{user.email}</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap gap-1">
          {displayRoles.map((r) => (
            <span
              className={cn(
                "px-2 py-0.5 text-xs rounded-full border font-medium",
                ROLE_COLORS[r],
              )}
              key={r}
            >
              {r}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-neutral-500">
        {user.tripperSlug ?? "—"}
      </td>
      <td className="px-4 py-3.5 text-xs text-neutral-400">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3.5">
        <button
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          onClick={() => onEdit(user.id)}
          type="button"
        >
          {isSelected ? copy.editing : copy.edit}
        </button>
      </td>
    </tr>
  );
}
