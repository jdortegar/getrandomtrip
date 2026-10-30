/**
 * Visitor country from Netlify request headers. Netlify sends `x-country`
 * and a base64 JSON `x-nf-geo` ({ country: { code } }); local dev has none.
 */
export function countryFromHeaders(headers: Headers): string | null {
  const direct = headers.get("x-country");
  if (direct && /^[A-Za-z]{2}$/.test(direct)) return direct.toUpperCase();

  const geo = headers.get("x-nf-geo");
  if (!geo) return null;
  try {
    const parsed = JSON.parse(Buffer.from(geo, "base64").toString("utf8"));
    const code = parsed?.country?.code;
    return typeof code === "string" && /^[A-Za-z]{2}$/.test(code)
      ? code.toUpperCase()
      : null;
  } catch {
    return null;
  }
}
