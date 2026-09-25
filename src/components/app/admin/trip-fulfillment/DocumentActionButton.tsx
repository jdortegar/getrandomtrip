"use client";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  pending: boolean;
  pendingLabel: string;
}

/** The owner tracks operation/target; unrelated disabled buttons never spin. */
export function DocumentActionButton({
  children,
  disabled,
  pending,
  pendingLabel,
  ...props
}: Props) {
  return (
    <button {...props} aria-busy={pending} disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin h-4 w-4" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
