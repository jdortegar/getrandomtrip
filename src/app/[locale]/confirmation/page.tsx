import ConfirmationClient from './ConfirmationClient';
import HeaderHero from '@/components/journey/HeaderHero';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/Navbar';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale, type Locale } from '@/lib/i18n/config';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? (params.locale as Locale) : 'es';
  const dict = await getDictionary(locale);
  const { page } = dict.confirmation;
  return {
    description: page.metaDescription,
    title: page.title,
  };
}

export default async function ConfirmationPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? (params.locale as Locale) : 'es';
  const dict = await getDictionary(locale);
  const { hero, page } = dict.confirmation;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar dict={dict} locale={locale} />
      <HeaderHero
        description={hero.description}
        subtitle={hero.subtitle}
        title={hero.title}
      />
      <main className="flex-grow">
        <ConfirmationClient labels={page} />
      </main>
      <Footer dict={dict} locale={locale} />
    </div>
  );
}
