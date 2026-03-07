import React from 'react';
import TopTrippersGridComponent from '@/components/tripper/TopTrippersGrid';
import HeaderHero from '@/components/journey/HeaderHero';
import { getAllTrippers } from '@/lib/db/tripper-queries';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { hasLocale } from '@/lib/i18n/config';

export default async function TrippersPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = hasLocale(params.locale) ? params.locale : 'es';
  const dict = await getDictionary(locale);
  const hero = dict.trippers.hero;
  const trippers = await getAllTrippers();

  return (
    <main className="min-h-screen bg-white">
      <HeaderHero
        className="!min-h-[50vh]"
        description={hero.description}
        subtitle={hero.subtitle}
        title={hero.title}
        videoSrc={hero.videoSrc}
      />

      <TopTrippersGridComponent trippers={trippers} />
    </main>
  );
}
