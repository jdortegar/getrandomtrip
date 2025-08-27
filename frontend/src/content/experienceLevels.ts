export type ExperienceLevelId = 'essenza' | 'explora' | 'explora-plus' | 'bivouac' | 'atelier';
export type TravellerSegmentId = 'solo' | 'couples' | 'families' | 'groups' | 'honeymoons' | 'paws';

export interface BaseExperienceLevel {
  id: ExperienceLevelId;
  name: string;
  priceRange: string;
  priceCap: number;
  duration: string;
  transport: string;
  dates: string;
  accommodation: string;
  extras: string;
  baseDescription: string;
  cta: string;
}

export const baseLevels: BaseExperienceLevel[] = [
  {
    id: 'essenza',
    name: 'Essenza',
    priceRange: 'Hasta 350 USD',
    priceCap: 350,
    duration: 'Máx 2 noches.',
    transport: 'Low cost (buses o vuelos off-peak). Selección de asiento, carry-on y bodega no incluidos.',
    dates: 'Menor disponibilidad, con restricciones y bloqueos.',
    accommodation: 'Midscale (3★ o equivalentes).',
    extras: 'Guía esencial con recomendaciones simples.',
    baseDescription: 'Lo básico, pero nunca aburrido: escapadas breves y cuidadas para empezar a perderse sin estrés.',
    cta: 'Reservar fácil →',
  },
  {
    id: 'explora',
    name: 'Modo Explora',
    priceRange: 'Hasta 500 USD',
    priceCap: 500,
    duration: 'Hasta 3 noches.',
    transport: 'Multimodal, horarios flexibles. Selección de asiento, carry-on y bodega no incluidos.',
    dates: 'Mayor disponibilidad; algunos feriados/puentes bloqueados.',
    accommodation: 'Midscale – Upper Midscale.',
    extras: 'Guía “Randomtrip Decode” curada con pistas y actividades.',
    baseDescription: 'Para los que creen que descubrir es un verbo en movimiento.',
    cta: 'Activen su modo Explora →',
  },
  {
    id: 'explora-plus',
    name: 'Explora+',
    priceRange: 'Hasta 850 USD',
    priceCap: 850,
    duration: 'Hasta 4 noches.',
    transport: 'Multimodal. Carry-on incluido; selección de asiento y bodega no incluidos.',
    dates: 'Alta disponibilidad, incluso en feriados/puentes.',
    accommodation: 'Upscale asegurado.',
    extras: 'Decode personalizado + 1 experiencia/actividad curada.',
    baseDescription: 'Más noches, más planes, más excusas para volver con anécdotas que se cuentan dos veces.',
    cta: 'Suban de nivel →',
  },
  {
    id: 'bivouac',
    name: 'Bivouac',
    priceRange: 'Hasta 1200 USD',
    priceCap: 1200,
    duration: 'Hasta 5 noches.',
    transport: 'Multimodal. Carry-on incluido; selección de asiento/bodega opcional.',
    dates: 'Sin bloqueos.',
    accommodation: 'Upper Upscale (boutique, diseño, stays con alma).',
    extras: 'Concierge Advisor + 1 experiencia premium + perks (early/late check-out, upgrades).',
    baseDescription: 'Un viaje cuidado al detalle, como quien arma algo único para pocos.',
    cta: 'Viajen distinto →',
  },
  {
    id: 'atelier',
    name: 'Atelier Getaway',
    priceRange: 'Desde 1200 USD',
    priceCap: 1200, // Base price, as it's customizable
    duration: 'Customizable.',
    transport: 'Multimodal / a medida.',
    dates: 'Sin bloqueos.',
    accommodation: 'Luxury / de autor / cadenas A1.',
    extras: 'Co-creación con Luxury Travel Advisor + equipo 24/7. Incluye 2+ experiencias premium, perks top (traslados privados, salas VIP, reservas prioritarias, amenities exclusivos).',
    baseDescription: 'Un lienzo en blanco para diseñar un viaje irrepetible.',
    cta: 'A un clic de lo extraordinario →',
  },
];

