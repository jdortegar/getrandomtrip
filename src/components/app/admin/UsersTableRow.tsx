import { Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import { TableIconButton } from "@/components/ui/TableIconButton";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export type UserRole = "CLIENT" | "TRIPPER" | "ADMIN";

export interface AdminUser {
  avatarUrl: string | null;
  createdAt: string;
  email: string;
  id: string;
  inviteStatus?: "invited" | "expired" | null;
  name: string;
  roles: UserRole[];
  tripperSlug: string | null;
}

interface UsersTableRowProps {
  copy: MarketingDictionary["adminUsers"];
  invitingId: string | null;
  isSelected: boolean;
  locale: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onInvite: (id: string) => void;
  user: AdminUser;
}

const inviteChipClass: Record<"invited" | "expired", string> = {
  invited: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
};

export function UsersTableRow({
  copy,
  invitingId,
  isSelected,
  locale,
  onDelete,
  onEdit,
  onInvite,
  user,
}: UsersTableRowProps) {
  const displayRoles = [...user.roles].sort((a, b) => a.localeCompare(b));
  const dateLocale = locale.startsWith("en") ? "en-US" : "es-ES";
  const isTripperOrAdmin =
    user.roles.includes("TRIPPER") || user.roles.includes("ADMIN");
  const isInviting = invitingId === user.id;
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
            <StatusBadge
              key={r}
              label={copy.roles[r]}
              status={r}
              variant="role"
            />
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
        {user.inviteStatus && (
          <span
            className={cn(
              "rounded-[6px] border px-2 py-0.5 text-[11px] font-medium",
              inviteChipClass[user.inviteStatus],
            )}
          >
            {copy.inviteStatus[user.inviteStatus]}
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {!isTripperOrAdmin && (
            <TableIconButton
              disabled={isInviting}
              onClick={() => onInvite(user.id)}
              title={
                isInviting
                  ? copy.invite.inviting
                  : user.inviteStatus
                    ? copy.invite.resend
                    : copy.invite.inviteTripper
              }
            >
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
            </TableIconButton>
          )}
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
