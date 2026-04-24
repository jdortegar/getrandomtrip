'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Package, Settings, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { TripperProfilePageDict } from '@/lib/types/dictionary';

type TabType = 'experiences' | 'overview' | 'performance';

interface TripperProfileSidebarNavProps {
  activeTab: TabType;
  copy: TripperProfilePageDict;
  dashboardPath: string;
  onTabChange: (t: TabType) => void;
  stats: {
    averageRating: number;
    totalBookings: number;
    totalExperiences: number;
  };
}

export function TripperProfileSidebarNav({
  activeTab,
  copy,
  dashboardPath,
  onTabChange,
  stats,
}: TripperProfileSidebarNavProps) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">{copy.sections.navigation}</h3>
        <div className="space-y-2">
          <button
            className={cn(
              'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
              activeTab === 'overview'
                ? 'border-neutral-200 bg-neutral-100 text-neutral-900'
                : 'border-transparent text-neutral-600 hover:bg-neutral-50',
            )}
            onClick={() => onTabChange('overview')}
            type="button"
          >
            <Briefcase className="mr-2 inline h-4 w-4" />
            {copy.tabs.overview}
          </button>
          <button
            className={cn(
              'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
              activeTab === 'experiences'
                ? 'border-neutral-200 bg-neutral-100 text-neutral-900'
                : 'border-transparent text-neutral-600 hover:bg-neutral-50',
            )}
            onClick={() => onTabChange('experiences')}
            type="button"
          >
            <Package className="mr-2 inline h-4 w-4" />
            {copy.tabs.experiences}
          </button>
          <button
            className={cn(
              'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
              activeTab === 'performance'
                ? 'border-neutral-200 bg-neutral-100 text-neutral-900'
                : 'border-transparent text-neutral-600 hover:bg-neutral-50',
            )}
            onClick={() => onTabChange('performance')}
            type="button"
          >
            <TrendingUp className="mr-2 inline h-4 w-4" />
            {copy.tabs.performance}
          </button>
          <Button
            className="w-full justify-start"
            onClick={() => router.push(dashboardPath)}
            type="button"
            variant="default"
          >
            <Settings className="mr-2 h-4 w-4" />
            {copy.tabs.goToDashboard}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">{copy.quickStats.title}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">{copy.quickStats.experiences}</span>
            <span className="font-semibold text-neutral-900">{stats.totalExperiences}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">{copy.quickStats.bookings}</span>
            <span className="font-semibold text-neutral-900">{stats.totalBookings}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">{copy.quickStats.rating}</span>
            <span className="font-semibold text-neutral-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
