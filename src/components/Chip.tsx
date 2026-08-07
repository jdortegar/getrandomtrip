"use client";

import { cn } from "@/lib/utils";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "primary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export default function Chip({
  active = false,
  onClick,
  children,
  className = "",
  variant = "default",
  size = "md",
  disabled = false,
}: ChipProps) {
  const baseClasses =
    "inline-flex items-center gap-1 rounded-full text-sm border transition ring-0 focus-visible:ring-0";

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const variantClasses = {
    default: active
      ? "bg-gray-900 text-white border-gray-900"
      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-200",
    outline: active
      ? "bg-primary text-white border-primary shadow-sm"
      : "bg-white text-neutral-700 border-gray-300 hover:bg-neutral-200",
    primary: active
      ? "bg-primary-900 text-white border-primary-900 shadow-sm"
      : "bg-white text-neutral-700 border-gray-300 hover:bg-neutral-200",
  };

  // Disabled chips (read-only display) keep full color contrast — an
  // opacity fade reads as a broken/loading state, not a deliberate
  // off-state, whether the chip is selected or not.
  const disabledClasses = disabled ? "cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        disabledClasses,
        className,
      )}
    >
      {children}
    </button>
  );
}
