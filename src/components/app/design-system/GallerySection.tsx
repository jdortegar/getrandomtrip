import type { ReactNode } from "react";
import { SectionSubtitle } from "@/components/app/design-system/SectionSubtitle";
import type { DesignSystemSectionDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface GallerySectionProps {
  aside?: ReactNode;
  children: ReactNode;
  copy: DesignSystemSectionDict;
  id: string;
  lead?: "end" | "start";
  number: string;
  subtitle?: string;
}

export function GallerySection({
  aside,
  children,
  copy,
  id,
  lead = "end",
  number,
  subtitle,
}: GallerySectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="border-gray-200 border-t py-12 scroll-mt-36"
      id={id}
      tabIndex={-1}
    >
      <div
        className={cn(
          "gap-5 grid mb-8",
          "md:grid-cols-2",
          lead === "start" ? "md:items-start" : "md:items-end",
        )}
      >
        <div>
          <p className="font-semibold mb-3 text-primary text-xs tracking-widest uppercase">
            {number} / {copy.nav}
          </p>
          <h2
            className="font-barlow-condensed font-bold leading-none text-4xl text-ink uppercase"
            id={`${id}-title`}
          >
            {copy.title}
          </h2>
          {subtitle ? <SectionSubtitle>{subtitle}</SectionSubtitle> : null}
        </div>
        <div
          className={cn(
            "flex flex-col gap-4",
            lead === "start" && "md:items-end",
          )}
        >
          <p
            className={cn(
              "max-w-xl text-neutral-600",
              lead === "start" && "md:text-right",
            )}
          >
            {copy.description}
          </p>
          {aside}
        </div>
      </div>
      {children}
    </section>
  );
}
