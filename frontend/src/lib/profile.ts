// Simple stub hasta conectar backend/DB
export type PublicProfile = {
  handle: string;
  name: string;
  country?: string;
  avatar?: string;
  cover?: string;
  verified?: boolean;
  bio?: string;
  specialties?: string[]; // chips
  metrics: { bookings12m: number; spendUSD: number; reviews: number; favs: number };
  prefs?: { lodging?: string; style?: string[]; dailyBudgetUSD?: number };
  socials?: { ig?: string; yt?: string; web?: string };
  favorites?: Array<{ id: string; title: string; image: string; href: string }>;
  reviews?: Array<{ id: string; title: string; rating: number; excerpt: string; date?: string }>;
  posts?: Array<{ id: string; title: string; excerpt: string; href: string; date?: string }>;
  publicProfile?: boolean;
};

const mock: Record<string, PublicProfile> = {
  "santi.user": {
    handle: "santi.user",
    name: "Santiago Senega",
    country: "México",
    avatar: "https://placehold.co/192x192",
    cover: "/images/covers/northern-lights.jpg",
    verified: true,
    bio: "Viajero frecuente, amante del café y los road trips. Probando nuevas rutas cada mes.",
    specialties: ["Café", "Gastronomía", "Trekking suave"],
    metrics: { bookings12m: 6, spendUSD: 2400, reviews: 12, favs: 8 },
    prefs: { lodging: "Boutique / B&B", style: ["Café", "Gastronomía", "Trekking suave"], dailyBudgetUSD: 150 },
    socials: { ig: "randomtrip.ig", yt: "randomtrip.yt", web: "getrandomtrip.com" },
    favorites: [
      { id: "f1", title: "Aventura en la Patagonia", image: "/images/journey-types/roadtrip-car.jpg", href: "/packages/build/add-ons" },
      { id: "f2", title: "Ruta del Café (CDMX)", image: "/images/journey-types/couple-hetero.jpg", href: "/packages/build/add-ons" }
    ],
    reviews: [
      { id: "r1", title: "Ruta del Café", rating: 5, excerpt: "Excelente curaduría y tiempos." },
      { id: "r2", title: "Escapada al Viñedo", rating: 4, excerpt: "Lugares hermosos." }
    ],
    posts: []
  }
};

export async function getPublicProfileByHandle(handle: string): Promise<PublicProfile | null> {
  // TODO: reemplazar por fetch a API/DB
  return mock[handle] ?? null;
}
