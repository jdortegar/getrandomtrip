import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadShareCheckout } from "@/lib/payments/share-checkout.server";
import { ShareCheckoutPageClient } from "./ShareCheckoutPageClient";

type Props = {
  params: Promise<{ locale?: string; travelerId?: string }>;
  searchParams: Promise<{ payment_intent?: string | string[] }>;
};

/** Companion's own share of an individually paid trip. Never shows anyone else's share. */
export default async function ShareCheckoutPage({ params, searchParams }: Props) {
  const { locale: rawLocale, travelerId } = await params;
  const locale = hasLocale(rawLocale) ? rawLocale : "es";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (!travelerId) notFound();

  const { payment_intent: rawIntent } = await searchParams;
  const paymentIntentId = typeof rawIntent === "string" ? rawIntent : undefined;
  const view = await loadShareCheckout(travelerId, session.user.id, paymentIntentId);
  if (!view) notFound();

  const dict = await getDictionary(locale);
  const checkout = dict.journey.checkout;
  return (
    <ShareCheckoutPageClient
      copy={dict.shareCheckout}
      locale={locale}
      paymentCopy={{
        paymentBack: checkout.paymentBack,
        paymentFailed: checkout.paymentFailed,
        paymentLoadError: checkout.paymentLoadError,
        paymentLoading: checkout.paymentLoading,
        paymentProcessing: checkout.paymentProcessing,
        paymentRetry: checkout.paymentRetry,
        paymentSubmit: checkout.paymentSubmit,
      }}
      view={view}
    />
  );
}
