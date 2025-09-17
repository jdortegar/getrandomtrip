import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createUserSlice, type UserStore } from './slices/userStore';
import { createJourneySlice, type JourneyState } from './slices/journeyStore';
import { createTripperSlice, type TripperState } from './slices/tripperStore';
import { createJourneyStore, type JourneyStoreState } from './slices/useJourneyStore';
import { createPlannerSlice, type PlannerState } from './slices/planner';

export type RootState = UserStore & JourneyState & TripperState & JourneyStoreState & PlannerState;

export const useStore = create<RootState>()(
  devtools(
    (...args) => ({
      ...createUserSlice(...args),
      ...createJourneySlice(...args),
      ...createTripperSlice(...args),
      ...createJourneyStore(...args),
      ...createPlannerSlice(...args),
    }),
    {
      name: 'getrandomtrip-store',
    }
  )
);
