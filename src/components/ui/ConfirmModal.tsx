"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export type ConfirmModalTone = "danger" | "neutral";

const TONE_STYLES: Record<
  ConfirmModalTone,
  {
    iconBg: string;
    iconColor: string;
    confirmVariant: "destructive" | "default";
  }
> = {
  danger: {
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    confirmVariant: "destructive",
  },
  neutral: {
    iconBg: "bg-light-blue/10",
    iconColor: "text-light-blue",
    confirmVariant: "default",
  },
};

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  /** Icon shown in the header puck and prefixed on the confirm button. */
  icon: LucideIcon;
  /** "danger" for destructive actions (red), "neutral" for everything else. Defaults to "neutral". */
  tone?: ConfirmModalTone;
  /** Disables the confirm button while the action is in flight. */
  isConfirming?: boolean;
}

/** Reusable confirmation dialog — icon puck, title, description, cancel/confirm actions. Works for deletes, publishes, or any yes/no confirmation. */
export function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  cancelLabel,
  confirmLabel,
  icon: Icon,
  tone = "neutral",
  isConfirming,
}: ConfirmModalProps) {
  const toneStyles = TONE_STYLES[tone];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton
      className="max-w-md"
    >
      <DialogHeader>
        <div
          className={cn(
            "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
            toneStyles.iconBg,
          )}
        >
          <Icon className={cn("h-5 w-5", toneStyles.iconColor)} />
        </div>
        <DialogTitle className="text-2xl font-bold text-gray-900">
          {title}
        </DialogTitle>
        <DialogDescription className="text-sm text-neutral-500">
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-6">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          variant={toneStyles.confirmVariant}
          disabled={isConfirming}
          onClick={onConfirm}
        >
          <Icon className="mr-1 h-4 w-4" />
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
