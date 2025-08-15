// /lib/tone.ts
export const COUNTRY_TONE: Record<string, { prelude: string; replacements: Array<[RegExp, string]> }> = {
  MX: {
    prelude:
      "Usa un tono cercano de México (MX): cálido, directo y práctico. Prefiere expresiones como ‘ánimo’, ‘¿te late?’, ‘está padrísimo’, ‘a la vuelta’, ‘muy rico’ y ‘barrio’. Evita lunfardos rioplatenses.",
    replacements: [[/anímate/gi, 'ánimo'], [/copate/gi, '¿te late?']],
  },
  AR: {
    prelude:
      "Usa un tono cercano de Argentina (AR): rioplatense, amistoso y con guiños locales. Prefiere ‘copate’, ‘a la vuelta de la esquina’, ‘alta data’, ‘che’. Evita mexicanismos.",
    replacements: [[/¿te late\??/gi, 'copate'], [/padrísimo/gi, 'buenísimo']],
  },
  US: {
    prelude: 'Use a warm, concise US English tone. Be natural and friendly. Avoid literal coordinates or reading punctuation names.',
    replacements: [],
  },
};

export function applyCountryStyle(text: string, country?: 'MX' | 'AR' | 'US' | null) {
  if (!country || !COUNTRY_TONE[country]) return text;
  let out = text;
  for (const [re, rep] of COUNTRY_TONE[country].replacements) out = out.replace(re, rep);
  return out;
}