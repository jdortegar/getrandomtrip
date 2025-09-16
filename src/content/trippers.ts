export type TierLevel = 'Rookie' | 'Pro' | 'Elite';

export type VisitedPlace = {
  label: string;
  lat: number;
  lng: number;
  lastTrip?: number;
  trips?: number;
};

export type Tripper = {
  name: string;
  slug: string;
  avatar: string;      // para cards
  heroImage?: string;  // foto grande para hero (fallback a avatar)
  ambassadorId?: string; // e.g. "167-2021"
  tierLevel?: TierLevel;

  // sección 2
  videoUrl?: string;   // YouTube/Vimeo embed url (opcional)
  bio?: string;
  interests?: string[];
  destinations?: string[];
  specialties?: {
    interests?: string[];
    destinations?: string[];
    certifications?: string[];
    languages?: string[];
    partnerBadges?: { name: string; logoUrl: string; url?: string }[];
  };

  // sección 3 (opcional)
  gallery?: { src: string; alt: string }[];

  // sección 4
  posts?: { image: string; category: string; title: string; href?: string }[];

  // sección 5
  visitedPlaces?: VisitedPlace[];

  // sección 6
  testimonials?: { author: string; quote: string }[];

  // opcional
  agency?: string;
  location?: string;
};

export const TRIPPERS: Tripper[] = [
  {
    name: 'Alejandra Ramirez',
    slug: 'ale-ramirez',
    avatar: 'https://i.pravatar.cc/256?u=ale-ramirez',
    heroImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    ambassadorId: '167-2021',
    tierLevel: 'Rookie',
    bio: 'Travel advisor enfocada en…',
    interests: ['Family Travel', 'Culinary', 'Soft Adventure'],
    destinations: ['México', 'Perú', 'Italia'],
    posts: [
      { image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff', category: 'Inspiración', title: 'Mi primera sorpresa en la costa' }
    ],
    visitedPlaces: [
      { label: 'Cabo San Lucas, México', lat: 22.8905, lng: -109.9167, lastTrip: 2024, trips: 1 },
      { label: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816, lastTrip: 2009, trips: 1 },
    ],
    testimonials: [
      { author: 'Lucía G.', quote: 'Plan impecable, todo fluyó.' }
    ],
    agency: 'Randomtrip Agency',
    location: 'Mexico City, Mexico',
  },
  {
    name: 'Ilse Seaman',
    slug: 'ilse-seaman',
    avatar: 'https://i.pravatar.cc/256?u=ilse-seaman',
    heroImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    bio: 'Ilse se especializa en viajes familiares, diseñando aventuras que encantan a grandes y chicos, con actividades para todas las edades.',
  },
  {
    name: 'Cinthya Chávez',
    slug: 'cinthya-chavez',
    avatar: 'https://i.pravatar.cc/256?u=cinthya-chavez',
    heroImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    bio: 'Cinthya es la guía perfecta para viajeros solitarios, creando experiencias seguras y enriquecedoras que fomentan el autodescubrimiento.',
  },
  {
    name: 'Horacio Terán',
    slug: 'horacio-teran',
    avatar: 'https://i.pravatar.cc/256?u=horacio-teran',
    heroImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    bio: 'Horacio es un experto en viajes de aventura y exploración, ideal para parejas que buscan emociones fuertes y destinos inusuales.',
  },
  {
    name: 'Sara Sánchez',
    slug: 'sara-sanchez',
    avatar: 'https://i.pravatar.cc/256?u=sara-sanchez',
    heroImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    bio: 'Sara es la especialista en lunas de miel, diseñando viajes inolvidables que combinan romance, lujo y experiencias únicas para recién casados.',
  },
  {
    name: "Lucía Ortega",
    avatar: "https://i.pravatar.cc/200?u=lucia.ortega",
    slug: "lucia-ortega",
    bio: "Curadora de viajes con foco en escapadas cortas y diseño de experiencias sostenibles en destinos de costa."
  },
  {
    name: "Mateo Campos",
    avatar: "https://i.pravatar.cc/200?u=mateo.campos",
    slug: "mateo-campos",
    bio: "Amante de la fotografía documental, recorre rutas poco conocidas y recomienda rincones con alma local."
  },
  {
    name: "Renata Silva",
    avatar: "https://i.pravatar.cc/200?u=renata.silva",
    slug: "renata-silva",
    bio: "Especialista en viajes familiares multi-generación; logística impecable y planes que fluyen."
  },
  {
    name: "Tomas Ibarra",
    avatar: "https://i.pravatar.cc/200?u=tomas.ibarra",
    slug: "tomas-ibarra",
    bio: "Explorador urbano: restaurantes secreto, galerías independientes y barrios en transformación."
  }
];

export function getTripperBySlug(slug: string): Tripper | undefined {
  return TRIPPERS.find(t => t.slug === slug);
}
