import { create } from "zustand";

interface AnalyticsPreferencesState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// UI visibility only: consent remains in the consent helper, never in this store.
export const useAnalyticsPreferencesStore = create<AnalyticsPreferencesState>(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }),
);
