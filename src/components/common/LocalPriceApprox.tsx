"use client";

import { useDisplayCurrency } from "@/components/providers/CurrencyProvider";
import { cn } from "@/lib/utils";

/**
 * "≈ $539.000 ARS" reference line shown under a USD price. Renders nothing
 * when the visitor has no local currency or the price is 0.
 */
export function LocalPriceApprox({
  className,
  usd,
}: {
  className?: string;
  usd: number;
}) {
  const { formatApprox } = useDisplayCurrency();
  // A free line (e.g. no paid filters) needs no "≈ 0" reference.
  const approx = usd > 0 ? formatApprox(usd) : null;
  if (!approx) return null;
  return (
    <span className={cn("block whitespace-nowrap", className)} data-component="LocalPriceApprox">
      {approx}
    </span>
  );
}
