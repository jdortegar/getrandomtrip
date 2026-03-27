import { Calendar, DollarSign, Plane, Star } from 'lucide-react';
import type { DashboardCopy, DashboardStats } from './types';

interface DashboardStatsGridProps {
  copy: DashboardCopy;
  stats: DashboardStats;
}

export function DashboardStatsGrid({ copy, stats }: DashboardStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 mb-1">{copy.stats.totalTrips}</p>
            <p className="text-3xl font-bold text-neutral-900">
              {stats.totalTrips}
            </p>
          </div>
          <Plane className="h-10 w-10 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 mb-1">{copy.stats.upcomingTrips}</p>
            <p className="text-3xl font-bold text-neutral-900">
              {stats.upcomingTrips}
            </p>
          </div>
          <Calendar className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 mb-1">{copy.stats.totalSpent}</p>
            <p className="text-3xl font-bold text-neutral-900">
              ${(stats.totalSpent ?? 0).toFixed(0)}
            </p>
          </div>
          <DollarSign className="h-10 w-10 text-purple-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 mb-1">{copy.stats.averageRating}</p>
            <p className="text-3xl font-bold text-neutral-900">
              {stats.averageRating > 0 ? (stats.averageRating ?? 0).toFixed(1) : '—'}
            </p>
          </div>
          <Star className="h-10 w-10 text-yellow-500" />
        </div>
      </div>
    </div>
  );
}
