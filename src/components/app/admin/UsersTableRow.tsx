import { Pencil, Trash2 } from "lucide-react";
import { TableIconButton } from "@/components/ui/TableIconButton";
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
  locale: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  user: AdminUser;
}

export function UsersTableRow({
  copy,
  isSelected,
  locale,
  onDelete,
  onEdit,
  user,
}: UsersTableRowProps) {
  const displayRoles = [...user.roles].sort((a, b) => a.localeCompare(b));
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-gray-50",
        isSelected && "border-l-2 border-l-gray-900 bg-blue-50",
      )}
    >
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{user.email}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {displayRoles.map((r) => (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                ROLE_COLORS[r],
              )}
              key={r}
            >
              {r}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-neutral-500">
        {user.tripperSlug ?? "—"}
      </td>
      <td className="px-5 py-4 text-sm text-neutral-500">
        {new Date(user.createdAt).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <TableIconButton onClick={() => onEdit(user.id)} title={copy.edit}>
            <Pencil className="h-4 w-4" />
          </TableIconButton>
          <TableIconButton
            danger
            onClick={() => onDelete(user.id)}
            title={copy.modal.delete}
          >
            <Trash2 className="h-4 w-4" />
          </TableIconButton>
        </div>
      </td>
    </tr>
  );
}
