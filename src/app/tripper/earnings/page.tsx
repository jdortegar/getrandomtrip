'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/store';
import { formatUSD } from '@/lib/format';

export default function TripperEarningsPage() {
  const earnings = useStore(s => s.earnings);

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

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-2xl shadow">
        <h1 className="font-semibold mb-2">Ganancias (ciclo actual)</h1>
        {!current ? (
          <p className="text-sm text-neutral-600">Sin datos.</p>
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
