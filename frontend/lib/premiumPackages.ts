export interface PremiumPackage {
  id: string;
  title: string;
  tagline: string;
  budget: number; // Assuming a single budget value for simplicity, can be min/max object if needed
  budgetType: 'Desde' | 'Hasta';
  maxNights: number;
  accommodation: string;
  transportation: string;
  keyExtras: string[];
  archetype: string;
  channels: string[];
  ctaText: string;
}

export const premiumPackages: PremiumPackage[] = [
  {
    id: 'essenza',
    title: 'Essenza',
    tagline: 'La esencia de un viaje inolvidable.',
    budget: 1500,
    budgetType: 'Desde',
    maxNights: 7,
    accommodation: 'Hoteles boutique',
    transportation: 'Vuelos comerciales',
    keyExtras: ['Experiencias gastronómicas', 'Tours privados'],
    archetype: 'Parejas',
    channels: ['Online', 'Agencia'],
    ctaText: 'Reservá fácil',
  },
  {
    id: 'modo-explora',
    title: 'Modo Explora',
    tagline: 'Activa tu espíritu aventurero.',
    budget: 2000,
    budgetType: 'Desde',
    maxNights: 10,
    accommodation: 'Glamping',
    transportation: 'Alquiler de 4x4',
    keyExtras: ['Actividades al aire libre', 'Guía local'],
    archetype: 'Aventureros',
    channels: ['Online'],
    ctaText: 'Activá tu modo',
  },
  {
    id: 'explora-plus',
    title: 'Explora+',
    tagline: 'Sube de nivel tu experiencia de viaje.',
    budget: 3000,
    budgetType: 'Desde',
    maxNights: 14,
    accommodation: 'Villas de lujo',
    transportation: 'Vuelos privados',
    keyExtras: ['Chef personal', 'Acceso VIP'],
    archetype: 'Lujo',
    channels: ['Agencia'],
    ctaText: 'Subí de nivel',
  },
  {
    id: 'bivouac',
    title: 'Bivouac',
    tagline: 'Viaja distinto, vive la naturaleza.',
    budget: 1200,
    budgetType: 'Desde',
    maxNights: 5,
    accommodation: 'Cabañas rústicas',
    transportation: 'Transporte terrestre',
    keyExtras: ['Senderismo', 'Observación de fauna'],
    archetype: 'Naturaleza',
    channels: ['Online'],
    ctaText: 'Viajá distinto',
  },
  {
    id: 'atelier-getaway',
    title: 'Atelier Getaway',
    tagline: 'Curado para vos, una experiencia única.',
    budget: 2500,
    budgetType: 'Desde',
    maxNights: 8,
    accommodation: 'Hoteles con encanto',
    transportation: 'Vuelos comerciales',
    keyExtras: ['Talleres creativos', 'Experiencias culturales'],
    archetype: 'Creativos',
    channels: ['Online', 'Agencia'],
    ctaText: 'Curado para vos',
  },
  {
    id: 'custom-roadtrip',
    title: 'Roadtrip Personalizado',
    tagline: 'Tu aventura, a tu manera.',
    budget: 0, // This will be dynamic
    budgetType: 'Desde',
    maxNights: 0, // This will be dynamic
    accommodation: 'Varía según tu elección',
    transportation: 'Vehículo propio o de alquiler',
    keyExtras: ['Flexibilidad total'],
    archetype: 'Explorador',
    channels: ['Online'],
    ctaText: 'Configurar Add-ons',
  },
];