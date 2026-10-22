import type { ReactNode } from "react";

interface EmailCampaignsSectionHeaderProps {
  /** Primary CTA rendered on the same row, right-aligned. */
  action?: ReactNode;
  eyebrow: string;
  heading: string;
}

export function EmailCampaignsSectionHeader({
  action,
  eyebrow,
  heading,
}: EmailCampaignsSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
          {heading}
        </h2>
      </div>
      {action}
    </div>
  );
}
