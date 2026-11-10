import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GalleryPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function GalleryPanel({
  children,
  className,
  title,
}: GalleryPanelProps) {
  return (
    <div
      className={cn("bg-white border border-gray-200 p-6 rounded-xl", className)}
    >
      {title ? (
        <h3 className="font-semibold mb-5 text-xl">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
