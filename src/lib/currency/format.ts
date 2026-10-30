import type { LocalCurrencyInfo } from "@/types/core";
import { formatCurrency } from "@/lib/format";

/**
 * Reference amount of a USD price in the visitor's local currency, rounded to
 * whole units and prefixed with "≈" (it is never the charged amount).
 * Uses the ISO code ("ARS"), not "$", so it can't be mistaken for USD.
 */
export function formatLocalApprox(
  usd: number | string,
  local: LocalCurrencyInfo,
  locale: string,
): string {
  const amount = Number(usd) * local.rate;
  const formatted = formatCurrency(amount, {
    currency: local.currency,
    locale,
  });
  return `≈ ${formatted}`;
}

/**
 * Rewrites every "USD <amount>" mention in copy (e.g. "2-3 filters: USD 18
 * each.") through `convert`; amounts stay USD in the dictionary.
 */
export function replaceUsdAmounts(
  text: string,
  convert: (usd: number) => string,
): string {
  return text.replace(/USD\s?(\d+(?:[.,]\d+)?)/g, (_match, amount: string) =>
    convert(Number(amount.replace(",", "."))),
  );
}
