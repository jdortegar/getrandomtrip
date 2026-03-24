import { notFound } from 'next/navigation';
import CheckoutResultFailure from '../CheckoutResultFailure';
import { parseMercadoPagoCheckoutReturnParams } from '@/lib/helpers/mercadopago-checkout-params';
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
    description: dict.paymentFailure.metaDescription,
    title: dict.paymentFailure.title,
  };
}

export default async function CheckoutFailurePage({
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
    <CheckoutResultFailure
      labels={dict.paymentFailure}
      locale={params.locale}
      mercadoPagoParams={mercadoPagoParams}
    />
  );
}
