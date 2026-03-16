import RevealDestinationClient from './RevealDestinationClient';
import ProgressBar from '@/components/ProgressBar';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Suspense } from 'react';

export const metadata = {
  description: 'Discover your surprise Randomtrip destination.',
  title: 'Your Destination Revealed!',
};

export default function RevealDestinationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-4 bg-white shadow-md flex justify-between items-center">
        <button className="text-[#0A2240] font-semibold">&larr; Back</button>
        <div className="flex-grow mx-4">
          <ProgressBar currentStep={7} totalSteps={7} />
        </div>
      </header>
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <RevealDestinationClient />
        </Suspense>
      </main>
    </div>
  );
}
