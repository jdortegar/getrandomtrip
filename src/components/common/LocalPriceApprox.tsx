"use client";

import { useDisplayCurrency } from "@/components/providers/CurrencyProvider";
import { cn } from "@/lib/utils";

/**
 * "≈ $539.000 ARS" reference line shown under a USD price. Renders nothing
 * when the visitor has no local currency.
 */
export function LocalPriceApprox({
  className,
  usd,
}: {
  className?: string;
  usd: number;
}) {
  const { formatApprox } = useDisplayCurrency();
  const approx = formatApprox(usd);
  if (!approx) return null;
  return (
    <span className={cn("block whitespace-nowrap", className)} data-component="LocalPriceApprox">
      {approx}
    </span>
  );
}
