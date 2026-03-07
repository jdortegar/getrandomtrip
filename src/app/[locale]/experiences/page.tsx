import Hero from '@/components/Hero';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';
import ExperiencesClient from './ExperiencesClient';

export default async function ExperiencesPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = await getDictionary(locale);
  const exp = dict.experiences;
  const home = dict.home;
  return (
    <main className="relative" style={{ scrollBehavior: 'smooth' }}>
      <Hero
        content={exp.hero}
        scrollIndicator
      />

      <ExperiencesClient
        experiences={exp}
        home={home}
        locale={locale}
      />
    </main>
  );
}
