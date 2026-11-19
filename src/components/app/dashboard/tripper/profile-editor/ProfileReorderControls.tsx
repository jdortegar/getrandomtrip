"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileReorderControlsProps {
  copy: { moveDown: string; moveUp: string; remove: string };
  index: number;
  /** Accessible name of the item, appended to each action label. */
  itemLabel: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  total: number;
}

const BUTTON_CLASS = cn(
  "flex h-11 w-11 items-center justify-center rounded-md text-neutral-500 transition-colors",
  "hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  "disabled:cursor-not-allowed disabled:opacity-30",
);

/** Move earlier / later / remove actions for ordered lists (media items, gallery). */
export function ProfileReorderControls({
  copy,
  index,
  itemLabel,
  onMove,
  onRemove,
  total,
}: ProfileReorderControlsProps) {
  return (
    <div className="flex items-center" data-component="ProfileReorderControls">
      <button
        aria-label={`${copy.moveUp}: ${itemLabel}`}
        className={BUTTON_CLASS}
        disabled={index === 0}
        onClick={() => onMove(-1)}
        type="button"
      >
        <ArrowUp aria-hidden className="h-4 w-4" />
      </button>
      <button
        aria-label={`${copy.moveDown}: ${itemLabel}`}
        className={BUTTON_CLASS}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        type="button"
      >
        <ArrowDown aria-hidden className="h-4 w-4" />
      </button>
      <button
        aria-label={`${copy.remove}: ${itemLabel}`}
        className={BUTTON_CLASS}
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
