"use client";

import { Loader2, type LucideIcon } from "lucide-react";
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
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
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
  /** Localized progress label shown while confirming; falls back to confirmLabel. */
  confirmingLabel?: string;
  /** Icon shown in the header puck and prefixed on the confirm button. */
  icon: LucideIcon;
  /** "danger" for destructive actions (red), "neutral" for everything else. Defaults to "neutral". */
  tone?: ConfirmModalTone;
  /** Shows pending feedback and disables action buttons while confirming. */
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
  confirmingLabel,
  icon: Icon,
  tone = "neutral",
  isConfirming = false,
}: ConfirmModalProps) {
  const toneStyles = TONE_STYLES[tone];

  return (
    <Modal
      className="max-w-md"
      data-component="ConfirmModal"
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton={!isConfirming}
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
        <DialogTitle className="text-2xl font-bold text-ink">
          {title}
        </DialogTitle>
        <DialogDescription className="text-sm text-ink">
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-6">
        <Button
          disabled={isConfirming}
          onClick={() => onOpenChange(false)}
          variant="secondary"
        >
          {cancelLabel}
        </Button>
        <Button
          aria-busy={isConfirming}
          disabled={isConfirming}
          onClick={onConfirm}
          variant={toneStyles.confirmVariant}
        >
          {isConfirming ? (
            <Loader2 aria-hidden="true" className="animate-spin h-4 mr-1 w-4" />
          ) : (
            <Icon aria-hidden="true" className="h-4 mr-1 w-4" />
          )}
          {isConfirming ? (confirmingLabel ?? confirmLabel) : confirmLabel}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
