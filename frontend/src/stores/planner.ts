
import { create } from 'zustand';

type PlannerState = {
  budgetTier: string | null;
  familyType: string | null;
  escapeType: string | null;
  setBudgetTier: (v: string) => void;
  setFamilyType: (v: string) => void;
  setEscapeType: (v: string) => void;
  reset: () => void;
};

export const usePlannerStore = create<PlannerState>((set) => ({
  budgetTier: null,
  familyType: null,
  escapeType: null,
  setBudgetTier: (v) => set({ budgetTier: v }),
  setFamilyType: (v) => set({ familyType: v }),
  setEscapeType: (v) => set({ escapeType: v }),
  reset: () => set({ budgetTier: null, familyType: null, escapeType: null }),
}));
