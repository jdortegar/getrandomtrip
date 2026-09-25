import { cn } from "@/lib/utils";

interface ProductBadgeProps {
  value: string;
}

/** For existing category badges only, never navigation or plain product text. */
export function ProductBadge({ value }: ProductBadgeProps) {
  const isXsed = value.toLowerCase() === "xsed";

  return (
    <span
      className={cn(
        "border font-medium inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] whitespace-nowrap",
        isXsed
          ? "bg-xsed border-xsed text-neutral-900"
          : "bg-sky-50 border-sky-200 text-sky-700",
      )}
    >
      {isXsed ? value.toUpperCase() : value}
    </span>
  );
}
