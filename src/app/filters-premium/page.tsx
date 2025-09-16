import FiltersPremiumClient from './FiltersPremiumClient';
import ProgressBar from '../../components/ProgressBar';

export const metadata = {
  title: 'Premium Filters',
  description: 'Enhance your trip with premium filters.',
};

export default function FiltersPremiumPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-4 bg-white shadow-md flex justify-between items-center">
        {/* Back button placeholder */}
        <button className="text-[#0A2240] font-semibold">&larr; Back</button>
        <div className="flex-grow mx-4">
          <ProgressBar currentStep={4} totalSteps={4} />
        </div>
      </header>
      <main className="flex-grow">
        <FiltersPremiumClient />
      </main>
    </div>
  );
}
