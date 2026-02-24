'use client';

import { useEffect } from 'react';
import SelectionsBar from '@/components/journey/SelectionsBar';
import { JourneyForm } from '@/components/journey/JourneyForm';
import SummaryCard from '@/components/journey/SummaryCard';
import BasicConfigHero from '@/components/journey/BasicConfigHero';
import Section from '@/components/layout/Section';
import { useStore } from '@/store/store';
import { Info } from 'lucide-react';
import { useInitJourney } from '@/hooks/useInitJourney';

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const { activeTab, setPartial } = useStore();

  // Initialize journey state from URL params
  useInitJourney(searchParams);

  // Always reset to Step 1 when landing on this page
  useEffect(() => {
    setPartial({ activeTab: 'logistics' });
  }, [setPartial]);

  return (
    <>
      <BasicConfigHero />

      <Section>
        {/* <div className="mb-4">
          <SelectionsBar />
          Chips estáticos eliminados: <TopFiltersSummary />
        </div> */}

        <div className="flex gap-6 w-full space-between">
          <div className="flex-1">
            <JourneyForm />
          </div>

          <aside className="sticky top-20 self-start w-80 flex-shrink-0 max-w-[300px]">
            <SummaryCard />

            {activeTab === 'preferences' && (
              <div className="mt-4 rounded-sm bg-primary p-4 text-sm text-white flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <Info className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />{' '}
                  IMPORTANTE
                </div>
                <div className="flex flex-col gap-1 text-left w-full">
                  <ul className="list-disc pl-4 space-y-2 break-words">
                    <li className="break-words">
                      Transporte es obligatorio y no suma costo.
                    </li>
                    <li className="break-words">
                      <strong>Freemium:</strong> el primer filtro opcional es{' '}
                      <strong>gratis</strong>.
                    </li>
                    <li className="break-words">
                      2–3 filtros: <strong>USD 18</strong> c/u.
                    </li>
                    <li className="break-words">
                      4+ filtros: <strong>USD 25</strong> c/u.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        </div>
      </Section>
    </>
  );
}
