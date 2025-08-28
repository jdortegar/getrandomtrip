export type AvoidSuggestion = { slug: string; name: string; image?: string; badge?: 'Pasaporte'|'Visa' };

export const AVOID_SUGGESTIONS: AvoidSuggestion[] = [
  { slug:'paris', name:'París', image:'/images/destinations/paris.jpg' },
  { slug:'roma', name:'Roma', image:'/images/destinations/roma.jpg' },
  { slug:'londres', name:'Londres', image:'/images/destinations/londres.jpg' },
  { slug:'barcelona', name:'Barcelona', image:'/images/destinations/barcelona.jpg' },
  { slug:'madrid', name:'Madrid', image:'' },
  { slug:'estocolmo', name:'Estocolmo', image:'' },
  { slug:'budapest', name:'Budapest', image:'' },
  { slug:'viena', name:'Viena', image:'' },
  { slug:'praga', name:'Praga', image:'' },
  { slug:'atenas', name:'Atenas', image:'' },
  { slug:'zurich', name:'Zúrich', image:'' },
  { slug:'amsterdam', name:'Ámsterdam', image:'' },
  { slug:'venecia', name:'Venecia', image:'' },
  { slug:'lisboa', name:'Lisboa', image:'' },
  { slug:'dublin', name:'Dublín', image:'' },
  { slug:'newyork', name:'Nueva York', image:'' },
  { slug:'tokyo', name:'Tokio', image:'' },
  { slug:'sydney', name:'Sídney', image:'' },
  { slug:'rio', name:'Río de Janeiro', image:'' },
  { slug:'cairo', name:'El Cairo', image:'' },
];