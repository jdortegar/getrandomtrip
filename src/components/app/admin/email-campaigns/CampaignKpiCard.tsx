import type { LucideIcon } from "lucide-react";

interface CampaignKpiCardProps {
  /** Caption under the value, e.g. the absolute count behind a rate. */
  hint?: string;
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Design-system KPI stat card: label + sage icon puck, ochre bar + value. */
export function CampaignKpiCard({ hint, icon: Icon, label, value }: CampaignKpiCardProps) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
      data-component="CampaignKpiCard"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          {label}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <Icon aria-hidden className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-stretch gap-3">
        <div className="w-1 shrink-0 self-stretch rounded-full bg-feature" />
        <span className="font-barlow-condensed text-5xl font-extrabold leading-[.9] text-ink">
          {value}
        </span>
      </div>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
