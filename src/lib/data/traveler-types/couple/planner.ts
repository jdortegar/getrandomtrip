import type { TypePlannerContent } from '@/types/planner';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const couplePlannerContent: TypePlannerContent = {
  title: 'Diseñen su Randomtrip en pareja',
  subtitle:
    'Tres pasos sencillos para vivir una historia que nadie más podrá contar.',
  levels: [
    {
      id: 'essenza',
      name: 'Essenza',
      subtitle: 'Lo esencial con estilo',
      priceLabel: 'Hasta 350 USD',
      priceFootnote: '· por persona',
      features: [
        { title: 'Duración', description: 'Máx 2 noches' },
        { title: 'Destinos', description: 'Destinos Nacionales' },
        {
          title: 'Transporte',
          description: 'Low cost (buses o vuelos off-peak).',
          footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
        },
        {
          title: 'Fechas',
          description: 'Menor disponibilidad, con restricciones y bloqueos.',
        },
        { title: 'Alojamiento', description: 'Midscale (3★ o equivalentes).' },
        { title: 'Extras', description: 'Guía esencial del destino.' },
        { title: 'Beneficios', description: 'No incluye' },
      ],
      closingLine: 'Perfecto para una escapada rápida y económica.',
      ctaLabel: 'Elegir Essenza →',
      excuses: getExcusesByType('couple'),
    },
    {
      id: 'explora',
      name: 'Modo Explora',
      subtitle: 'Aventura sin límites',
      priceLabel: 'Hasta 650 USD',
      priceFootnote: '· por persona',
      features: [
        { title: 'Duración', description: 'Hasta 4 noches' },
        { title: 'Destinos', description: 'Nacionales + Regionales' },
        {
          title: 'Transporte',
          description: 'Económico con opciones de upgrade.',
        },
        {
          title: 'Fechas',
          description: 'Mayor flexibilidad, algunas restricciones.',
        },
        {
          title: 'Alojamiento',
          description: 'Midscale+ (3-4★ o equivalentes).',
        },
        {
          title: 'Extras',
          description: 'Guía del destino + 1 experiencia incluida.',
        },
        { title: 'Beneficios', description: 'Soporte 24/7' },
      ],
      closingLine: 'Ideal para explorar más allá de lo obvio.',
      ctaLabel: 'Elegir Modo Explora →',
      excuses: getExcusesByType('couple'),
    },
    {
      id: 'exploraPlus',
      name: 'Explora+',
      subtitle: 'Experiencia premium',
      priceLabel: 'Hasta 1200 USD',
      priceFootnote: '· por persona',
      features: [
        { title: 'Duración', description: 'Hasta 7 noches' },
        {
          title: 'Destinos',
          description: 'Internacionales + Nacionales Premium',
        },
        {
          title: 'Transporte',
          description: 'Premium con todas las comodidades.',
        },
        {
          title: 'Fechas',
          description: 'Máxima flexibilidad, sin restricciones.',
        },
        { title: 'Alojamiento', description: 'Lujo (5★ o equivalentes).' },
        {
          title: 'Extras',
          description: 'Guía personalizada + experiencias exclusivas.',
        },
        {
          title: 'Beneficios',
          description: 'Concierge 24/7 + upgrades automáticos',
        },
      ],
      closingLine: 'Para quienes buscan lo mejor de lo mejor.',
      ctaLabel: 'Elegir Explora+ →',
      excuses: getExcusesByType('couple'),
    },
    {
      id: 'bivouac',
      name: 'Bivouac',
      subtitle: 'Aventura sin límites',
      priceLabel: 'Hasta 1200 USD',
      priceFootnote: '· por persona',
      features: [
        { title: 'Duración', description: 'Hasta 5 noches' },
        { title: 'Destinos', description: 'Toda América (sin límites)' },
        {
          title: 'Transporte',
          description: 'Multimodal con comodidad priorizada.',
        },
        { title: 'Fechas', description: 'Sin bloqueos.' },
        { title: 'Alojamiento', description: 'Upper-Upscale.' },
        {
          title: 'Extras',
          description: 'Guía personalizada + experiencias exclusivas.',
        },
        {
          title: 'Beneficios',
          description: 'Concierge 24/7 + upgrades automáticos',
        },
      ],
      closingLine: 'Para quienes buscan lo mejor de lo mejor.',
      ctaLabel: 'Elegir Bivouac →',
      excuses: getExcusesByType('couple'),
    },
    {
      id: 'atelier',
      name: 'Atelier Getaway',
      subtitle: 'Experiencia de lujo',
      priceLabel: 'Hasta 1200 USD',
      priceFootnote: '· por persona',
      features: [
        {
          title: 'Duración',
          description: 'Customizable (5+ noches recomendadas)',
        },
        { title: 'Destinos', description: 'Sin límites geográficos' },
        {
          title: 'Transporte',
          description: 'First class con todas las comodidades.',
        },
        {
          title: 'Fechas',
          description: 'Máxima flexibilidad, sin restricciones.',
        },
        {
          title: 'Alojamiento',
          description: 'Luxury / de autor / cadenas A1.',
        },
        {
          title: 'Extras',
          description: 'Co-creación con Luxury Travel Advisor.',
        },
        {
          title: 'Beneficios',
          description: 'Equipo 24/7 + experiencias premium a medida',
        },
      ],
      closingLine: 'Para quienes buscan lo mejor de lo mejor.',
      ctaLabel: 'Elegir Atelier →',
      excuses: getExcusesByType('couple'),
    },
  ],
};
