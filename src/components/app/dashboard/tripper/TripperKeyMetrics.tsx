import { TrendingUp } from 'lucide-react';
import type { TripperDashboardStats } from '@/types/tripper';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface TripperKeyMetricsProps {
  stats: TripperDashboardStats;
  copy: TripperDashboardDict['keyMetrics'];
}

export function TripperKeyMetrics({ stats, copy }: TripperKeyMetricsProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.title}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">{copy.totalClients}</span>
          <span className="font-bold text-neutral-900">{stats.totalClients}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">{copy.conversionRate}</span>
          <span className="font-bold text-neutral-900">{stats.conversionRate}%</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-neutral-600">{copy.growth}</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-bold text-green-600">+12.5%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
