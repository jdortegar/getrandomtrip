import { StateCreator } from 'zustand';

export interface PlannerState {
  budgetTier: string | null;
  familyType: 'toddlers' | 'teens' | 'adults' | 'multigen' | null;
  escapeType: string | null;
  setBudgetTier: (v: string) => void;
  setFamilyType: (v: PlannerState['familyType']) => void;
  setEscapeType: (v: string) => void;
  reset: () => void;
};

export const createPlannerSlice: StateCreator<PlannerState> = (set) => ({
  budgetTier: null,
  familyType: null,
  escapeType: null,
  setBudgetTier: (v) => set({ budgetTier: v }),
  setFamilyType: (v) => set({ familyType: v }),
  setEscapeType: (v) => set({ escapeType: v }),
  reset: () => set({ budgetTier: null, familyType: null, escapeType: null }),
});