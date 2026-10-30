const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const ONE_DAY_SECONDS = 60 * 60 * 24;

/**
 * Local units per 1 USD, cached for 24h by the Next data cache.
 * Returns null on any failure so callers fall back to USD-only display.
 */
export async function fetchUsdRate(currency: string): Promise<number | null> {
  try {
    const res = await fetch(RATES_URL, {
      next: { revalidate: ONE_DAY_SECONDS },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.result !== "success") return null;
    const rate = data?.rates?.[currency];
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
