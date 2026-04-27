import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CheckoutResultPending from '../CheckoutResultPending';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    return { title: 'Payment' };
  }
  const dict = await getDictionary(params.locale);
  return {
    description: dict.paymentPending.metaDescription,
    title: dict.paymentPending.title,
  };
}

export default async function CheckoutPendingPage({
  params,
}: {
  params: { locale: string };
}) {
  if (!hasLocale(params.locale)) {
    notFound();
  }

  const dict = await getDictionary(params.locale);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      }
    >
      <CheckoutResultPending
        labels={dict.paymentPending}
        locale={params.locale}
      />
    </Suspense>
  );
}
