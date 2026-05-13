'use client';

import { useMemo, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

interface Earning {
  id: string;
  month: string;
  bookings: number;
  baseCommissionUSD: number;
  bonusUSD: number;
  totalUSD: number;
  status: string;
  payoutDate?: string;
}

function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TripperEarningsPage() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/tripper/earnings?months=6');
        const data = await response.json();

        if (response.ok && data.earnings) {
          setEarnings(data.earnings);
        } else {
          console.error('Error fetching earnings:', data.error);
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, [session?.user?.id]);

  const current = earnings[0];
  const lastSix = earnings.slice(0, 6);

  const csv = useMemo(() => {
    const header = ['month','bookings','baseCommissionUSD','bonusUSD','totalUSD','status','payoutDate'];
    const rows = lastSix.map(e =>
      [e.month, e.bookings, e.baseCommissionUSD, e.bonusUSD, e.totalUSD, e.status, e.payoutDate ?? '']
        .map(String).join(',')
    );
    return [header.join(','), ...rows].join('\n');
  }, [lastSix]);

  const downloadCSV = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'earnings.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Ganancias</h1>

      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-semibold mb-2">Ganancias (ciclo actual)</h2>
        {!current ? (
          <p className="text-sm text-neutral-600">Sin datos para el mes actual.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>Reservas: <strong>{current.bookings}</strong></div>
            <div>Base: <strong>{formatUSD(current.baseCommissionUSD)}</strong></div>
            <div>Bonus: <strong>{formatUSD(current.bonusUSD)}</strong></div>
            <div>Total: <strong>{formatUSD(current.totalUSD)}</strong></div>
            <div>Status: <strong>{current.status}</strong></div>
            <div>Pago: <strong>{current.payoutDate ?? '—'}</strong></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white rounded-2xl shadow overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Histórico (6 meses)</h2>
          <button onClick={downloadCSV}
                  className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
            Exportar CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-3">Mes</th>
              <th className="text-right p-3">Reservas</th>
              <th className="text-right p-3">Base</th>
              <th className="text-right p-3">Bonus</th>
              <th className="text-right p-3">Total</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Pago</th>
            </tr>
          </thead>
          <tbody>
            {lastSix.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.month}</td>
                <td className="p-3 text-right">{e.bookings}</td>
                <td className="p-3 text-right">{formatUSD(e.baseCommissionUSD)}</td>
                <td className="p-3 text-right">{formatUSD(e.bonusUSD)}</td>
                <td className="p-3 text-right">{formatUSD(e.totalUSD)}</td>
                <td className="p-3">{e.status}</td>
                <td className="p-3">{e.payoutDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
