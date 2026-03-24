import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CheckoutResultSuccess from '../CheckoutResultSuccess';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { parseMercadoPagoCheckoutReturnParams } from '@/lib/helpers/mercadopago-checkout-params';
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
  const mercadoPagoParams = parseMercadoPagoCheckoutReturnParams(searchParams);

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
        mercadoPagoParams={mercadoPagoParams}
      />
    </Suspense>
  );
}
