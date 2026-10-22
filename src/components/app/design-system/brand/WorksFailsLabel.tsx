import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorksFailsLabelProps {
  className?: string;
  label: string;
  variant: "fails" | "works";
}

export function WorksFailsLabel({
  className,
  label,
  variant,
}: WorksFailsLabelProps) {
  const isWorks = variant === "works";
  const Icon = isWorks ? Check : X;
  return (
    <span
      className={cn(
        "flex font-semibold gap-1.5 items-center text-[11px] tracking-widest uppercase",
        isWorks ? "text-primary" : "text-red-700",
        className,
      )}
      data-works-fails={variant}
    >
      <Icon aria-hidden className="h-3.5 shrink-0 w-3.5" />
      {label}
    </span>
  );
}
