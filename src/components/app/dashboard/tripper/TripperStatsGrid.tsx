import { Users, DollarSign, Star, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TripperDashboardStats } from '@/types/tripper';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface TripperStatsGridProps {
  stats: TripperDashboardStats;
  copy: TripperDashboardDict['stats'];
}

export function TripperStatsGrid({ stats, copy }: TripperStatsGridProps) {
  const cards: Array<{
    icon: LucideIcon;
    key: string;
    label: string;
    value: string | number;
  }> = [
    {
      icon: Users,
      key: 'total-bookings',
      label: copy.totalBookings,
      value: stats.totalBookings,
    },
    {
      icon: DollarSign,
      key: 'monthly-revenue',
      label: copy.monthlyRevenue,
      value: `$${stats.monthlyRevenue.toLocaleString('es-AR')}`,
    },
    {
      icon: Star,
      key: 'average-rating',
      label: copy.averageRating,
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—',
    },
    {
      icon: MapPin,
      key: 'active-packages',
      label: copy.activePackages,
      value: stats.activePackages,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100"
            key={card.key}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-neutral-500">
                  {card.label}
                </p>
                <p className="font-barlow-condensed font-bold text-4xl text-gray-900">
                  {card.value}
                </p>
              </div>
              <Icon className="h-10 w-10 text-light-blue" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
