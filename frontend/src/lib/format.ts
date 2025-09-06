// frontend/src/lib/format.ts

type CurrencyOpts = {
  locale?: string;                 // mantener fijo para SSR/CSR determinista
  currency?: string;               // USD por defecto, pero extensible
  minimumFractionDigits?: number;  // 0 por defecto
  maximumFractionDigits?: number;  // 0 por defecto
  compact?: boolean;               // para KPIs: 12K, 1.2M, etc.
};

// Caché de formatters para performance (evita recrearlos en cada render)
const fmtCache = new Map<string, Intl.NumberFormat>();

function getFormatter({
  locale = 'en-US',
  currency = 'USD',
  minimumFractionDigits = 0,
  maximumFractionDigits = 0,
  compact = false,
}: CurrencyOpts = {}) {
  const key = [locale, currency, minimumFractionDigits, maximumFractionDigits, compact ? '1' : '0'].join('|');
  let fmt = fmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      notation: compact ? 'compact' : 'standard',
    });
    fmtCache.set(key, fmt);
  }
  return fmt;
}

// Normaliza el input (acepta number | string) y evita NaN/Infinity
function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Formatea cualquier moneda (por defecto USD, en-US, sin centavos) */
export function formatCurrency(
  value: number | string,
  opts?: CurrencyOpts
): string {
  const n = toNumber(value);
  return getFormatter(opts).format(n);
}

/** Atajo: USD estándar (en-US, 0 decimales) */
export function formatUSD(value: number | string): string {
  return formatCurrency(value, { currency: 'USD', locale: 'en-US', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/** USD con centavos (para precios unitarios, subtotales, etc.) */
export function formatUSDWithCents(value: number | string): string {
  return formatCurrency(value, { currency: 'USD', locale: 'en-US', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** USD compacto (KPIs: 12K, 1.2M) */
export function formatUSDCompact(value: number | string): string {
  return formatCurrency(value, { currency: 'USD', locale: 'en-US', compact: true });
}

/** Parseo simple de un string con símbolos a number (ej: "$1,200.50" -> 1200.5) */
export function parseMoney(input: string): number {
  const cleaned = input.replace(/[^0-9.-]+/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
