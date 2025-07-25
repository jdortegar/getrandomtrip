import ProgressBar from '../../components/ProgressBar';
import PrimaryButton from '../../components/PrimaryButton';
import Link from 'next/link';
import ExplorationClient from './ExplorationClient';

export const metadata = {
  title: 'Exploration - Choose Your Adventure Style',
  description: 'Select how you want to explore your next trip.',
};

export default function ExplorationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-md p-4 flex items-center justify-between">
        <Link href="/">
          <PrimaryButton>Back</PrimaryButton>
        </Link>
        <div className="flex-grow mx-4">
          <ProgressBar currentStep={1} totalSteps={4} />
        </div>
      </header>

      {/* Main Content */}
      <ExplorationClient />

      {/* Footer (Optional, based on wireframe) */}
      <footer className="bg-gray-800 text-white py-4 text-center">
        <p>&copy; 2025 Randomtrip. All rights reserved.</p>
      </footer>
    </div>
  );
}
