const raw = require('@/data/travellerTypes.json');
const DB: Record<string, any> = raw?.travellerTypes ?? raw; // soporta ambas formas

const ALIASES: Record<string,string> = {
  familia: 'families', parejas: 'couples', pareja: 'couples',
  honeymoon: 'honeymoons', solo: 'solo', momentos: 'moment',
  grupo: 'groups',
  families: 'families', family: 'families',
  couples: 'couples', couple: 'couples',
  honeymoons: 'honeymoons', moment: 'moment',
  groups: 'groups', group: 'groups',
};

export function getTravellerData(type: string) {
  const key = ALIASES[type?.toLowerCase?.()] || type;
  return DB?.[key] ?? null;
}

export function getAllTravellerSlugs(): string[] {
  return [
    'familia','families','family',
    'parejas','pareja','couples','couple',
    'honeymoon','honeymoons',
    'solo',
    'momentos','moment',
    'grupo','groups','group',
  ];
}