"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAnalyticsPreferencesStore } from "@/store/slices/analyticsPreferencesStore";

interface AnalyticsPreferencesLinkProps {
  label: string;
}

export function AnalyticsPreferencesLink({
  label,
}: AnalyticsPreferencesLinkProps) {
  const setOpen = useAnalyticsPreferencesStore((state) => state.setOpen);

  return (
    <Button
      className={cn(
        "border-0 font-normal inline-flex leading-normal min-h-0 normal-case p-0 text-left text-neutral-600 tracking-normal transition-colors",
        "hover:text-primary hover:underline hover:underline-offset-2",
      )}
      onClick={() => setOpen(true)}
      type="button"
      variant="link"
    >
      {label}
    </Button>
  );
}
