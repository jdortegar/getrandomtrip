const raw = require('@/data/travellerTypes.json');
const DB: Record<string, any> = raw?.travellerTypes ?? raw; // soporta ambas formas

// Mapeo hacia las claves del "DB" (travellerTypes.json)
const ALIASES: Record<string, string> = {
  // familia / family → families (clave en el JSON)
  familia: 'families', families: 'families', family: 'families',

  // parejas / couple → couples
  parejas: 'couples', pareja: 'couples', couples: 'couples', couple: 'couples',

  // honeymoon → honeymoons
  honeymoon: 'honeymoons', honeymoons: 'honeymoons',

  // grupo → groups
  grupo: 'groups', groups: 'groups', group: 'groups',

  // solo y moment quedan igual
  solo: 'solo', momentos: 'moment', moment: 'moment',
};

export function getTravellerData(type: string) {
  const key = ALIASES[type?.toLowerCase?.()] || type;
  return DB?.[key] ?? null;
}

/**
 * Slugs para prerender de la página dinámica [type].
 * IMPORTANTE: NO incluir los que ya tienen página dedicada
 * (family, honeymoon, group), para evitar colisiones.
 */
export function getAllTravellerSlugs(): string[] {
  return [
    // Parejas
    'parejas', 'pareja', 'couples', 'couple',
    // Solo
    'solo',
    // Momentos
    'momentos', 'moment',
    // Si en el futuro agregas otra página dedicada,
    // retírala también de esta lista.
  ];
}
