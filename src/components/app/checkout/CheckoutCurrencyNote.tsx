"use client";

import { useDisplayCurrency } from "@/components/providers/CurrencyProvider";
import type { CurrencyDict } from "@/lib/types/dictionary";

/**
 * Permanent "charged in USD" disclaimer shown next to every payment form,
 * whatever display currency is selected. Argentine visitors also get the
 * card taxes note (USD card charges there carry percepciones).
 */
export function CheckoutCurrencyNote({ copy }: { copy: CurrencyDict }) {
  const { local } = useDisplayCurrency();
  return (
    <div className="space-y-1 text-xs text-neutral-500" data-component="CheckoutCurrencyNote">
      <p>{copy.checkoutDisclaimer}</p>
      {local?.currency === "ARS" ? <p>{copy.cardTaxesNote}</p> : null}
    </div>
  );
}
