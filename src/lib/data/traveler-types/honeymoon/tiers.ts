import type { Tier } from '@/types/planner';

// Honeymoon only has one tier - Atelier Getaway (premium luxury)
export const honeymoonTiers: Tier[] = [
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo',
    priceLabel: 'Desde 1800 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Customizable' },
      { label: 'Transporte', text: 'Multimodal / a medida.' },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Luxury / de autor / Cadenas Hoteleras A1.',
      },
      {
        label: 'Extras',
        text: 'Co-creación con un Luxury Travel Advisor + equipo 24/7',
      },
      {
        label: 'Incluye',
        text: '2+ experiencias premium diseñadas para la pareja',
      },
      {
        label: 'Perks',
        text: 'Traslados privados, salas VIP, reservas prioritarias, atenciones exclusivas',
      },
    ],
    closingLine:
      'Un viaje irrepetible, diseñado como prólogo de una historia que recién comienza.',
    ctaLabel: '✨ Crear lo extraordinario →',
  },
];
