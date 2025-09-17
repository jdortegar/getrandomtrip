import { create, StateCreator } from 'zustand';
import {
  TripperRoute,
  Earning,
  RouteStatus,
  TripperLevel,
} from '../../types/tripper';

export interface TripperState {
  routes: TripperRoute[];
  earnings: Earning[];
  // Add other state properties as needed
}

const mockRoutes: TripperRoute[] = [
  {
    id: 'RT001',
    title: 'Aventura en la Patagonia',
    slug: 'aventura-patagonia',
    destinationHints: ['Glaciares', 'Montañas'],
    country: 'Argentina',
    durationNights: 7,
    productLevel: 'pro',
    pricePerPersonCapUSD: 1500,
    status: 'published',
    qaScore: 95,
    nps: 8.8,
    updatedAt: '2024-08-01T10:00:00Z',
    createdAt: '2024-07-15T10:00:00Z',
  },
  {
    id: 'RT002',
    title: 'Ruta del Café',
    slug: 'ruta-cafe',
    destinationHints: ['Plantaciones', 'Cultura'],
    country: 'Colombia',
    durationNights: 5,
    productLevel: 'rookie',
    pricePerPersonCapUSD: 800,
    status: 'draft',
    qaScore: undefined,
    nps: undefined,
    updatedAt: '2024-07-20T14:30:00Z',
    createdAt: '2024-07-01T14:30:00Z',
  },
  {
    id: 'RT003',
    title: 'Exploración Amazónica',
    slug: 'exploracion-amazonica',
    destinationHints: ['Selva', 'Biodiversidad'],
    country: 'Brazil',
    durationNights: 10,
    productLevel: 'elite',
    pricePerPersonCapUSD: 2500,
    status: 'in_review',
    qaScore: undefined,
    nps: undefined,
    updatedAt: '2024-08-10T09:00:00Z',
    createdAt: '2024-08-05T09:00:00Z',
  },
];

const mockEarnings: Earning[] = [
  {
    id: 'E001',
    month: '2024-09',
    bookings: 10,
    baseCommissionUSD: 1000,
    bonusUSD: 200,
    totalUSD: 1200,
    status: 'pending',
    payoutDate: undefined,
  },
  {
    id: 'E002',
    month: '2024-08',
    bookings: 8,
    baseCommissionUSD: 800,
    bonusUSD: 100,
    totalUSD: 900,
    status: 'paid',
    payoutDate: '2024-09-05T10:00:00Z',
  },
  {
    id: 'E003',
    month: '2024-07',
    bookings: 12,
    baseCommissionUSD: 1200,
    bonusUSD: 150,
    totalUSD: 1350,
    status: 'paid',
    payoutDate: '2024-08-05T10:00:00Z',
  },
];

export const createTripperSlice: StateCreator<TripperState> = () => ({
  routes: mockRoutes,
  earnings: mockEarnings,
});
