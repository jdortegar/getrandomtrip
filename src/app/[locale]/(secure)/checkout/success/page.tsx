import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CheckoutResultSuccess from '../CheckoutResultSuccess';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    return { title: 'Confirmation' };
  }
  const dict = await getDictionary(params.locale);
  return {
    description: dict.confirmation.page.metaDescription,
    title: dict.confirmation.page.title,
  };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!hasLocale(params.locale)) {
    notFound();
  }

  const dict = await getDictionary(params.locale);

  // Parse Stripe 3DS redirect params from the URL
  const raw = (key: string) => {
    const v = searchParams[key];
    return typeof v === 'string' ? v : (Array.isArray(v) ? v[0] : null) ?? null;
  };
  const stripeReturn = {
    paymentIntent: raw('payment_intent'),
    redirectStatus: raw('redirect_status'),
  };

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      }
    >
      <CheckoutResultSuccess
        hero={dict.confirmation.hero}
        labels={dict.confirmation.page}
        locale={params.locale}
        stripeReturn={stripeReturn}
      />
    </Suspense>
  );
}
