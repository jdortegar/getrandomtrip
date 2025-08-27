import SelectionsBar from '@/components/journey/SelectionsBar';
import { JourneyTabs } from '@/components/journey/Tabs';
import InitClient from '@/components/journey/InitClient';
import LogisticsTab from '@/components/journey/LogisticsTab';
import FiltersTab from '@/components/journey/FiltersTab';
import SummaryCard from '@/components/journey/SummaryCard';

export default function BasicConfigPage({ searchParams }: { searchParams: Record<string, string> }) {
  const displayPrice = decodeURIComponent(searchParams.price || '');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <InitClient searchParams={searchParams} displayPrice={displayPrice} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SelectionsBar />
          <JourneyTabs
            logistics={<LogisticsTab />}
            filters={<FiltersTab />}
          />
        </div>
        <div className="relative">
          <div className="sticky top-8">
            <SummaryCard />
          </div>
        </div>
      </div>
    </div>
  );
}