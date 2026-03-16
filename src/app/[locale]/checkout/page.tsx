import Link from 'next/link';
import CheckoutClient from './CheckoutClient';
import ProgressBar from '@/components/ProgressBar';

export const metadata = {
  description: 'Review your trip details and proceed to payment.',
  title: 'Review & Pay',
};

interface CheckoutPageProps {
  params: { locale: string };
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const locale = params.locale ?? 'es';
  const localeSegment = locale ? `/${locale}` : '';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex w-full items-center justify-between bg-white p-4 shadow-md">
        <Link
          className="font-semibold text-[#0A2240] hover:underline"
          href={`${localeSegment}/journey`}
        >
          ← Back
        </Link>
        <div className="mx-4 flex-grow">
          <ProgressBar currentStep={6} totalSteps={6} />
        </div>
      </header>
      <main className="flex-grow">
        <CheckoutClient locale={locale} />
      </main>
    </div>
  );
}
