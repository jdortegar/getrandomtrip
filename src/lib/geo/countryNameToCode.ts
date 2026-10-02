import { AMERICAN_COUNTRIES } from "@/lib/data/shared/countries";

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");

/** Spellings Intl.DisplayNames does not produce but users and Mapbox do. */
const EXTRA_ALIASES: Record<string, string> = {
  "ee uu": "US",
  "ee. uu.": "US",
  eeuu: "US",
  usa: "US",
  "gran bretana": "GB",
  "great britain": "GB",
  england: "GB",
  inglaterra: "GB",
  holanda: "NL",
  "republica checa": "CZ",
  "czech republic": "CZ",
  "costa de marfil": "CI",
  "ivory coast": "CI",
  turquia: "TR",
  turkey: "TR",
};

/** Retired or private-use region codes that Intl still labels (DD is "Germany"). */
const NON_COUNTRY_CODES = new Set([
  "AN", "BU", "CS", "DD", "EU", "EZ", "FX", "NT", "QO", "SU", "TP", "UN", "YD", "YU", "ZR", "ZZ",
]);

let index: Map<string, string> | null = null;

function buildIndex(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (name: string, code: string) => {
    const key = normalize(name);
    if (key && !map.has(key)) map.set(key, code);
  };

  for (const country of AMERICAN_COUNTRIES) {
    add(country.name, country.code);
    country.aliases?.forEach((alias) => add(alias, country.code));
  }

  const names = (["es", "en"] as const).map(
    (locale) => new Intl.DisplayNames([locale], { type: "region" }),
  );
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of letters) {
    for (const b of letters) {
      const code = `${a}${b}`;
      if (NON_COUNTRY_CODES.has(code) || a === "X") continue;
      for (const display of names) {
        let label: string | undefined;
        try {
          label = display.of(code);
        } catch {
          continue;
        }
        // Unassigned codes echo themselves back.
        if (label && label !== code) add(label, code);
      }
    }
  }

  for (const [alias, code] of Object.entries(EXTRA_ALIASES)) add(alias, code);
  return map;
}

/**
 * Maps a free-text country name (es or en, any case/accent) or an ISO alpha-2
 * code to its ISO code. Returns null when the name is unknown.
 */
export function resolveCountryCode(
  name: string | null | undefined,
): string | null {
  if (!name) return null;
  const key = normalize(name);
  if (!key) return null;
  index ??= buildIndex();
  if (/^[a-z]{2}$/.test(key)) {
    const code = key.toUpperCase();
    return [...index.values()].includes(code) ? code : null;
  }
  return index.get(key) ?? null;
}
