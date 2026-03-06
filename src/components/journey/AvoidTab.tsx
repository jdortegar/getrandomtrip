'use client';

import { useSearchParams } from 'next/navigation';
import AvoidGrid from './avoid/AvoidGrid';
import StepperNav from './StepperNav';
import SelectedFiltersChips from './SelectedFiltersChips';
import { useStore } from '@/store/store';

export default function AvoidTab() {
  const searchParams = useSearchParams();
  const _tripperPackageDestinations = useStore(
    (s) => s._tripperPackageDestinations,
  );
  const originCity = searchParams.get('originCity') ?? '';
  const originCountry = searchParams.get('originCountry') ?? '';
  const experience = searchParams.get('experience') ?? undefined;

  return (
    <div className="space-y-6">
      <AvoidGrid
        experienceLevel={experience}
        originCity={originCity}
        originCountry={originCountry}
        tripperPackageDestinations={_tripperPackageDestinations}
      />
    </div>
  );
}
