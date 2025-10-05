import SelectionsBar from '@/components/journey/SelectionsBar';
import { JourneyForm } from '@/components/journey/JourneyForm';
import SummaryCard from '@/components/journey/SummaryCard';
import InitClient from '@/components/journey/InitClient';
import BasicConfigHero from '@/components/journey/BasicConfigHero';
import Section from '@/components/layout/Section';

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const displayPrice = decodeURIComponent(searchParams.price || '');

  return (
    <>
      <BasicConfigHero />

      <Section>
        <InitClient searchParams={searchParams} displayPrice={displayPrice} />

        <div className="mb-4">
          <SelectionsBar />
          {/* Chips estáticos eliminados: <TopFiltersSummary /> */}
        </div>

        <div className="flex gap-6 w-full space-between">
          <div className="flex-1">
            <JourneyForm />
          </div>

          <aside className="sticky top-0">
            <SummaryCard />
          </aside>
        </div>
      </Section>
    </>
  );
}
