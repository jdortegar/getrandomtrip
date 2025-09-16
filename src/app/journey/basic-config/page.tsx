import SelectionsBar from '@/components/journey/SelectionsBar';
import { JourneyTabs } from '@/components/journey/Tabs';
import LogisticsTab from '@/components/journey/LogisticsTab';
import PreferencesTab from '@/components/journey/PreferencesTab';
import AvoidTab from '@/components/journey/AvoidTab';
import SummaryCard from '@/components/journey/SummaryCard';
import InitClient from '@/components/journey/InitClient';
// 🔥 Eliminado: TopFiltersSummary
import BasicConfigHero from '@/components/journey/BasicConfigHero';

export default function Page({ searchParams }: { searchParams: Record<string, string> }) {
  const displayPrice = decodeURIComponent(searchParams.price || '');

  return (
    <>
      <BasicConfigHero />

      <div className="container mx-auto px-4 pb-12 pt-6">
        <InitClient searchParams={searchParams} displayPrice={displayPrice} />

        <div className="mb-4">
          <SelectionsBar />
          {/* Chips estáticos eliminados: <TopFiltersSummary /> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="min-w-0">
            <JourneyTabs
              logistics={<LogisticsTab />}
              preferences={<PreferencesTab />}
              avoid={<AvoidTab />}
            />
          </div>

          <aside className="sticky top-[96px]"> {/* Removed lg: to make it sticky on all screen sizes */}
            <SummaryCard />
          </aside>
        </div>
      </div>
    </>
  );
}
