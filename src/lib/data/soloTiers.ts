export interface TierFeature {
  label: string;
  text: string;
  footnote?: string;
}

export interface SoloTier {
  id: string;
  name: string;
  subtitle: string;
  priceLabel: string;
  priceFootnote: string;
  features: TierFeature[];
  closingLine: string;
  ctaLabel: string;
}

export const soloTiers: SoloTier[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    subtitle: 'Lo esencial con estilo',
    priceLabel: 'Hasta 450 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Máx 2 noches' },
      { label: 'Destinos', text: 'Ciudades Nacionales' },
      {
        label: 'Transporte',
        text: 'Low cost (buses o vuelos off-peak).',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Menor disponibilidad, con restricciones y bloqueos.',
      },
      { label: 'Alojamiento', text: 'Midscale (3★ o equivalentes).' },
      {
        label: 'Extras',
        text: 'Guía esencial para moverte sin complicaciones.',
      },
      {
        label: 'Beneficios',
        text: 'No incluye',
      },
    ],
    closingLine:
      'Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
    ctaLabel: 'Arranca tu Essenza →',
  },
  {
    id: 'modo-explora',
    name: 'Modo Explora',
    subtitle: 'Activo y flexible',
    priceLabel: 'Hasta 650 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 3 noches' },
      { label: 'Destinos', text: 'Ciudades Nacionales y Limitrofes' },
      {
        label: 'Transporte',
        text: 'Multimodal, horarios flexibles.',
        footnote: 'Selección de asiento, carry-on y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Mayor disponibilidad; algunos bloqueos en feriados/puentes.',
      },
      { label: 'Alojamiento', text: 'Midscale – Upper Midscale.' },
      {
        label: 'Extras',
        text: 'Guía Randomtrip diseñada para descubrir a tu ritmo.',
      },
      {
        label: 'Beneficios',
        text: 'No incluye',
      },
    ],
    closingLine:
      'Diseñado para quienes viajan livianos y quieren descubrir sin guion.',
    ctaLabel: 'Activa tu Modo Explora →',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    subtitle: 'Más capas, más momentos',
    priceLabel: 'Hasta 1100 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 4 noches' },
      {
        label: 'Destinos',
        text: 'Ciudades Nacionales, Limitrofes y Regionales',
      },
      {
        label: 'Transporte',
        text: 'Multimodal.',
        footnote:
          'Carry-on incluido; selección de asiento y bodega no incluidos.',
      },
      {
        label: 'Fechas',
        text: 'Alta disponibilidad, incluso en feriados/puentes.',
      },
      { label: 'Alojamiento', text: 'Upscale asegurado.' },
      { label: 'Extras', text: '1 experiencia curada en solitario.' },
      {
        label: 'Destination Decoded',
        text: 'Guia personalizada para que cada día sea una sorpresa curada.',
      },
    ],
    closingLine:
      'Más noches, más encuentros inesperados y más razones para volver distinto.',
    ctaLabel: 'Sube de nivel →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    subtitle: 'Curaduría artesanal',
    priceLabel: 'Hasta 1550 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Hasta 5 noches' },
      {
        label: 'Destinos',
        text: 'Todo el continente',
      },
      {
        label: 'Transporte',
        text: 'Multimodal.',
        footnote: 'Carry-on incluido; selección de asiento/bodega opcional.',
      },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Upper Upscale (boutique, diseño, stays con alma).',
      },
      {
        label: 'Extras',
        text: '**Concierge Advisor** + 1 experiencia premium + perks exclusivos.',
      },
      {
        label: 'Destination Decoded',
        text: 'Guia curada por nuestros Concierge Advisors, con claves que pocos conocen.',
      },
    ],
    closingLine:
      'Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.',
    ctaLabel: 'Viaja distinto →',
  },
  {
    id: 'atelier-getaway',
    name: 'Atelier Getaway',
    subtitle: 'Distinción, sin esfuerzo',
    priceLabel: 'Desde 1550 USD',
    priceFootnote: '· por persona',
    features: [
      { label: 'Duración', text: 'Customizable' },
      { label: 'Destinos', text: 'Customizable' },
      { label: 'Transporte', text: 'Multimodal / a medida.' },
      { label: 'Fechas', text: 'Sin bloqueos.' },
      {
        label: 'Alojamiento',
        text: 'Luxury / de autor / Cadenas Hoteleras A1.',
      },
      {
        label: 'Extras',
        text: 'Incluye 2+ experiencias premium diseñadas a medida. Atelier Perks.',
      },
      {
        label: 'Beneficios',
        text: '**Co-creación con un Luxury Travel Advisor + equipo 24/7**.',
      },
    ],
    closingLine:
      'El lujo de viajar sin testigos, con experiencias que se vuelven confidenciales.',
    ctaLabel: 'Crea lo irrepetible →',
  },
];

