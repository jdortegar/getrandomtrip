'use client';
import nextDynamic from 'next/dynamic';

const TripperVisitedMap = nextDynamic(
  () => import('@/components/tripper/TripperVisitedMap'),
  {
    loading: () => <div className="h-72 rounded-xl bg-gray-100" />,
    ssr: false,
  },
);

export { TripperVisitedMap };
