// frontend/src/data/mock-trips.ts
export type TripStatus = 'planned' | 'active' | 'past';

export type Trip = {
  id: string;
  city: string;
  country?: string;
  start: string; // ISO
  end: string;   // ISO
  pax: number;
  cover: string; // URL imagen
  status: TripStatus;
  priceUsd?: number;
  segments?: {
    flight?: number;
    hotel?: number;
    car?: number;
    activities?: number;
    transfers?: number;
    insurance?: number;
  };
};

export const TRIPS: Trip[] = [
  {
    id: 't1',
    city: 'Puerto Vallarta',
    country: 'México',
    start: '2025-11-09',
    end: '2025-11-13',
    pax: 2,
    cover: 'https://images.unsplash.com/photo-1535086181675-4d04a94d2758?q=80&w=1400&auto=format&fit=crop',
    status: 'planned',
    priceUsd: 1553,
    segments: { flight: 2, hotel: 1, transfers: 2, activities: 1, insurance: 2 },
  },
  {
    id: 't2',
    city: 'Oaxaca',
    country: 'México',
    start: '2025-06-05',
    end: '2025-06-10',
    pax: 2,
    cover: 'https://images.unsplash.com/photo-1602881916928-1c6f0d51d2f0?q=80&w=1400&auto=format&fit=crop',
    status: 'active',
    priceUsd: 980,
    segments: { flight: 2, hotel: 1, activities: 2 },
  },
  {
    id: 't3',
    city: 'Utah',
    country: 'Estados Unidos',
    start: '2024-12-24',
    end: '2025-01-01',
    pax: 2,
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop',
    status: 'past',
    priceUsd: 1630,
    segments: { flight: 2, hotel: 1, car: 1 },
  },
];