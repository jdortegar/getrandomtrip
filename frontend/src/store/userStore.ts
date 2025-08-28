import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserPrefs = {
  travelerType?: 'solo' | 'pareja' | 'familia' | 'amigos' | 'empresa'
  interests: string[] // p.ej. ['playa','montaña','gastronomía','vida-nocturna','cultura','naturaleza']
  dislikes: string[] // p.ej. ['frío','multitudes']
  budget?: 'low' | 'mid' | 'high'
}

type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  createdAt: string
  prefs: UserPrefs
}

interface UserStore {
  isAuthed: boolean
  user: User | null
  authModalOpen: boolean
  authModalStep: 'signin' | 'onboarding' | 'review'
  openAuth: (initialStep?: 'signin' | 'onboarding') => void
  closeAuth: () => void
  signInDemo: (email?: string) => void
  signOut: () => void
  upsertPrefs: (patch: Partial<UserPrefs>) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      isAuthed: false,
      user: null,
      authModalOpen: false,
      authModalStep: 'signin',

      openAuth: (initialStep = 'signin') => set({ authModalOpen: true, authModalStep: initialStep }),
      closeAuth: () => set({ authModalOpen: false }),

      signInDemo: (email?: string) => {
        const newUser: User = {
          id: 'demo-user',
          name: 'Randomtripper',
          email: email || 'demo@randomtrip.com',
          createdAt: new Date().toISOString(),
          prefs: {
            interests: [],
            dislikes: [],
          },
        }
        set({ isAuthed: true, user: newUser, authModalOpen: false })
      },

      signOut: () => set({ isAuthed: false, user: null }),

      upsertPrefs: (patch: Partial<UserPrefs>) => {
        set(state => ({
          user: state.user
            ? {
                ...state.user,
                prefs: {
                  ...state.user.prefs,
                  ...patch,
                },
              }
            : state.user,
        }))
      },
    }),
    {
      name: 'rt-user',
    },
  ),
)
