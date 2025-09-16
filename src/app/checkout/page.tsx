import CheckoutClient from './CheckoutClient';
import ProgressBar from '../../components/ProgressBar';

export const metadata = {
  title: 'Review & Pay',
  description: 'Review your trip details and proceed to payment.',
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-4 bg-white shadow-md flex justify-between items-center">
        {/* Back button placeholder */}
        <button className="text-[#0A2240] font-semibold">&larr; Back</button>
        <div className="flex-grow mx-4">
          <ProgressBar currentStep={6} totalSteps={6} /> {/* Assuming 6 steps total for now */}
        </div>
      </header>
      <main className="flex-grow">
        <CheckoutClient />
      </main>
    </div>
  );
}
