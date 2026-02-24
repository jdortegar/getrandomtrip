import PostPurchaseClient from './PostPurchaseClient';
import ProgressBar from '@/components/ProgressBar';

export const metadata = {
  title: 'Purchase Confirmed',
  description: 'Your Randomtrip purchase is confirmed.',
};

export default function PostPurchasePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full p-4 bg-white shadow-md flex justify-between items-center">
        {/* Back button placeholder */}
        <button className="text-[#0A2240] font-semibold">&larr; Back</button>
        <div className="flex-grow mx-4">
          <ProgressBar currentStep={7} totalSteps={7} /> {/* Assuming 7 steps total for now */}
        </div>
      </header>
      <main className="flex-grow">
        <PostPurchaseClient />
      </main>
    </div>
  );
}
