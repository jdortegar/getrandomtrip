import type { TypePlannerContent } from '@/types/planner';

export const soloPlannerContent: TypePlannerContent = {
  title: 'Diseña tu Randomtrip en solitario',
  subtitle: 'Tres pasos sencillos para una aventura que solo tú podrás contar.',
  levels: [
    {
      id: 'essenza',
      name: 'Essenza',
      subtitle: 'Lo esencial con estilo',
      priceLabel: 'Hasta 300 USD',
      priceFootnote: '· por persona',
      features: [
        { title: 'Duración', description: 'Máx 2 noches' },
        { title: 'Destinos', description: 'Ciudades Nacionales' },
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
      excuses: [
        {
          key: 'solo-adventure',
          title: 'Aventura en Solitario',
          description:
            'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Solitario',
            core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            ctaLabel: 'Aventúrate solo →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras acuáticas.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina pura que te haga sentir vivo.',
                img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
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
      priceLabel: 'Hasta 550 USD',
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
      excuses: [
        {
          key: 'solo-adventure',
          title: 'Aventura en Solitario',
          description:
            'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Solitario',
            core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            ctaLabel: 'Aventúrate solo →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras acuáticas.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina pura que te haga sentir vivo.',
                img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
              },
            ],
          },
        },
        {
          key: 'cultural-immersion',
          title: 'Inmersión Cultural',
          description:
            'Sumergirse en tradiciones, sabores y costumbres locales.',
          img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
          details: {
            title: 'Inmersión Cultural',
            core: 'Sumergirse en tradiciones, sabores y costumbres locales.',
            ctaLabel: 'Sumérgete en la cultura →',
            tint: 'bg-amber-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
            options: [
              {
                key: 'local-traditions',
                label: 'Tradiciones Locales',
                desc: 'Participar en ceremonias y festividades auténticas.',
                img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
              },
              {
                key: 'culinary-tours',
                label: 'Tours Culinarios',
                desc: 'Saborear la gastronomía local con chefs y familias.',
                img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
              },
              {
                key: 'art-galleries',
                label: 'Arte & Galerías',
                desc: 'Explorar el arte local y las expresiones culturales.',
                img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
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
      priceLabel: 'Hasta 1000 USD',
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
      ctaLabel: 'Elegir Modo Lujo →',
      excuses: [
        {
          key: 'solo-adventure',
          title: 'Aventura en Solitario',
          description:
            'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Solitario',
            core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            ctaLabel: 'Aventúrate solo →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras acuáticas.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina pura que te haga sentir vivo.',
                img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
              },
            ],
          },
        },
        {
          key: 'cultural-immersion',
          title: 'Inmersión Cultural',
          description:
            'Sumergirse en tradiciones, sabores y costumbres locales.',
          img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
          details: {
            title: 'Inmersión Cultural',
            core: 'Sumergirse en tradiciones, sabores y costumbres locales.',
            ctaLabel: 'Sumérgete en la cultura →',
            tint: 'bg-amber-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
            options: [
              {
                key: 'local-traditions',
                label: 'Tradiciones Locales',
                desc: 'Participar en ceremonias y festividades auténticas.',
                img: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
              },
              {
                key: 'culinary-tours',
                label: 'Tours Culinarios',
                desc: 'Saborear la gastronomía local con chefs y familias.',
                img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
              },
              {
                key: 'art-galleries',
                label: 'Arte & Galerías',
                desc: 'Explorar el arte local y las expresiones culturales.',
                img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
              },
            ],
          },
        },
        {
          key: 'wellness-retreat',
          title: 'Retiro de Bienestar',
          description:
            'Reconectar contigo mismo en un ambiente de paz y tranquilidad.',
          img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
          details: {
            title: 'Retiro de Bienestar',
            core: 'Reconectar contigo mismo en un ambiente de paz y tranquilidad.',
            ctaLabel: 'Reconecta contigo →',
            tint: 'bg-teal-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
            options: [
              {
                key: 'spa-treatments',
                label: 'Tratamientos de Spa',
                desc: 'Relajación total con masajes y terapias.',
                img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
              },
              {
                key: 'meditation-yoga',
                label: 'Meditación & Yoga',
                desc: 'Encontrar la paz interior y el equilibrio.',
                img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
              },
              {
                key: 'nature-immersion',
                label: 'Inmersión en la Naturaleza',
                desc: 'Conectar con la naturaleza y sus ciclos.',
                img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
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
      excuses: [
        {
          key: 'solo-adventure',
          title: 'Aventura en Solitario',
          description:
            'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Solitario',
            core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            ctaLabel: 'Aventúrate solo →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras acuáticas.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina pura que te haga sentir vivo.',
                img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
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
      excuses: [
        {
          key: 'solo-adventure',
          title: 'Aventura en Solitario',
          description:
            'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Solitario',
            core: 'Descubrir el mundo a tu ritmo, sin compromisos ni horarios.',
            ctaLabel: 'Aventúrate solo →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras acuáticas.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina pura que te haga sentir vivo.',
                img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
              },
            ],
          },
        },
      ],
    },
  ],
};
