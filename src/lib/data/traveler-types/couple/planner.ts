import type { TypePlannerContent } from '@/types/planner';

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
      excuses: [
        {
          key: 'romantic-getaway',
          title: 'Escapada Romántica',
          description:
            'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
          img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
          details: {
            title: 'Escapada Romántica',
            core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
            ctaLabel: 'Enciendan la chispa →',
            tint: 'bg-rose-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
            options: [
              {
                key: 'culture-traditions',
                label: 'Cultura Local & Paseos Tranquilos',
                desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
                img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
              },
              {
                key: 'spa-day',
                label: 'Wellness & Spa',
                desc: 'Detox. Retox. Repeat.',
                img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
              },
              {
                key: 'wine-tasting',
                label: 'Experiencias Gastronómicas & Vinos',
                desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
                img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
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
          key: 'romantic-getaway',
          title: 'Escapada Romántica',
          description:
            'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
          img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
          details: {
            title: 'Escapada Romántica',
            core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
            ctaLabel: 'Enciendan la chispa →',
            tint: 'bg-rose-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
            options: [
              {
                key: 'culture-traditions',
                label: 'Cultura Local & Paseos Tranquilos',
                desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
                img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
              },
              {
                key: 'spa-day',
                label: 'Wellness & Spa',
                desc: 'Detox. Retox. Repeat.',
                img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
              },
              {
                key: 'wine-tasting',
                label: 'Experiencias Gastronómicas & Vinos',
                desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
                img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
              },
            ],
          },
        },
        {
          key: 'adventure-couple',
          title: 'Aventura en Pareja',
          description:
            'Descubrir juntos lugares que los desafíen y los unan más.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Pareja',
            core: 'Descubrir juntos lugares que los desafíen y los unan más.',
            ctaLabel: 'Aventúrense juntos →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar juntos hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras que los mantengan a flote.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina compartida que los haga sentir vivos.',
                img: 'https://images.unsplash.com/photo-1551524164-6cf77ac4e879',
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
          key: 'romantic-getaway',
          title: 'Escapada Romántica',
          description:
            'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
          img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
          details: {
            title: 'Escapada Romántica',
            core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
            ctaLabel: 'Enciendan la chispa →',
            tint: 'bg-rose-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
            options: [
              {
                key: 'culture-traditions',
                label: 'Cultura Local & Paseos Tranquilos',
                desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
                img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
              },
              {
                key: 'spa-day',
                label: 'Wellness & Spa',
                desc: 'Detox. Retox. Repeat.',
                img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
              },
              {
                key: 'wine-tasting',
                label: 'Experiencias Gastronómicas & Vinos',
                desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
                img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
              },
            ],
          },
        },
        {
          key: 'adventure-couple',
          title: 'Aventura en Pareja',
          description:
            'Descubrir juntos lugares que los desafíen y los unan más.',
          img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          details: {
            title: 'Aventura en Pareja',
            core: 'Descubrir juntos lugares que los desafíen y los unan más.',
            ctaLabel: 'Aventúrense juntos →',
            tint: 'bg-emerald-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            options: [
              {
                key: 'hiking-trekking',
                label: 'Senderismo & Trekking',
                desc: 'Caminar juntos hacia lugares que solo se alcanzan a pie.',
                img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
              },
              {
                key: 'water-sports',
                label: 'Deportes Acuáticos',
                desc: 'Sumergirse en aventuras que los mantengan a flote.',
                img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
              },
              {
                key: 'extreme-sports',
                label: 'Deportes Extremos',
                desc: 'Adrenalina compartida que los haga sentir vivos.',
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
            ctaLabel: 'Sumérjanse en la cultura →',
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
          key: 'romantic-getaway',
          title: 'Escapada Romántica',
          description:
            'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
          img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
          details: {
            title: 'Escapada Romántica',
            core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
            ctaLabel: 'Enciendan la chispa →',
            tint: 'bg-rose-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
            options: [
              {
                key: 'culture-traditions',
                label: 'Cultura Local & Paseos Tranquilos',
                desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
                img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
              },
              {
                key: 'spa-day',
                label: 'Wellness & Spa',
                desc: 'Detox. Retox. Repeat.',
                img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
              },
              {
                key: 'wine-tasting',
                label: 'Experiencias Gastronómicas & Vinos',
                desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
                img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
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
          key: 'romantic-getaway',
          title: 'Escapada Romántica',
          description:
            'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
          img: 'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
          details: {
            title: 'Escapada Romántica',
            core: 'Un viaje corto, suficiente para apagar el mundo y encenderse mutuamente.',
            ctaLabel: 'Enciendan la chispa →',
            tint: 'bg-rose-900/30',
            heroImg:
              'https://images.unsplash.com/photo-1606082094834-159bce3d6ac4',
            options: [
              {
                key: 'culture-traditions',
                label: 'Cultura Local & Paseos Tranquilos',
                desc: 'Caminar de la mano por lugares que cuentan historias que aún no conocen.',
                img: 'https://images.unsplash.com/photo-1543746379-691bd95dc0b8',
              },
              {
                key: 'spa-day',
                label: 'Wellness & Spa',
                desc: 'Detox. Retox. Repeat.',
                img: 'https://images.unsplash.com/photo-1662106155258-e93468154a1c',
              },
              {
                key: 'wine-tasting',
                label: 'Experiencias Gastronómicas & Vinos',
                desc: 'El amor también se prueba en la mesa: sabores, copas y risas en plural.',
                img: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f',
              },
            ],
          },
        },
      ],
    },
  ],
};
