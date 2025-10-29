import type { TypePlannerContent } from '@/types/planner';

export const honeymoonPlannerContent: TypePlannerContent = {
  title: 'Diseñen su Honeymoon Randomtrip',
  subtitle: 'Tres pasos para comenzar su vida juntos de la mejor manera.',
  levels: [
    {
      id: 'essenza',
      name: 'Essenza',
      subtitle: 'Lo esencial con estilo',
      priceLabel: 'Hasta 350 USD',
      priceFootnote: '· por persona',
      features: [
        {
          title: 'Duración',
          description: 'Máx 2 noches',
        },
        {
          title: 'Destinos',
          description: 'Ciudades Nacionales',
        },
        {
          title: 'Transporte',
          description: 'Low cost (buses o vuelos off-peak).',
          footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
        },
        {
          title: 'Fechas',
          description: 'Menor disponibilidad, con restricciones y bloqueos.',
        },
        {
          title: 'Alojamiento',
          description: 'Midscale (3★ o equivalentes).',
        },
        {
          title: 'Extras',
          description: 'Guía esencial del destino.',
        },
        {
          title: 'Beneficios',
          description: 'No incluye',
        },
      ],
      closingLine: 'Perfecto para una escapada rápida y económica.',
      ctaLabel: 'Elegir Essenza →',
      excuses: [
        {
          key: 'default-excuse',
          title: 'Experiencia Esencial',
          description: 'Lo básico para una experiencia memorable.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Experiencia Esencial',
            core: 'Lo básico para una experiencia memorable.',
            ctaLabel: 'Continuar →',
            tint: 'bg-gray-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'basic-option',
                label: 'Opción Básica',
                desc: 'Experiencia esencial incluida.',
                img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              },
            ],
          },
        },
      ],
    },
    {
      id: 'explora',
      name: 'Modo Explora',
      subtitle: 'Aventura sin límites',
      priceLabel: 'Hasta 650 USD',
      priceFootnote: '· por persona',
      features: [
        {
          title: 'Duración',
          description: 'Hasta 4 noches',
        },
        {
          title: 'Destinos',
          description: 'Nacionales + Regionales',
        },
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
        {
          title: 'Beneficios',
          description: 'Soporte 24/7',
        },
      ],
      closingLine: 'Ideal para explorar más allá de lo obvio.',
      ctaLabel: 'Elegir Modo Explora →',
      excuses: [
        {
          key: 'default-excuse',
          title: 'Experiencia Estándar',
          description: 'Una experiencia completa y bien balanceada.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Experiencia Estándar',
            core: 'Una experiencia completa y bien balanceada.',
            ctaLabel: 'Continuar →',
            tint: 'bg-blue-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'standard-option',
                label: 'Opción Estándar',
                desc: 'Experiencia estándar incluida.',
                img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              },
            ],
          },
        },
      ],
    },
    {
      id: 'exploraPlus',
      name: 'Explora+',
      subtitle: 'Experiencia premium',
      priceLabel: 'Hasta 1200 USD',
      priceFootnote: '· por persona',
      features: [
        {
          title: 'Duración',
          description: 'Hasta 7 noches',
        },
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
        {
          title: 'Alojamiento',
          description: 'Lujo (5★ o equivalentes).',
        },
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
      excuses: [
        {
          key: 'default-excuse',
          title: 'Experiencia Premium',
          description: 'Lo mejor de lo mejor para una experiencia inolvidable.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Experiencia Premium',
            core: 'Lo mejor de lo mejor para una experiencia inolvidable.',
            ctaLabel: 'Continuar →',
            tint: 'bg-purple-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'premium-option',
                label: 'Opción Premium',
                desc: 'Experiencia premium incluida.',
                img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              },
            ],
          },
        },
      ],
    },
    {
      id: 'bivouac',
      name: 'Bivouac',
      subtitle: 'Aventura sin límites',
      priceLabel: 'Hasta 1200 USD',
      priceFootnote: '· por persona',
      features: [
        {
          title: 'Duración',
          description: 'Hasta 5 noches',
        },
        {
          title: 'Destinos',
          description: 'Toda América (sin límites)',
        },
        {
          title: 'Transporte',
          description: 'Multimodal con comodidad priorizada.',
        },
        {
          title: 'Fechas',
          description: 'Sin bloqueos.',
        },
        {
          title: 'Alojamiento',
          description: 'Upper-Upscale.',
        },
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
      excuses: [
        {
          key: 'default-excuse',
          title: 'Experiencia Premium',
          description: 'Lo mejor de lo mejor para una experiencia inolvidable.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Experiencia Premium',
            core: 'Lo mejor de lo mejor para una experiencia inolvidable.',
            ctaLabel: 'Continuar →',
            tint: 'bg-purple-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'premium-option',
                label: 'Opción Premium',
                desc: 'Experiencia premium incluida.',
                img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              },
            ],
          },
        },
      ],
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
        {
          title: 'Destinos',
          description: 'Sin límites geográficos',
        },
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
      excuses: [
        {
          key: 'default-excuse',
          title: 'Experiencia Premium',
          description: 'Lo mejor de lo mejor para una experiencia inolvidable.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Experiencia Premium',
            core: 'Lo mejor de lo mejor para una experiencia inolvidable.',
            ctaLabel: 'Continuar →',
            tint: 'bg-purple-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'premium-option',
                label: 'Opción Premium',
                desc: 'Experiencia premium incluida.',
                img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              },
            ],
          },
        },
      ],
    },
  ],
};
