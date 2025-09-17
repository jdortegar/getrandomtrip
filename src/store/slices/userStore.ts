import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from 'next-auth';

export type TravelerType = 'solo' | 'pareja' | 'familia' | 'amigos' | 'empresa';
export type BudgetLevel = 'low' | 'mid' | 'high';

export interface UserPrefs {
  travelerType?: TravelerType;
  interests: string[];
  dislikes: string[];
  budget?: BudgetLevel;
  // nuevos opcionales
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

export type UserRole = 'client' | 'tripper' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole; // <-- agregado
  handle?: string; // <-- agregado
  avatar?: string; // <-- agregado
  prefs: UserPrefs;
  socials?: UserSocials; // <-- agregado
  metrics?: UserMetrics; // <-- agregado
}

// En la interfaz del store, agrega estas firmas:
export interface UserStore {
  isAuthed: boolean;
  user: User | null;
  session: Session | null;
  authModalOpen: boolean;
  authModalStep: 'signin' | 'onboarding' | 'review';
  openAuth: (initialStep?: 'signin' | 'onboarding') => void;
  closeAuth: () => void;
  signInDemo: (role: UserRole, email?: string) => void;
  signOut: () => void;
  updateAccount?: (name?: string, email?: string) => void; // <-- NUEVO
  upsertPrefs: (partial: Partial<UserPrefs>) => void; // asegúrate de que existe
  setSession: (sessionData: {
    isAuthed: boolean;
    user: User | null;
    session: Session | null;
    authModalOpen: boolean;
  }) => void; // <-- NUEVO para NextAuth
}

export const createUserSlice: StateCreator<UserStore> = (set, get) => ({
  isAuthed: false,
  user: null,
  session: null,
  authModalOpen: false,
  authModalStep: 'signin',

  openAuth: (initialStep = 'signin') =>
    set({ authModalOpen: true, authModalStep: initialStep }),
  closeAuth: () => set({ authModalOpen: false }),

  signInDemo: (role: UserRole, email?: string) => {
    const newUser: User = {
      id: 'demo-user',
      name: 'Randomtripper',
      email: email || 'demo@randomtrip.com',
      role: role, // Assign the role
      prefs: {
        interests: [],
        dislikes: [],
      },
    };
    set({ isAuthed: true, user: newUser, authModalOpen: false });
  },

  signOut: () => set({ isAuthed: false, user: null, session: null }),

  updateAccount: (name?: string, email?: string) =>
    set((s) => {
      if (!s.user) return {};
      return {
        user: {
          ...s.user,
          name: name ?? s.user.name,
          email: email ?? s.user.email,
        },
      };
    }),

  upsertPrefs: (partial) =>
    set((s) => {
      if (!s.user) return {};
      return {
        user: {
          ...s.user,
          prefs: { ...s.user.prefs, ...partial },
        },
      };
    }),

  setSession: (sessionData) => set(sessionData),
});

// Export the store for backward compatibility
export const useUserStore = create<UserStore>()(
  persist(createUserSlice, {
    name: 'rt-user',
    // Don't persist session data as it should come from NextAuth
    partialize: (state) => ({
      user: state.user,
      isAuthed: state.isAuthed,
      authModalOpen: state.authModalOpen,
      authModalStep: state.authModalStep,
    }),
  }),
);
