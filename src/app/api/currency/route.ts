import { NextResponse } from "next/server";
import { currencyForCountry } from "@/lib/currency/config";
import { countryFromHeaders } from "@/lib/currency/geo";
import { fetchUsdRate } from "@/lib/currency/rates.server";
import type { LocalCurrencyInfo } from "@/types/core";

/**
 * Display-only local currency for the visitor: `{ local: { currency, rate } }`
 * or `{ local: null }` when the visitor uses USD, isn't detected, or rates
 * are unavailable. Charges are always USD.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const currency = currencyForCountry(countryFromHeaders(request.headers));
  const rate = currency ? await fetchUsdRate(currency) : null;
  const local: LocalCurrencyInfo | null =
    currency && rate ? { currency, rate } : null;

  return NextResponse.json(
    { local },
    // Per-visitor (geo) answer: never share it through a CDN cache.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
