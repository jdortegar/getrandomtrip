// src/lib/constants/packages.ts

import { getExcusesByTravelerType } from "@/lib/data/shared/excuses";

const EXCUSE_EN_TITLES: Record<string, string> = {
  // Solo
  "solo-get-lost": "Get Lost",
  "solo-busqueda-interior": "Inner Search",
  "solo-aventura-desafio": "Adventure & Challenge",
  "solo-exploracion-cultural": "Cultural Exploration",
  "solo-fotografia-narrativa-visual": "Photography & Visual Narrative",
  "solo-literatura-arte-talleres": "Literature, Art & Local Workshops",
  "solo-musica-sonidos": "Music & Sounds",
  "solo-tribe-encounters": "Tribe Encounters",
  // Couple
  "escapada-romantica": "Romantic Getaway",
  "duo-aventura": "Adventure Duo",
  "foodie-lovers": "Foodie Lovers",
  "cultura-tradicion": "Culture & Tradition",
  "wellness-retreat": "Wellness Retreat",
  "celebraciones": "Celebrations",
  "playa-dunas": "Beach & Dunes",
  "escapada-urbana": "Urban Escape",
  // Family
  "family-adventure": "Family Adventure",
  // Group
  "group-aventura-familia": "Family Group Adventure",
  "group-naturaleza-fauna": "Nature & Wildlife",
  "group-cultura-tradiciones": "Culture & Traditions",
  "group-playas-dunas": "Beaches & Dunes",
  "group-graduaciones-celebraciones": "Graduations & Celebrations",
  "group-escapada-padres-hijos": "Parent & Child Getaways",
  // Honeymoon
  "honeymoon-luxury": "Luxury Honeymoon",
  // Paws
  "paws-adventure": "Pet Adventure",
};

export function getExcuseOptionsForType(
  type: string | string[],
  locale?: string,
): { value: string; label: string }[] {
  const isEn = locale?.startsWith("en");
  const types = Array.isArray(type) ? type : [type];
  const seen = new Set<string>();
  return types.flatMap((t) =>
    getExcusesByTravelerType(t).map((e) => ({
      value: e.key,
      label: isEn ? (EXCUSE_EN_TITLES[e.key] ?? e.title) : e.title,
    })),
  ).filter((o) => {
    if (seen.has(o.value)) return false;
    seen.add(o.value);
    return true;
  });
}

export const EXPERIENCE_TYPES = [
  { value: "couple", label: "Pareja (BOND©)" },
  { value: "family", label: "Familia (KIN©)" },
  { value: "group", label: "Grupo (CREW©)" },
  { value: "solo", label: "Solo (SOLUM©)" },
  { value: "honeymoon", label: "Luna de Miel (NUPTIA©)" },
  { value: "paws", label: "Con Mascotas (PAWS©)" },
  { value: "XSED", label: "XSED Drop" },
] as const;

const EXPERIENCE_TYPES_EN = [
  { value: "couple", label: "Couple (BOND©)" },
  { value: "family", label: "Family (KIN©)" },
  { value: "group", label: "Group (CREW©)" },
  { value: "solo", label: "Solo (SOLUM©)" },
  { value: "honeymoon", label: "Honeymoon (NUPTIA©)" },
  { value: "paws", label: "With Pets (PAWS©)" },
  { value: "XSED", label: "XSED Drop" },
] as const;

export function getExperienceTypes(locale?: string) {
  return locale?.startsWith("en") ? EXPERIENCE_TYPES_EN : EXPERIENCE_TYPES;
}

export const EXPERIENCE_LEVELS = [
  { value: "essenza", label: "Essenza" },
  { value: "modo-explora", label: "Modo Explora" },
  { value: "explora-plus", label: "Explora+" },
  { value: "bivouac", label: "Bivouac" },
  { value: "atelier-getaway", label: "Atelier Getaway" },
] as const;

export const EXPERIENCE_STATUSES = [
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING_REVIEW", label: "En revisión" },
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "ARCHIVED", label: "Archivado" },
] as const;

export const ACCOMMODATION_TYPES = [
  { value: "any", label: "Indistinto" },
  { value: "hotel-style", label: "Hotel" },
  { value: "home-style", label: "Apartamento / Casa" },
  { value: "nature-escape", label: "Naturaleza" },
  { value: "hybrid-hub", label: "Híbrido" },
  { value: "glamping", label: "Glamping" },
] as const;

export const TRANSPORT_MODES = [
  { value: "any", label: "Indistinto" },
  { value: "plane", label: "Avión" },
  { value: "bus", label: "Bus" },
  { value: "train", label: "Tren" },
  { value: "ship", label: "Barco / Ferry" },
] as const;

export const CLIMATE_OPTIONS = [
  { value: "any", label: "Indistinto" },
  { value: "warm", label: "Cálido" },
  { value: "cold", label: "Frío" },
  { value: "mild", label: "Templado" },
] as const;

export const MAX_TRAVEL_TIME_OPTIONS = [
  { value: "no-limit", label: "Sin límite" },
  { value: "3h", label: "Hasta 3 horas" },
  { value: "5h", label: "Hasta 5 horas" },
  { value: "8h", label: "Hasta 8 horas" },
] as const;

export const TIME_PREFERENCES = [
  { value: "any", label: "Indistinto" },
  { value: "morning", label: "Mañana" },
  { value: "afternoon", label: "Tarde" },
  { value: "night", label: "Noche" },
] as const;

export const MAX_NIGHTS_BY_LEVEL: Record<string, number | null> = {
  essenza: 2,
  "modo-explora": 3,
  "explora-plus": 4,
  bivouac: 5,
  "atelier-getaway": null,
};
