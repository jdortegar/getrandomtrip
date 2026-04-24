"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { AdminUser, UserRole } from "./UsersTableRow";

function sortRoles(roles: UserRole[]): UserRole[] {
  return [...roles].sort((a, b) => a.localeCompare(b));
}

function rolesEqual(a: UserRole[], b: UserRole[]): boolean {
  const aa = sortRoles(a).join(",");
  const bb = sortRoles(b).join(",");
  return aa === bb;
}

function withMembershipToggled(
  current: UserRole[],
  member: "ADMIN" | "TRIPPER",
  enabled: boolean,
): UserRole[] {
  const other = current.filter((r) => r !== "CLIENT" && r !== member);
  if (enabled) {
    return sortRoles(["CLIENT", member, ...other]);
  }
  return sortRoles(["CLIENT", ...other]);
}

interface UserRoleModalProps {
  copy: MarketingDictionary["adminUsers"];
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  user: AdminUser;
}

export function UserRoleModal({
  copy,
  onClose,
  onSaved,
  open,
  user,
}: UserRoleModalProps) {
  const [roles, setRoles] = useState<UserRole[]>(user.roles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Depend on role *contents* (order-independent), not array reference — a new
  // `roles[]` reference each parent render would retrigger this and loop with setRoles.
  const userRolesKey = sortRoles([...user.roles]).join(",");

  useEffect(() => {
    setRoles(sortRoles([...user.roles]));
    setError("");
  }, [user.id, userRolesKey]);

  async function handleSave() {
    if (rolesEqual(roles, user.roles)) {
      onClose();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        body: JSON.stringify({ roles: sortRoles(roles) }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? copy.modal.errorFallback);
      }
    } catch {
      setError(copy.modal.errorFallback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      className="flex max-w-md flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-md"
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      open={open}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <DialogTitle className="text-xl font-semibold text-gray-900">
          {user.name}
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-500">
          {user.email}
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-5">
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-900">{copy.modal.roleSection}</p>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              checked
              className="h-4 w-4"
              disabled
              type="checkbox"
            />
            <span>{copy.modal.clientBase}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              checked={roles.includes("TRIPPER")}
              className="h-4 w-4"
              onChange={() => {
                setRoles((prev) =>
                  withMembershipToggled(prev, "TRIPPER", !prev.includes("TRIPPER")),
                );
              }}
              type="checkbox"
            />
            <span>{copy.modal.tripper}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              checked={roles.includes("ADMIN")}
              className="h-4 w-4"
              onChange={() => {
                setRoles((prev) =>
                  withMembershipToggled(prev, "ADMIN", !prev.includes("ADMIN")),
                );
              }}
              type="checkbox"
            />
            <span>{copy.modal.admin}</span>
          </label>
        </div>
        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        <Button
          disabled={saving}
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copy.modal.cancel}
        </Button>
        <Button
          disabled={saving || rolesEqual(roles, user.roles)}
          onClick={() => void handleSave()}
          size="sm"
          type="button"
          variant="default"
        >
          {saving ? copy.modal.saving : copy.modal.saveChanges}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
