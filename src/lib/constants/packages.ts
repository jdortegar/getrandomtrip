// src/lib/constants/packages.ts

import { getExcusesByTravelerType } from '@/lib/data/shared/excuses';

export function getExcuseOptionsForType(type: string): { value: string; label: string }[] {
  return getExcusesByTravelerType(type).map((e) => ({ value: e.key, label: e.title }));
}

export const EXPERIENCE_TYPES = [
  { value: 'couple', label: 'Pareja (BOND©)' },
  { value: 'family', label: 'Familia (KIN©)' },
  { value: 'group', label: 'Grupo (CREW©)' },
  { value: 'solo', label: 'Solo (SOLUM©)' },
  { value: 'honeymoon', label: 'Luna de Miel (NUPTIA©)' },
  { value: 'paws', label: 'Con Mascotas (PAWS©)' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'essenza', label: 'Essenza' },
  { value: 'modo-explora', label: 'Modo Explora' },
  { value: 'explora-plus', label: 'Explora+' },
  { value: 'bivouac', label: 'Bivouac' },
  { value: 'atelier-getaway', label: 'Atelier Getaway' },
] as const;

export const EXPERIENCE_STATUSES = [
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

export const MAX_NIGHTS_BY_LEVEL: Record<string, number | null> = {
  'essenza': 2,
  'modo-explora': 3,
  'explora-plus': 4,
  'bivouac': 5,
  'atelier-getaway': null,
};
