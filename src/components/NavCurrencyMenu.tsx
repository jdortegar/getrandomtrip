"use client";

import { Banknote } from "lucide-react";
import { useDisplayCurrency } from "@/components/providers/CurrencyProvider";
import { useMenuState } from "@/hooks/useMenuState";
import { BASE_CURRENCY } from "@/lib/currency/config";
import { cn } from "@/lib/utils";
import type { DisplayCurrencyMode } from "@/types/core";

/**
 * Desktop display-currency dropdown, styled like the navbar language menu.
 * Renders nothing when there is no local currency (USD visitor, no geo, no rates).
 */
export function NavCurrencyMenu({
  ariaLabel,
  buttonClassName,
}: {
  ariaLabel: string;
  buttonClassName?: string;
}) {
  const { isLocal, local, setMode } = useDisplayCurrency();
  const { close, isOpen, menuRef, toggle } = useMenuState();

  if (!local) return null;

  const options: { code: string; mode: DisplayCurrencyMode }[] = [
    { code: BASE_CURRENCY, mode: "USD" },
    { code: local.currency, mode: "LOCAL" },
  ];
  const current = isLocal ? "LOCAL" : "USD";

  return (
    <div className="relative hidden xl:flex" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={cn("flex items-center gap-2 p-2 rounded-lg", buttonClassName)}
        onClick={toggle}
        type="button"
      >
        <Banknote className="h-5 w-5" />
        <span className="hidden lg:inline text-sm font-medium">
          {isLocal ? local.currency : BASE_CURRENCY}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-40 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-ink"
        >
          {options.map((option) => (
            <button
              key={option.mode}
              role="menuitemradio"
              aria-checked={current === option.mode}
              className={cn(
                "w-full text-left px-4 py-2 text-sm rounded hover:bg-neutral-50",
                current === option.mode && "bg-neutral-100 font-semibold",
              )}
              onClick={() => {
                close();
                if (option.mode !== current) setMode(option.mode);
              }}
            >
              {option.code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
