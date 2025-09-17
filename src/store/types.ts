/**
 * Store Types - Following SOLID principles
 * Single Responsibility: Each slice has one clear purpose
 * Open/Closed: Easy to extend without modifying existing code
 * Liskov Substitution: All slices implement the same interface
 * Interface Segregation: Small, focused interfaces
 * Dependency Inversion: Depend on abstractions, not concretions
 */

import type { StateCreator } from 'zustand';
import type {
  User,
  UserPreferences,
  JourneyState,
  JourneyLogistics,
  JourneyFilters,
  AddonsState,
  TripperState,
  TripperRoute,
  Earning,
  BlogPost,
} from '@/types/core';

// ============================================================================
// STORE SLICE INTERFACES (Interface Segregation Principle)
// ============================================================================

export interface UserSlice {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setAuthentication: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  clearUser: () => void;
}

export interface JourneySlice {
  // State
  journey: JourneyState;
  
  // Actions
  setJourney: (journey: Partial<JourneyState>) => void;
  setLogistics: (logistics: Partial<JourneyLogistics>) => void;
  setFilters: (filters: Partial<JourneyFilters>) => void;
  setAddons: (addons: Partial<AddonsState>) => void;
  resetJourney: () => void;
}

export interface TripperSlice {
  // State
  routes: TripperRoute[];
  earnings: Earning[];
  isLoading: boolean;
  
  // Actions
  setRoutes: (routes: TripperRoute[]) => void;
  addRoute: (route: TripperRoute) => void;
  updateRoute: (id: string, updates: Partial<TripperRoute>) => void;
  deleteRoute: (id: string) => void;
  setEarnings: (earnings: Earning[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export interface BlogSlice {
  // State
  posts: BlogPost[];
  currentPost: BlogPost | null;
  isLoading: boolean;
  
  // Actions
  setPosts: (posts: BlogPost[]) => void;
  setCurrentPost: (post: BlogPost | null) => void;
  addPost: (post: BlogPost) => void;
  updatePost: (id: string, updates: Partial<BlogPost>) => void;
  deletePost: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

// ============================================================================
// COMBINED STORE TYPE (Dependency Inversion)
// ============================================================================

export type AppStore = UserSlice & JourneySlice & TripperSlice & BlogSlice;

// ============================================================================
// SLICE CREATOR TYPES (Open/Closed Principle)
// ============================================================================

export type UserSliceCreator = StateCreator<AppStore, [], [], UserSlice>;
export type JourneySliceCreator = StateCreator<AppStore, [], [], JourneySlice>;
export type TripperSliceCreator = StateCreator<AppStore, [], [], TripperSlice>;
export type BlogSliceCreator = StateCreator<AppStore, [], [], BlogSlice>;

// ============================================================================
// SELECTOR TYPES (Single Responsibility)
// ============================================================================

export type UserSelector<T> = (state: UserSlice) => T;
export type JourneySelector<T> = (state: JourneySlice) => T;
export type TripperSelector<T> = (state: TripperSlice) => T;
export type BlogSelector<T> = (state: BlogSlice) => T;

// ============================================================================
// ACTION TYPES (Interface Segregation)
// ============================================================================

export interface UserActions {
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export interface JourneyActions {
  initializeJourney: (type: JourneyState['type']) => void;
  calculatePricing: () => void;
  validateJourney: () => boolean;
}

export interface TripperActions {
  fetchRoutes: () => Promise<void>;
  createRoute: (route: Omit<TripperRoute, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRouteStatus: (id: string, status: TripperRoute['status']) => Promise<void>;
}

export interface BlogActions {
  fetchPosts: () => Promise<void>;
  createPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  publishPost: (id: string) => Promise<void>;
}
