import type { LocalCurrencyInfo } from "@/types/core";

const SIGNIFICANT_DIGITS = 3;

function narrowSymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

/**
 * Reference amount of a USD price in the visitor's local currency, rounded to
 * 3 significant figures and prefixed with "≈" (it is never the charged amount).
 * "$" currencies append the ISO code so they can't be mistaken for USD
 * ("≈ $539.000 ARS"); others use the localized form ("≈ 340 €").
 */
export function formatLocalApprox(
  usd: number | string,
  local: LocalCurrencyInfo,
  locale: string,
): string {
  const amount = Number(usd) * local.rate;
  if (!Number.isFinite(amount)) return "";

  if (narrowSymbol(local.currency) === "$") {
    const digits = new Intl.NumberFormat(locale, {
      maximumSignificantDigits: SIGNIFICANT_DIGITS,
    }).format(amount);
    return `≈ $${digits} ${local.currency}`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: local.currency,
    currencyDisplay: "narrowSymbol",
    maximumSignificantDigits: SIGNIFICANT_DIGITS,
  }).format(amount);
  return `≈ ${formatted}`;
}
