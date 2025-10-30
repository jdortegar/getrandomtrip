import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createUserSlice, type UserStore } from './slices/userStore';
import { createJourneySlice, type JourneyState } from './slices/journeyStore';
import { createTripperSlice, type TripperState } from './slices/tripperStore';
import {
  createJourneyStore,
  type JourneyStoreState,
} from './slices/useJourneyStore';
import { createPlannerSlice, type PlannerState } from './slices/planner';

export type RootState = UserStore &
  JourneyState &
  TripperState &
  JourneyStoreState &
  PlannerState;

export const useStore = create<RootState>()(
  devtools(
    persist(
      (...args) => ({
        ...createUserSlice(...args),
        ...createJourneySlice(...args),
        ...createTripperSlice(...args),
        ...createJourneyStore(...args),
        ...createPlannerSlice(...args),
      }),
      {
        name: 'getrandomtrip-storage',
        partialize: (state) => ({
          // Only persist journey-related data
          from: state.from,
          type: state.type,
          level: state.level,
          displayPrice: state.displayPrice,
          basePriceUsd: state.basePriceUsd,
          tripperId: state.tripperId,
          logistics: state.logistics,
          filters: state.filters,
          addons: state.addons,
          filtersCostUsd: state.filtersCostUsd,
          addonsCostUsd: state.addonsCostUsd,
          totalPerPaxUsd: state.totalPerPaxUsd,
          activeTab: state.activeTab,
          // Persist hidden state for tripper context
          _originLocked: state._originLocked,
          _tripperPackageDestinations: state._tripperPackageDestinations,
        }),
      },
    ),
    {
      name: 'getrandomtrip-store',
    },
  ),
);
