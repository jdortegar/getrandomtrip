/**
 * Core Types - Single source of truth for all application types
 * Following DRY principle and SOLID design patterns
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export type ID = string;
export type Timestamp = string; // ISO 8601 format
export type Currency = 'USD' | 'EUR' | 'MXN' | 'ARS' | 'COP' | 'CLP' | 'PEN';

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export type UserRole = 'client' | 'tripper' | 'admin';
export type TravelerType = 'solo' | 'couple' | 'family' | 'group' | 'honeymoon' | 'paws';
export type BudgetLevel = 'low' | 'mid' | 'high';

export interface User {
  id: ID;
  name: string;
  email: string;
  role?: UserRole;
  handle?: string;
  avatar?: string;
  prefs: UserPreferences;
  socials?: UserSocials;
  metrics?: UserMetrics;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPreferences {
  travelerType?: TravelerType;
  interests: string[];
  dislikes: string[];
  budget?: BudgetLevel;
  country?: string;
  verified?: boolean;
  bio?: string;
  publicProfile?: boolean;
}

export interface UserSocials {
  ig?: string;
  yt?: string;
  web?: string;
}

export interface UserMetrics {
  bookings?: number;
  spendUSD?: number;
  reviews?: number;
  favs?: number;
}

// ============================================================================
// JOURNEY & TRAVEL TYPES
// ============================================================================

export type JourneyType =
  | 'couple'
  | 'family'
  | 'group'
  | 'solo'
  | 'honeymoon'
  | 'paws';
export type LevelSlug =
  | 'essenza'
  | 'modo-explora'
  | 'explora-plus'
  | 'bivouac'
  | 'atelier-getaway';
export type TransportMode = 'avion' | 'bus' | 'tren' | 'barco';
export type ClimatePreference = 'indistinto' | 'calido' | 'frio' | 'templado';
export type TimePreference = 'sin-limite' | '3h' | '5h' | '8h';
export type DeparturePreference = 'indistinto' | 'manana' | 'tarde' | 'noche';

export interface Location {
  name: string;
  code?: string;
  placeId?: string;
}

export interface JourneyLogistics {
  country?: Location;
  city?: Location;
  origin?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  nights: number;
  pax: number;
}

export interface JourneyFilters {
  transport: TransportMode;
  climate: ClimatePreference;
  maxTravelTime: TimePreference;
  departPref: DeparturePreference;
  arrivePref: DeparturePreference;
  avoidDestinations: string[];
}

export interface JourneyState {
  from: 'tripper' | '';
  type: JourneyType;
  level: LevelSlug;
  displayPrice: string;
  basePriceUsd: number;
  logistics: JourneyLogistics;
  filters: JourneyFilters;
  addons: AddonsState;
  filtersCostUsd: number;
  addonsCostUsd: number;
  totalPerPaxUsd: number;
  activeTab: 'logistics' | 'preferences' | 'avoid';
}

// ============================================================================
// ADDONS & PRICING TYPES
// ============================================================================

export type AddonUnit = 'per_pax' | 'per_trip' | 'percent_total';
export type AddonCategory =
  | 'Seguridad'
  | 'Vuelo y Equipaje'
  | 'Movilidad'
  | 'Alojamiento'
  | 'Experiencias'
  | 'Conectividad'
  | 'Otros';

export interface AddonSelection {
  id: string;
  qty: number;
}

export interface AddonsState {
  selected: AddonSelection[];
}

export interface Addon {
  id: string;
  category: AddonCategory;
  title: string;
  description: string;
  unit: AddonUnit;
  priceUSD: number;
  options?: AddonOption[];
  maxQty?: number;
  required?: boolean;
}

export interface AddonOption {
  id: string;
  label: string;
  priceModifier?: number; // multiplier or fixed amount
}

// ============================================================================
// TRIPPER TYPES
// ============================================================================

export type TripperLevel = 'rookie' | 'pro' | 'elite';
export type RouteStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type EarningStatus = 'pending' | 'paid' | 'cancelled';

export interface TripperRoute {
  id: ID;
  title: string;
  slug: string;
  destinationHints: string[];
  country: string;
  durationNights: number;
  productLevel: TripperLevel;
  pricePerPersonCapUSD: number;
  status: RouteStatus;
  qaScore?: number;
  nps?: number;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface Earning {
  id: ID;
  month: string; // YYYY-MM format
  bookings: number;
  baseCommissionUSD: number;
  bonusUSD: number;
  totalUSD: number;
  status: EarningStatus;
  payoutDate?: Timestamp;
}

export interface TripperState {
  routes: TripperRoute[];
  earnings: Earning[];
}

// ============================================================================
// BLOG & CONTENT TYPES
// ============================================================================

export interface BlogPost {
  id: ID;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: ID;
  authorName: string;
  authorAvatar?: string;
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  tags: string[];
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// FORM & VALIDATION TYPES
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}
