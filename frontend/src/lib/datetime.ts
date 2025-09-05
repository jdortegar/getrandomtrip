const dfCache = new Map<string, Intl.DateTimeFormat>();
function getDF(locale = 'es-MX', opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  const key = JSON.stringify([locale, opts]);
  let f = dfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    dfCache.set(key, f);
  }
  return f;
}

export function formatDateISO(iso: string, locale = 'es-MX') {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso || '';
  return getDF(locale).format(d);
}
