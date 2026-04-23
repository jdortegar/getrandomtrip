// src/lib/constants/packages.ts

export const PACKAGE_TYPES = [
  { value: 'couple', label: 'Pareja (BOND©)' },
  { value: 'family', label: 'Familia (KIN©)' },
  { value: 'group', label: 'Grupo (CREW©)' },
  { value: 'solo', label: 'Solo (SOLUM©)' },
  { value: 'honeymoon', label: 'Luna de Miel (NUPTIA©)' },
  { value: 'paws', label: 'Con Mascotas (PAWS©)' },
] as const;

export const PACKAGE_LEVELS = [
  { value: 'essenza', label: 'Essenza' },
  { value: 'modo-explora', label: 'Modo Explora' },
  { value: 'explora-plus', label: 'Explora+' },
  { value: 'bivouac', label: 'Bivouac' },
  { value: 'atelier-getaway', label: 'Atelier Getaway' },
] as const;

export const PACKAGE_STATUSES = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'ARCHIVED', label: 'Archivado' },
] as const;

export const ACCOMMODATION_TYPES = [
  { value: 'any', label: 'Indistinto' },
  { value: 'hotel-style', label: 'Hotel' },
  { value: 'home-style', label: 'Apartamento / Casa' },
  { value: 'nature-escape', label: 'Naturaleza' },
  { value: 'hybrid-hub', label: 'Híbrido' },
  { value: 'glamping', label: 'Glamping' },
] as const;

export const TRANSPORT_MODES = [
  { value: 'any', label: 'Indistinto' },
  { value: 'plane', label: 'Avión' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Tren' },
  { value: 'ship', label: 'Barco / Ferry' },
] as const;

export const CLIMATE_OPTIONS = [
  { value: 'any', label: 'Indistinto' },
  { value: 'warm', label: 'Cálido' },
  { value: 'cold', label: 'Frío' },
  { value: 'mild', label: 'Templado' },
] as const;

export const MAX_TRAVEL_TIME_OPTIONS = [
  { value: 'no-limit', label: 'Sin límite' },
  { value: '3h', label: 'Hasta 3 horas' },
  { value: '5h', label: 'Hasta 5 horas' },
  { value: '8h', label: 'Hasta 8 horas' },
] as const;

export const TIME_PREFERENCES = [
  { value: 'any', label: 'Indistinto' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
] as const;

export const EXCUSE_KEYS_BY_TYPE: Record<string, string[]> = {
  couple: [
    'Escapada Romántica',
    'Dúo de Aventura',
    'Foodie Lovers',
    'Cultura & Tradición',
    'Wellness Retreat',
    'Celebraciones',
    'Playa & Dunas',
    'Escapada Urbana',
  ],
  solo: [
    'Get Lost',
    'Búsqueda Interior',
    'Aventura & Desafío',
    'Exploración Cultural',
    'Fotografía & Narrativa Visual',
    'Literatura Arte & Talleres Locales',
    'Música & Sonidos',
    'Tribe Encounters',
  ],
  family: [
    'Aventura en familia',
    'Naturaleza & fauna',
    'Cultura & tradiciones',
    'Playas & dunas',
    'Graduaciones & celebraciones',
    'Escapadas Madre-hij@ / Padre-hij@',
  ],
  honeymoon: [],
  paws: [
    'Senderos & Naturaleza',
    'Playas Dog-Friendly',
    'Ciudades Pet Lovers',
    'Aventura Outdoor',
    'Relax & Bienestar',
    'Escapadas Gastronómicas',
    'Trips Rurales & Granja',
    'Dog Events & Comunidades',
  ],
  group: [
    'Narradores Visuales',
    'Yoga & Bienestar',
    'Religioso o Espiritual',
    'Gastronómico',
    'Historias & Fantasía',
    'Naturaleza & Aventura',
    'Amigos',
    'Negocios',
    'Estudiantes',
    'Música & Festivales',
  ],
};

export const MAX_NIGHTS_BY_LEVEL: Record<string, number | null> = {
  'essenza': 2,
  'modo-explora': 3,
  'explora-plus': 4,
  'bivouac': 5,
  'atelier-getaway': null,
};
