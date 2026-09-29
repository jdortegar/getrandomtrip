import type { ReactNode } from "react";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface GallerySectionProps {
  children: ReactNode;
  copy: DesignSystemDict["sections"]["foundations"];
  id: string;
  number: string;
}

export function GallerySection({
  children,
  copy,
  id,
  number,
}: GallerySectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="border-gray-200 border-t py-12 scroll-mt-36"
      id={id}
      tabIndex={-1}
    >
      <div className={cn("gap-5 grid mb-8", "md:grid-cols-2 md:items-end")}>
        <div>
          <p className="font-semibold mb-3 text-primary text-xs tracking-widest uppercase">
            {number} / {copy.nav}
          </p>
          <h2
            className="font-barlow-condensed font-extrabold leading-none text-4xl text-ink uppercase"
            id={`${id}-title`}
          >
            {copy.title}
          </h2>
        </div>
        <p className="max-w-xl text-neutral-600">{copy.description}</p>
      </div>
      {children}
    </section>
  );
}
