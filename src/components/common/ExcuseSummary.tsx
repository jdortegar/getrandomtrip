import type { ResolvedExcuseSelection } from "@/lib/helpers/excuse-helper";

interface ExcuseSummaryProps {
  /** Resolved labels; `null` (legacy trips without an excuse) renders nothing. */
  excuse: ResolvedExcuseSelection | null;
  /** Localized "Excuse" label. */
  label: string;
  /** Localized "Details" label shown before the refine-detail chips (full variant). */
  refineLabel?: string;
  /** `inline` is a single caption line for dense rows. */
  variant?: "full" | "inline";
}

export function ExcuseSummary({
  excuse,
  label,
  refineLabel,
  variant = "full",
}: ExcuseSummaryProps) {
  if (!excuse) return null;

  if (variant === "inline") {
    return (
      <p
        className="truncate text-xs text-neutral-500"
        data-component="ExcuseSummary"
      >
        {`${label}: ${excuse.title}`}
      </p>
    );
  }

  return (
    <div className="space-y-1.5" data-component="ExcuseSummary">
      <p>
        {label}: <strong>{excuse.title}</strong>
      </p>
      {excuse.refineDetails.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {refineLabel && <span>{refineLabel}:</span>}
          {excuse.refineDetails.map((detail) => (
            <span
              key={detail.key}
              className="rounded-[6px] border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700"
            >
              {detail.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
