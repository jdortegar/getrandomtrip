'use client';

import { formatUSD } from '@/lib/format';
import { useTripperStore } from '@/store/tripperStore';

export default function KPIGrid() {
  const { routes, earnings } = useTripperStore();
  const published = routes.filter(r => r.status === 'published');
  const latest = earnings[0];

  const reservasMes = latest?.bookings ?? 0;
  const ingresosEstimados = latest?.totalUSD ?? 0;

  const npsValues = published.map(r => r.nps).filter((n): n is number => typeof n === 'number');
  const npsProm = npsValues.length ? (npsValues.reduce((a,b)=>a+b,0)/npsValues.length) : 0;

  const items = [
    { label: 'Reservas (mes)', value: reservasMes },
    { label: 'Ingresos estimados', value: formatUSD(ingresosEstimados) },
    { label: 'NPS promedio', value: npsProm.toFixed(1) },
    { label: 'Rutas publicadas', value: published.length },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(it => (
        <div key={it.label} className="p-4 bg-white rounded-2xl shadow">
          <div className="text-sm text-neutral-500">{it.label}</div>
          <div className="text-2xl font-semibold mt-1">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
