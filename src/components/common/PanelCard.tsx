import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  children: ReactNode;
  className?: string;
  /** Right-aligned meta line (counts, formats, "* essential fields"). */
  meta?: ReactNode;
  /**
   * Card heading. Omit it when the content brings its own section header
   * (e.g. a shared section component) — the card is then just the shell.
   */
  title?: string;
}

/**
 * The white panel card for dashboard content: design-system panel surface
 * (`shadow-sm ring-gray-200`), a Barlow Condensed heading and an optional
 * right-aligned meta line. Used by the tripper profile editor and the
 * traveler trip-details page.
 */
export function PanelCard({
  children,
  className,
  meta,
  title,
}: PanelCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200",
        "sm:p-6",
        className,
      )}
      data-component="PanelCard"
    >
      {title ? (
        <header className="flex items-start justify-between gap-4">
          <h3 className="font-barlow-condensed text-2xl font-bold leading-tight text-ink">
            {title}
          </h3>
          {meta ? (
            <p className="max-w-[45%] pt-1 text-right text-xs text-neutral-500">
              {meta}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
