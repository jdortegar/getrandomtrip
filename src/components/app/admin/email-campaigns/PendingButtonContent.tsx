import { Loader2, type LucideIcon } from "lucide-react";

interface PendingButtonContentProps {
  icon?: LucideIcon;
  label: string;
  pending: boolean;
  pendingLabel: string;
}

/** Button body for async actions: spinner + progress label while pending. */
export function PendingButtonContent({
  icon: Icon,
  label,
  pending,
  pendingLabel,
}: PendingButtonContentProps) {
  return (
    <>
      {pending ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon aria-hidden className="h-4 w-4" />
      ) : null}
      {pending ? pendingLabel : label}
    </>
  );
}
