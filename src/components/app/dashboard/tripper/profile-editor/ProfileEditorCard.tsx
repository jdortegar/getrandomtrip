import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileEditorCardProps {
  children: ReactNode;
  className?: string;
  /** Right-aligned meta line (counts, formats, "* essential fields"). */
  meta?: ReactNode;
  title: string;
}

/** White form card used by every profile-editor step. */
export function ProfileEditorCard({ children, className, meta, title }: ProfileEditorCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200",
        "sm:p-6",
        className,
      )}
      data-component="ProfileEditorCard"
    >
      <header className="flex items-start justify-between gap-4">
        <h3 className="font-barlow-condensed text-2xl font-bold leading-tight text-ink">
          {title}
        </h3>
        {meta ? (
          <p className="max-w-[45%] pt-1 text-right text-xs text-neutral-500">{meta}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
