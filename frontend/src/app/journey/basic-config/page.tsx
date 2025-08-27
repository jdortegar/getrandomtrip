import SelectionsBar from '@/components/journey/SelectionsBar';
import { JourneyTabs } from '@/components/journey/Tabs';
import LogisticsTab from '@/components/journey/LogisticsTab';
import PreferencesTab from '@/components/journey/PreferencesTab';
import AvoidTab from '@/components/journey/AvoidTab';
import SummaryCard from '@/components/journey/SummaryCard';
import InitClient from '@/components/journey/InitClient';

export default function Page({ searchParams }: { searchParams: Record<string,string> }) {
  const displayPrice = decodeURIComponent(searchParams.price || '');
  return (
    <div className="container mx-auto px-4 pb-10 pt-8"> {/* pt evita solaparse con navbar */}
      <InitClient searchParams={searchParams} displayPrice={displayPrice} />
      <div className="mb-4">
        <SelectionsBar />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="min-w-0">
          <JourneyTabs
            logistics={<LogisticsTab />}
            preferences={<PreferencesTab />}
            avoid={<AvoidTab />}
          />
        </div>
        <aside className="lg:sticky lg:top-24"> {/* ajustar top si la navbar es más alta */}
          <SummaryCard />
        </aside>
      </div>
    </div>
  );
}
