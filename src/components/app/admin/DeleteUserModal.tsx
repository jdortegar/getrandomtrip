"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { AdminUser } from "./UsersTableRow";

interface DeleteUserModalProps {
  copy: MarketingDictionary["adminUsers"];
  onClose: () => void;
  onDeleted: () => void;
  open: boolean;
  user: AdminUser;
}

export function DeleteUserModal({
  copy,
  onClose,
  onDeleted,
  open,
  user,
}: DeleteUserModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted();
        onClose();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? copy.modal.deleteError);
      }
    } catch {
      setError(copy.modal.deleteError);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      className="flex max-w-md flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-md"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {copy.modal.delete}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {user.name} · {user.email}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="px-6 py-5">
        <p className="text-sm text-neutral-600">{copy.modal.confirmDelete}</p>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        <Button
          disabled={deleting}
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copy.modal.cancel}
        </Button>
        <Button
          disabled={deleting}
          onClick={() => void handleDelete()}
          size="sm"
          type="button"
          variant="destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {deleting ? copy.modal.deleting : copy.modal.delete}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
