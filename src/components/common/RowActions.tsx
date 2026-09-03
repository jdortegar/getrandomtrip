"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RowActionsProps {
  deleteDisabled?: boolean;
  deleteTitle?: string;
  editActive?: boolean;
  editHref?: string;
  editTitle?: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function RowActions({
  deleteDisabled,
  deleteTitle,
  editActive,
  editHref,
  editTitle,
  onDelete,
  onEdit,
}: RowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {editHref ? (
        <Button
          asChild
          className="h-8 w-8 p-0 text-ink hover:text-ink"
          size="sm"
          title={editTitle}
          variant="ghost"
        >
          <Link href={editHref}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button
          className={
            editActive
              ? "h-8 w-8 p-0 text-ink"
              : "h-8 w-8 p-0 text-ink hover:text-ink"
          }
          onClick={onEdit}
          size="sm"
          title={editTitle}
          variant="ghost"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          className="h-8 w-8 p-0 text-neutral-400 hover:bg-red-50 hover:text-red-600"
          disabled={deleteDisabled}
          onClick={onDelete}
          size="sm"
          title={deleteTitle}
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
