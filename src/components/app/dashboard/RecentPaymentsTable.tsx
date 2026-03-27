import { CreditCard } from 'lucide-react';
import type { Payment } from '@/lib/utils/trips';
import type { DashboardCopy } from './types';

interface RecentPaymentsTableProps {
  copy: DashboardCopy;
  getPaymentStatusColor: (status: string) => string;
  payments: Payment[];
}

export function RecentPaymentsTable({
  copy,
  getPaymentStatusColor,
  payments,
}: RecentPaymentsTableProps) {
  const recentPayments = payments.slice(0, 5);

  return (
    <div className="mt-8">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {copy.recentPayments.title}
          </h2>
          <span className="text-sm text-neutral-600">
            {payments.length} {copy.common.transactions}
          </span>
        </div>

        {recentPayments.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{copy.recentPayments.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                    {copy.recentPayments.date}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                    {copy.recentPayments.trip}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                    {copy.recentPayments.amount}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">
                    {copy.recentPayments.status}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => {
                  const trip = payment.tripRequest ?? payment.trip;
                  return (
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50"
                      key={payment.id}
                    >
                      <td className="py-4 px-4 text-sm text-neutral-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-neutral-900">
                            {trip ? `${trip.type} • ${trip.level}` : '—'}
                          </div>
                          {trip && (
                            <div className="text-xs text-neutral-500">
                              {copy.common.id}: {trip.id ?? '—'}
                            </div>
                          )}
                          {trip && (
                            <div className="text-xs text-neutral-500">
                              {new Date(trip.startDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-neutral-900">
                        ${(payment.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-sm font-medium ${getPaymentStatusColor(payment.status)}`}
                        >
                          {copy.paymentStatus[payment.status] ?? payment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
