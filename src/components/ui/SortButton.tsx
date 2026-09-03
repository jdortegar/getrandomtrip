"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortButtonOrder = "asc" | "desc";

export interface SortButtonProps {
  /** Whether this button's column/field is the currently active sort. */
  active: boolean;
  /** Accessible label for the button (localized). */
  ariaLabel: string;
  /**
   * Only meaningful for a sort control outside a real `<table>` (e.g. the
   * tripper page's header strip). Admin `<th>` sortable columns pass
   * `undefined` and rely on the wrapping `<th>`'s `aria-sort` instead —
   * `aria-sort` is only valid on `columnheader`.
   */
  ariaPressed?: boolean;
  /** Visible column/field title (localized). */
  label: string;
  onSort: () => void;
  /** Current sort direction — only rendered as an arrow when `active`. */
  order: SortButtonOrder;
}

/**
 * Shared "title + arrow" sort affordance used by both reviews surfaces (and
 * any future sortable table). Inactive arrow stays visible at
 * `text-neutral-300` rather than opacity-hidden, per the design-system rule
 * against opacity as an off-state.
 */
export function SortButton({
  active,
  ariaLabel,
  ariaPressed,
  label,
  onSort,
  order,
}: SortButtonProps) {
  const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
        active ? "text-ink" : "text-ink hover:text-neutral-700",
      )}
      onClick={onSort}
      type="button"
    >
      {label}
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          active ? "text-secondary" : "text-neutral-300",
        )}
      />
    </button>
  );
}
