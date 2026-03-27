import Link from 'next/link';
import { Clock, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { DashboardCopy } from './types';

interface QuickActionsProps {
  copy: DashboardCopy;
}

export function QuickActions({ copy }: QuickActionsProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        {copy.quickActions.title}
      </h3>
      <div className="space-y-3">
        <Button asChild className="w-full justify-start">
          <Link href="/journey">
            <Plus className="w-4 h-4 mr-2" />
            {copy.quickActions.newTrip}
          </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="secondary">
          <Link href="/profile">
            <MapPin className="w-4 h-4 mr-2" />
            {copy.quickActions.profile}
          </Link>
        </Button>
        <Button asChild className="w-full justify-start" variant="secondary">
          <Link href="#historial">
            <Clock className="w-4 h-4 mr-2" />
            {copy.quickActions.history}
          </Link>
        </Button>
      </div>
    </div>
  );
}
