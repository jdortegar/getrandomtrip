import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldMetaProps {
  /** Character counter; turns red when a (legacy) value is over the limit. */
  count?: { length: number; max: number };
  hint?: ReactNode;
}

/** Helper-text + character-counter row rendered under form fields. */
export function FieldMeta({ count, hint }: FieldMetaProps) {
  if (!hint && !count) return null;
  const isOver = !!count && count.length > count.max;

  return (
    <div
      className="flex items-start justify-between gap-4 text-xs"
      data-component="FieldMeta"
    >
      <div className="min-w-0 space-y-1 text-neutral-500">{hint}</div>
      {count ? (
        <span
          className={cn(
            "shrink-0 tabular-nums",
            isOver ? "font-semibold text-red-700" : "text-neutral-400",
          )}
        >
          {count.length} / {count.max}
        </span>
      ) : null}
    </div>
  );
}
