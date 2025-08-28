import type { LevelSlug } from '@/store/journeyStore';

export const MAX_NIGHTS: Record<LevelSlug, number | 'custom'> = {
  essenza: 2,
  'modo-explora': 3,
  'explora-plus': 4,
  bivouac: 5,
  'atelier-getaway': 'custom',
};

export const getMaxNights = (level: LevelSlug) => MAX_NIGHTS[level];

export function parseBasePrice(displayPrice: string): number {
  const m = displayPrice?.match(/(\d{2,5})/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Valida que la diferencia en noches entre start y end
 * no exceda el máximo permitido por el nivel.
 * Acepta ISO string o Date; devuelve true si es válido.
 */
export function validateNights(
  start?: string | Date,
  end?: string | Date,
  level?: LevelSlug
): boolean {
  if (!start || !end || !level) return true; // si falta info, no bloquea

  const toDateOnly = (d: string | Date) => {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const sd = toDateOnly(start);
  const ed = toDateOnly(end);

  // noches = diferencia de días
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.max(0, Math.round((ed.getTime() - sd.getTime()) / msPerDay));
  const max = getMaxNights(level);

  if (max === 'custom') return true;
  return diff <= max;
}
