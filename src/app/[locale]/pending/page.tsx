import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import HeaderHero from '@/components/journey/HeaderHero';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? (params.locale as Locale) : 'es';
  const dict = await getDictionary(locale);
  const { paymentPending } = dict;
  return {
    description: paymentPending.metaDescription,
    title: paymentPending.title,
  };
}

export default async function PendingPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? (params.locale as Locale) : 'es';
  const dict = await getDictionary(locale);
  const labels = dict.paymentPending;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar dict={dict} locale={locale} />
      <HeaderHero
        description={labels.body}
        subtitle={labels.subtitle}
        title={labels.title}
      />
      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-12 md:px-20">
          <div className="max-w-3xl w-full space-y-6 rounded-lg bg-white px-6 py-10 shadow-lg sm:px-8 sm:py-14">
            <p className="text-center font-barlow text-base leading-relaxed text-gray-600 md:text-lg">
              {labels.body}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link href={`/${locale}/journey`}>{labels.ctaBackToJourney}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${locale}`}>{labels.ctaHome}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </div>
  );
}
