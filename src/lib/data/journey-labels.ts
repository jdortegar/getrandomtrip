// Shared label mappings for journey types and levels

export const TRAVELER_TYPE_LABELS: Record<string, string> = {
  couple: 'En Pareja',
  group: 'En Grupo',
  family: 'En Familia',
  solo: 'Solo',
  honeymoon: 'Honeymoon',
  paws: 'Con Mascota',
};

export const LEVEL_LABELS: Record<string, string> = {
  essenza: 'Essenza',
  'modo-explora': 'Modo Explora',
  'explora-plus': 'Explora+',
  bivouac: 'Bivouac',
  atelier: 'Atelier',
};

export function getTravelerTypeLabel(type: string): string {
  return TRAVELER_TYPE_LABELS[type] || type;
}

export function getLevelLabel(level: string): string {
  return LEVEL_LABELS[level] || level;
}
