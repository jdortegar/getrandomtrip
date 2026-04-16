"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormSelectField } from "@/components/ui/FormField";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { AdminUser, UserRole } from "./UsersTableRow";

const ROLE_OPTIONS: UserRole[] = ["CLIENT", "TRIPPER", "ADMIN"];

interface UserRoleModalProps {
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  user: AdminUser;
}

export function UserRoleModal({ onClose, onSaved, open, user }: UserRoleModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRole(user.role);
    setError("");
  }, [user.id, user.role]);

  async function handleSave() {
    if (role === user.role) {
      onClose();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        body: JSON.stringify({ role }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to update role");
      }
    } catch {
      setError("Failed to update role");
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
        <FormSelectField
          id="user-role-select"
          label="Role"
          onChange={(e) => setRole(e.target.value as UserRole)}
          value={role}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </FormSelectField>
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
          Cancel
        </Button>
        <Button
          disabled={saving || role === user.role}
          onClick={() => void handleSave()}
          size="sm"
          type="button"
          variant="default"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
