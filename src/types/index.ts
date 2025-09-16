export interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'REVEALED' | 'CANCELLED';
  userId: string;
  travelType: string;
  experienceLevel: string;
  originCity: string;
  startDate: string;
  travelerCount: number;
  basePrice: number;
  filtersCost: number;
  addonsCost: number;
  totalPrice: number;
  premiumFilters: string[];
  selectedAddons: string[];
  mercadoPagoPreferenceId?: string;
  revealEmailSent: boolean;
  duration_nights?: number;
  destination?: string;
  createdAt: string;
  updatedAt: string;
}