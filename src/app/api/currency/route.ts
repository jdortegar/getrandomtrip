import { NextResponse } from "next/server";
import { currencyForCountry } from "@/lib/currency/config";
import { countryFromHeaders } from "@/lib/currency/geo";
import { fetchUsdRate } from "@/lib/currency/rates.server";
import { resolveWelcomeCountry } from "@/lib/geo/welcome";
import type { LocalCurrencyInfo } from "@/types/core";

/**
 * Display-only local currency for the visitor: `{ local: { currency, rate } }`
 * or `{ local: null }` when the visitor uses USD, isn't detected, or rates
 * are unavailable. Charges are always USD.
 */
export async function GET(request: Request): Promise<NextResponse> {
  // x-country is absent locally, so ?country=XX stands in for it outside
  // production (same override as the home page welcome toast).
  const country = resolveWelcomeCountry({
    allowOverride: process.env.NODE_ENV !== "production",
    headerCountry: countryFromHeaders(request.headers),
    overrideCountry: new URL(request.url).searchParams.get("country"),
  });
  const currency = currencyForCountry(country);
  const rate = currency ? await fetchUsdRate(currency) : null;
  const local: LocalCurrencyInfo | null =
    currency && rate ? { currency, rate } : null;

  return NextResponse.json(
    { local },
    // Per-visitor (geo) answer: never share it through a CDN cache.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
