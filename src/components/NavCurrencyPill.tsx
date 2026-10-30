"use client";

import { useDisplayCurrency } from "@/components/providers/CurrencyProvider";
import { BASE_CURRENCY } from "@/lib/currency/config";
import { cn } from "@/lib/utils";
import type { DisplayCurrencyMode } from "@/types/core";

/**
 * Mobile drawer display-currency pill, styled like the drawer language pill.
 * Renders nothing when there is no local currency.
 */
export function NavCurrencyPill({ ariaLabel }: { ariaLabel?: string }) {
  const { isLocal, local, setMode } = useDisplayCurrency();
  if (!local) return null;

  const options: { code: string; mode: DisplayCurrencyMode }[] = [
    { code: BASE_CURRENCY, mode: "USD" },
    { code: local.currency, mode: "LOCAL" },
  ];
  const current = isLocal ? "LOCAL" : "USD";

  return (
    <div className="flex h-[38px] min-w-[92px] rounded-full bg-secondary-200 p-1">
      {options.map((option) => (
        <button
          key={option.mode}
          aria-label={ariaLabel}
          aria-pressed={current === option.mode}
          className={cn(
            "cursor-pointer flex-1 font-semibold px-3 rounded-full text-xs uppercase",
            current === option.mode ? "bg-white text-primary" : "text-primary/70",
          )}
          onClick={() => {
            if (option.mode !== current) setMode(option.mode);
          }}
          type="button"
        >
          {option.code}
        </button>
      ))}
    </div>
  );
}
