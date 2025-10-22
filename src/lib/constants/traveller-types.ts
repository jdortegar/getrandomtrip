// ============================================================================
// Traveller Type Constants
// ============================================================================

export interface TravellerTypeOption {
  key: string;
  title: string;
  subtitle: string;
  img: string;
}

export const TRAVELLER_TYPE_OPTIONS: TravellerTypeOption[] = [
  {
    key: 'solo',
    title: 'Solo',
    subtitle: 'Descubre el mundo a tu ritmo',
    img: '/images/journey-types/solo-traveler.jpg',
  },
  {
    key: 'pareja',
    title: 'En Pareja',
    subtitle: 'Creen recuerdos juntos',
    img: '/images/journey-types/couple-hetero.jpg',
  },
  {
    key: 'familia',
    title: 'En Familia',
    subtitle: 'Aventuras para todos',
    img: '/images/journey-types/family-vacation.jpg',
  },
  {
    key: 'grupo',
    title: 'En Grupo',
    subtitle: 'Experiencias compartidas',
    img: '/images/journey-types/friends-group.jpg',
  },
  {
    key: 'honeymoon',
    title: 'Honeymoon',
    subtitle: 'El comienzo perfecto',
    img: '/images/journey-types/honeymoon-same-sex.jpg',
  },
];

export const TRAVELLER_TYPE_MAP: Record<string, string> = {
  solo: 'solo',
  pareja: 'couple',
  familia: 'family',
  grupo: 'group',
  honeymoon: 'honeymoon',
};

// ============================================================================
// Tier Badge Helpers
// ============================================================================

export interface BadgeConfig {
  label: string;
  color: string;
}

export const TIER_BADGES: Record<string, BadgeConfig> = {
  essenza: { label: 'Essenza', color: 'bg-amber-500' },
  'modo-explora': { label: 'Modo Explora', color: 'bg-blue-500' },
  'explora-plus': { label: 'Explora Plus', color: 'bg-purple-500' },
  bivouac: { label: 'Bivouac', color: 'bg-green-500' },
  'atelier-getaway': { label: 'Atelier Getaway', color: 'bg-rose-500' },
};

export const TYPE_LABELS: Record<string, string> = {
  solo: 'Solo',
  couple: 'En Pareja',
  pareja: 'En Pareja',
  family: 'Familia',
  familia: 'Familia',
  group: 'Grupo',
  grupo: 'Grupo',
  honeymoon: 'Luna de Miel',
  paws: 'Con Mascotas',
};

/**
 * Get tier badge configuration
 */
export function getTierBadge(level: string): BadgeConfig {
  return TIER_BADGES[level] || { label: level, color: 'bg-gray-500' };
}

/**
 * Get traveller type label
 */
export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}
