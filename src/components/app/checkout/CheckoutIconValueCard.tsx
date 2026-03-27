import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CheckoutIconValueCardProps {
  className?: string;
  icon?: ReactNode;
  title: ReactNode;
  value: ReactNode;
  valueLayout?: "chips" | "default";
}

const cardClassName = cn(
  "bg-white p-4 rounded-xl shadow-sm",
  "ring-1 ring-gray-100",
);

const titleClassName = "font-normal text-gray-500 text-sm";

const valueClassName = "font-medium text-gray-900 text-sm";

export function CheckoutIconValueCard({
  className,
  icon,
  title,
  value,
  valueLayout = "default",
}: CheckoutIconValueCardProps) {
  if (valueLayout === "chips") {
    return (
      <div className={cn(cardClassName, className)}>
        <p className={titleClassName}>{title}</p>
        <div className="mt-2 flex flex-wrap gap-2">{value}</div>
      </div>
    );
  }

  return (
    <div className={cn(cardClassName, className)}>
      <p className={titleClassName}>{title}</p>
      {icon != null ? (
        <div className="mt-1 flex items-start gap-2">
          {icon}
          <div className={valueClassName}>{value}</div>
        </div>
      ) : (
        <div className={cn("mt-1", valueClassName)}>{value}</div>
      )}
    </div>
  );
}