export const microcopyBySegment: Record<TravellerSegmentId, Record<ExperienceLevelId, string>> = {
  solo: {
    essenza: 'Un escape breve para perderte en lo simple y encontrarte en lo inesperado.',
    explora: 'Diseñado para quienes viajan livianos y quieren descubrir a su propio ritmo.',
    'explora-plus': 'Más noches, más encuentros y más razones para volver distinto.',
    bivouac: 'Un viaje cuidado, íntimo y con detalles que hacen que viajar solo nunca se sienta solitario.',
    atelier: 'El lujo de viajar sin testigos, con experiencias que se vuelven confidenciales.',
  },
  couples: {
    essenza: 'Un escape breve, suficiente para mirarse distinto y recordar por qué empezó todo.',
    explora: 'Para los que creen que enamorarse es perderse… y reencontrarse.',
    'explora-plus': 'Más sorpresas, más excusas para coleccionar recuerdos a dos voces.',
    bivouac: 'Un viaje que se cuida como se cuida una relación: con detalle y paciencia.',
    atelier: 'Un lienzo en blanco para crear la luna de miel o escapada que nadie más podrá repetir.',
  },
  families: {
    essenza: 'Lo básico para que todos disfruten sin estrés: un par de días que se contarán en la sobremesa.',
    explora: 'Actividades pensadas para todas las edades, con planes que sorprenden a grandes y chicos.',
    'explora-plus': 'Más días, más juegos, más historias que terminan heredándose.',
    bivouac: 'Un viaje curado con detalle, donde cada miembro de la familia encuentra su lugar.',
    atelier: 'Una experiencia a medida donde la familia entera viaja como protagonista.',
  },
  groups: {
    essenza: 'Una escapada simple para sincronizar agendas y reírse juntos otra vez.',
    explora: 'Planes flexibles que funcionan para distintos ritmos y gustos dentro del grupo.',
    'explora-plus': 'Más noches, más brindis, más anécdotas que se vuelven leyenda compartida.',
    bivouac: 'Un viaje artesanal que convierte a cualquier grupo en una tribu.',
    atelier: 'La experiencia premium que convierte cualquier celebración en inolvidable.',
  },
  honeymoons: {
    essenza: 'Un escape breve, pero suficiente para empezar a escribir el primer capítulo juntos.',
    explora: 'Ideal para descubrir en pareja, sin itinerarios fijos ni spoilers.',
    'explora-plus': 'Más días, más momentos íntimos, más excusas para empezar tradiciones nuevas.',
    bivouac: 'Un viaje premium donde cada detalle está pensado para celebrar el vínculo.',
    atelier: 'Un viaje irrepetible, diseñado como prólogo de una historia que recién comienza.',
  },
  paws: {
    essenza: 'Un escape simple, donde tu mascota no es un extra, sino parte del plan.',
    explora: 'Senderos y rincones pensados para descubrir juntos, con libertad y sin estrés.',
    'explora-plus': 'Más días, más juegos, más huellas en la arena y en la memoria.',
    bivouac: 'Un viaje premium, curado al detalle para vos y tu compañero de cuatro patas.',
    atelier: 'Una experiencia exclusiva donde cada momento está diseñado para ambos.',
  },
};

/**
 * Obtiene los niveles de experiencia para un segmento de viajero específico,
 * aplicando las reglas de negocio de precios y disponibilidad.
 * @param segmentId El tipo de viajero (e.g., 'paws', 'honeymoons').
 * @returns Un array de niveles de experiencia con precios y textos ajustados.
 */
export function getExperienceLevelsForSegment(segmentId: TravellerSegmentId) {
  let levelsToProcess = [...baseLevels];

  // Regla de negocio: Honeymoon solo muestra la tarjeta "Atelier".
  if (segmentId === 'honeymoons') {
    levelsToProcess = levelsToProcess.filter(level => level.id === 'atelier');
  }

  // Regla de negocio: Aplicar recargos de precio.
  const markup =
    segmentId === 'solo' || segmentId === 'paws'
      ? 1.3 // +30%
      : segmentId === 'honeymoons'
      ? 1.5 // +50%
      : 1.0; // Sin recargo para los demás

  return levelsToProcess.map(level => {
    const adjustedPriceCap = Math.round(level.priceCap * markup);
    const pricePrefix = level.id === 'atelier' ? 'Desde' : 'Hasta';
    const adjustedPriceRange = `${pricePrefix} ${adjustedPriceCap.toLocaleString('en-US')} USD`;

    return {
      ...level,
      priceCap: adjustedPriceCap,
      priceRange: `${adjustedPriceRange} · por persona`,
      description: microcopyBySegment[segmentId]?.[level.id] || level.baseDescription,
    };
  });
}
