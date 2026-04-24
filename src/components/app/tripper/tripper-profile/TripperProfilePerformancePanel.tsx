'use client';

import { useRouter } from 'next/navigation';
import { DollarSign, Lightbulb, Star, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TripperProfilePageDict } from '@/lib/types/dictionary';

interface TripperProfilePerformancePanelProps {
  copy: TripperProfilePageDict;
  dashboardPath: string;
  stats: {
    averageRating: number;
    totalBookings: number;
    totalEarnings: number;
    totalExperiences: number;
  };
}

export function TripperProfilePerformancePanel({
  copy,
  dashboardPath,
  stats,
}: TripperProfilePerformancePanelProps) {
  const router = useRouter();
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold leading-none tracking-tight text-neutral-900">
          {copy.performance.title}
        </h2>
        <Button
          onClick={() => router.push(dashboardPath)}
          type="button"
          variant="outline"
        >
          {copy.performance.viewFullDashboard}
        </Button>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
          <TrendingUp className="text-light-blue mx-auto mb-2 h-10 w-10" />
          <p className="text-2xl font-bold text-neutral-900">{stats.totalBookings}</p>
          <p className="text-sm text-neutral-600">{copy.performance.totalBookings}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
          <Star className="mx-auto mb-2 h-10 w-10 text-yellow-500" />
          <p className="text-2xl font-bold text-neutral-900">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
          </p>
          <p className="text-sm text-neutral-600">{copy.performance.averageRating}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
          <DollarSign className="mx-auto mb-2 h-10 w-10 text-green-600" />
          <p className="text-2xl font-bold text-neutral-900">${stats.totalEarnings}</p>
          <p className="text-sm text-neutral-600">{copy.performance.totalEarnings}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
          <Users className="text-light-blue mx-auto mb-2 h-10 w-10" />
          <p className="text-2xl font-bold text-neutral-900">{stats.totalExperiences}</p>
          <p className="text-sm text-neutral-600">{copy.performance.activeExperiences}</p>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <Lightbulb
          aria-hidden
          className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500"
        />
        <p className="text-sm leading-relaxed text-neutral-600">
          {copy.performance.hintBefore}{' '}
          <Button
            className="h-auto p-0 font-semibold"
            onClick={() => router.push(dashboardPath)}
            type="button"
            variant="link"
          >
            {copy.performance.hintLink}
          </Button>
          {copy.performance.hintAfter}
        </p>
      </div>
    </div>
  );
}
