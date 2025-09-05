"use client";

import KPIGrid from '@/components/tripper/KPIGrid';
import ActivityFeed from '@/components/tripper/ActivityFeed';
import Link from 'next/link'; // Import Link for navigation

export default function TripperDashboardPage() {
  const nextPaymentDate = '10 de Septiembre'; // Mock date

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <KPIGrid />
          <ActivityFeed />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="text-lg font-semibold text-neutral-600 mb-4">Próximo Pago</h3>
            <p className="text-neutral-800 mb-2">Fecha objetivo: <span className="font-bold">{nextPaymentDate}</span></p>
            <Link href="/tripper/earnings" className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Ver detalles de ganancias
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
