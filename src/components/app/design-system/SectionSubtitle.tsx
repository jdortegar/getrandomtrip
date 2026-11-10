import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionSubtitleProps {
  children: ReactNode;
  className?: string;
}

export function SectionSubtitle({ children, className }: SectionSubtitleProps) {
  return (
    <p
      className={cn(
        "font-nothing-you-could-do mt-2 text-2xl text-primary",
        className,
      )}
      data-section-lead
    >
      {children}
    </p>
  );
}
