
export type TripperTier = {
  id: "essenza" | "modo-explora" | "explora-plus" | "bivouac" | "atelier-getaway";
  name: string;
  tagline: string;
  price: string; // string con formato “$1,275 USD”
  bullets: string[]; // 4–6 items (noches, alojamiento, transporte, extras)
  ctaLabel?: string; // Reservar
};

export type VisitedPlace = {
  id: string;              // slug único
  label: string;           // "Villa de Leyva (Boyacá)"
  country: string;         // "Colombia"
  lat: number;
  lng: number;
  lastTripYear?: number;   // 2024
  tripsCount?: number;     // 3
  notes?: string;          // opcional
  url?: string;            // link a post/galería
};

export type TravelSpecialties = {
  interests?: string[];        // p.ej. ["Honeymoons", "Adventure", "Safari", "Family Travel", "Beach & Sun"]
  destinations?: string[];     // p.ej. ["Italy", "Japan", "Kenya", "United States - All"]
  certifications?: string[];   // opcional
  languages?: string[];        // opcional
  partnerBadges?: {            // opcional (logo + alt + url)
    name: string;
    logoUrl: string;
    url?: string;
  }[];
};

export type Tripper = {
  slug: string;              // ej: "ale-ramirez"
  name: string;              // "Alejandra Ramírez"
  title: string;             // "Tripper | Travel Curator"
  location?: string;         // "CDMX, México"
  avatar: string;            // /images/trippers/ale.jpg (con fallback)
  heroImage: string;         // /images/trippers/ale-hero.jpg
  heroVideo?: string;        // /videos/trippers/ale.mp4 (opcional)
  shortBio: string;          // 1-2 líneas
  longBio: string[];         // 2-4 párrafos
  specialties?: TravelSpecialties;
  languages: string[];       // p.ej. ["Español","Inglés","Portugués"]
  destinations: string[];    // p.ej. ["Perú","Chile","Colombia"]
  certifications?: string[]; // p.ej. ["Virtuoso Verified", "IATA", etc.]
  socials?: { instagram?: string; linkedin?: string; tiktok?: string; youtube?: string };
  gallery?: string[];        // imágenes extra
  testimonials?: { author: string; text: string; }[];
  tiers: TripperTier[];      // paquetes disponibles (ver seed abajo)
  placesVisited?: VisitedPlace[];
  metaTitle?: string;        // si no, usar `${name} | Randomtrip`
};
