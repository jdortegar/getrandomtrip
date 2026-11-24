import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TripperProfileSectionHeadingProps {
  aside?: ReactNode;
  eyebrow: string;
  id?: string;
  title: string;
}

/** Eyebrow + editorial heading with an optional right-aligned aside, shared by the public profile sections. */
export function TripperProfileSectionHeading({ aside, eyebrow, id, title }: TripperProfileSectionHeadingProps) {
  return (
    <header
      className={cn("mb-8 flex flex-col gap-4", "md:mb-10 md:flex-row md:items-end md:justify-between")}
      data-component="TripperProfileSectionHeading"
    >
      <div className="max-w-md">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink">{eyebrow}</p>
        <h2 className="mt-3 font-barlow-condensed text-[34px] font-bold leading-[1.05] tracking-[-0.01em] text-ink md:text-[42px]" id={id}>
          {title}
        </h2>
      </div>
      {aside ? <p className="max-w-[16rem] whitespace-pre-line text-neutral-600 md:text-right">{aside}</p> : null}
    </header>
  );
}
