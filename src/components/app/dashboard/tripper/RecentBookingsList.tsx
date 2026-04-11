import { Calendar } from 'lucide-react';
import Link from 'next/link';
import type { RecentBooking } from '@/types/tripper';
import type { TripperDashboardDict } from '@/lib/types/dictionary';

interface RecentBookingsListProps {
  bookings: RecentBooking[];
  copy: TripperDashboardDict['recentBookings'] & TripperDashboardDict['status'];
}

function getStatusColor(status: string): string {
  if (status === 'confirmed' || status === 'completed') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (status === 'revealed') {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RecentBookingsList({ bookings, copy }: RecentBookingsListProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            {copy.title}
          </h2>
          <Link
            href="/dashboard/tripper/bookings"
            className="text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            {copy.viewAll}
          </Link>
        </div>

        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">{copy.empty}</p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                    {booking.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {booking.clientName}
                    </p>
                    <p className="text-sm text-neutral-600">{booking.packageName}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(booking.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-neutral-900">
                    ${booking.amount.toLocaleString('es-AR')}
                  </p>
                  <span
                    className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full border ${getStatusColor(booking.status)}`}
                  >
                    {copy[booking.status as keyof TripperDashboardDict['status']] ?? booking.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
