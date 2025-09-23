import {
  DollarSign,
  MapPin,
  Plane,
  Bed,
  Gift,
  Star,
  Clock,
  Calendar,
  Shield,
  Crown,
} from 'lucide-react';

export interface PackageFeature {
  icon: string;
  label: string;
  value: string;
}

export interface PackageTier {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  priceLabel: string;
  minBudget: number;
  maxBudget: number;
  color: string;
  features: PackageFeature[];
  note: string;
  disclaimer: string;
}

export const PACKAGE_TIERS: PackageTier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    price: 450,
    priceLabel: '450 USD',
    minBudget: 200,
    maxBudget: 500,
    color: 'bg-emerald-500',
    features: [
      { icon: 'MapPin', label: 'Duración', value: 'Máx 2 noches' },
      {
        icon: 'Plane',
        label: 'Transporte',
        value: 'Low cost (buses o vuelos off-peak).',
      },
      {
        icon: 'Calendar',
        label: 'Fechas',
        value: 'Menor disponibilidad, con restricciones y bloqueos.',
      },
      {
        icon: 'Bed',
        label: 'Alojamiento',
        value: 'Midscale (3★ o equivalentes).',
      },
      {
        icon: 'Gift',
        label: 'Extras',
        value: 'Guía esencial para moverte sin complicaciones.',
      },
    ],
    note: 'Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
    disclaimer: '* Selección de asiento, carry-on y bodega no incluidos.',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Activo y flexible',
    price: 650,
    priceLabel: '650 USD',
    minBudget: 500,
    maxBudget: 800,
    color: 'bg-blue-500',
    features: [
      { icon: 'MapPin', label: 'Duración', value: 'Hasta 3 noches' },
      {
        icon: 'Plane',
        label: 'Transporte',
        value: 'Multimodal, horarios flexibles.',
      },
      {
        icon: 'Calendar',
        label: 'Fechas',
        value: 'Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      },
      {
        icon: 'Bed',
        label: 'Alojamiento',
        value: 'Midscale – Upper Midscale.',
      },
      {
        icon: 'Gift',
        label: 'Extras',
        value: 'Guía Randomtrip diseñada para descubrir a tu ritmo.',
      },
    ],
    note: 'Diseñado para quienes viajan livianos y quieren descubrir sin guion.',
    disclaimer: '* Selección de asiento, carry-on y bodega no incluidos.',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos',
    price: 1100,
    priceLabel: '1100 USD',
    minBudget: 800,
    maxBudget: 1300,
    color: 'bg-purple-500',
    features: [
      { icon: 'MapPin', label: 'Duración', value: 'Hasta 4 noches' },
      { icon: 'Plane', label: 'Transporte', value: 'Multimodal.' },
      {
        icon: 'Calendar',
        label: 'Fechas',
        value: 'Alta disponibilidad, incluso en feriados/puentes.',
      },
      { icon: 'Bed', label: 'Alojamiento', value: 'Upscale asegurado.' },
      {
        icon: 'Gift',
        label: 'Extras',
        value: '1 experiencia curada en solitario.',
      },
      {
        icon: 'Star',
        label: 'Destination Decoded',
        value: 'guia personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    note: 'Más noches, más encuentros inesperados y más razones para volver distinto.',
    disclaimer:
      '* Carry-on incluido; selección de asiento y bodega no incluidos.',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría artesanal',
    price: 1550,
    priceLabel: '1550 USD',
    minBudget: 1300,
    maxBudget: 1700,
    color: 'bg-amber-500',
    features: [
      { icon: 'MapPin', label: 'Duración', value: 'Hasta 5 noches' },
      { icon: 'Plane', label: 'Transporte', value: 'Multimodal.' },
      { icon: 'Calendar', label: 'Fechas', value: 'Sin bloqueos.' },
      {
        icon: 'Bed',
        label: 'Alojamiento',
        value: 'Upper Upscale (boutique, diseño, stays con alma).',
      },
      {
        icon: 'Gift',
        label: 'Extras',
        value: 'Concierge Advisor + 1 experiencia premium + perks exclusivos.',
      },
      {
        icon: 'Star',
        label: 'Destination Decoded',
        value:
          'guia curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    note: 'Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.',
    disclaimer: '* Carry-on incluido; selección de asiento/bodega opcional.',
  },
  {
    id: 'atelier',
    name: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo',
    price: 1550,
    priceLabel: 'Desde 1550 USD',
    minBudget: 1700,
    maxBudget: 2000,
    color: 'bg-rose-500',
    features: [
      { icon: 'MapPin', label: 'Duración', value: 'Customizable' },
      { icon: 'Plane', label: 'Transporte', value: 'Multimodal / a medida.' },
      { icon: 'Calendar', label: 'Fechas', value: 'Sin bloqueos.' },
      {
        icon: 'Bed',
        label: 'Alojamiento',
        value: 'Luxury / de autor / Cadenas Hoteleras A1.',
      },
      {
        icon: 'Crown',
        label: 'Extras',
        value:
          'Co-creación con un Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
      },
    ],
    note: 'El lujo de viajar sin testigos, con experiencias que se vuelven confidenciales.',
    disclaimer: '',
  },
];

// Icon mapping for dynamic rendering
export const PACKAGE_ICONS = {
  MapPin,
  Plane,
  Bed,
  Gift,
  Star,
  Clock,
  Calendar,
  Shield,
  Crown,
  DollarSign,
} as const;
