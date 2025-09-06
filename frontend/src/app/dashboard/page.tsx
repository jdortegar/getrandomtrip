'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import PageContainer from '@/components/user/PageContainer';
import SectionCard from '@/components/user/SectionCard';
import StatCard from '@/components/user/StatCard';
import { formatUSD } from '@/lib/format';
import { CalendarClock, MessageSquareText, Compass } from 'lucide-react';
import { useUserStore } from '@/store/userStore'; // Added import

const mock = {
  bookingsMonth: 3,
  spendMonthUSD: 1200,
  tripsUpcoming: 2,
  messagesUnread: 1,
  recent: [
    { id: 'r1', text: 'Confirmaste “Aventura en la Patagonia”.', time: 'Hace 2 horas' },
    { id: 'r2', text: 'Nuevo mensaje del Tripper “Ruta del Café”.', time: 'Ayer' },
    { id: 'r3', text: 'Cambio de fecha propuesto por el Tripper.', time: 'Hace 3 días' },
  ],
  upcoming: [
    { id: 'u1', date: '10 Sep', title: 'Ruta del Café (CDMX)' },
    { id: 'u2', date: '22 Sep', title: 'Aventura en la Patagonia' },
  ],
};

export default function ClientDashboardPage() {
  const { user } = useUserStore(); // Added line
  const kpis = useMemo(() => ([
    { label: 'Reservas (mes)', value: mock.bookingsMonth },
    { label: 'Gasto estimado', value: formatUSD(mock.spendMonthUSD) },
    { label: 'Próximos viajes', value: mock.tripsUpcoming },
    { label: 'Mensajes sin leer', value: mock.messagesUnread },
  ]), []);

  return (
    <PageContainer>
      <h1 className="rt-h1 mb-4">Bitácoras de Viajes</h1>

      {user?.role === 'tripper' && (
        <div className="mb-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 px-4 py-2 text-sm">
          Tienes acceso al <strong>Tripper OS</strong>. ¿Prefieres gestionarlo ahí?
          <Link href="/tripper" className="underline ml-2">Ir a Tripper</Link>
        </div>
      )}

      {/* KPIs */}
      <section className="rt-stats mb-6">
        {kpis.map(k => <StatCard key={k.label} label={k.label} value={k.value} />)}
      </section>

      {/* Activity + Quick Actions */}
      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Actividad reciente">
          <ul className="rt-list text-sm text-neutral-800">
            {mock.recent.map(item => (
              <li key={item.id} className="rt-list-item">
                {item.text}
                <div className="rt-subtle mt-1">{item.time}</div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Próximos viajes" actions={<Link href="/trips" className="rt-btn rt-btn--ghost">Ver todos</Link>}>
            <ul className="space-y-3 text-sm">
              {mock.upcoming.map(x => (
                <li key={x.id} className="flex items-center gap-3">
                  <CalendarClock size={18} className="text-neutral-500" />
                  <div><strong>{x.date}</strong> · {x.title}</div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Acciones rápidas">
            <div className="grid gap-2">
              <Link href="/explore" className="rt-btn rt-btn--primary"><Compass size={16}/> Explorar rutas</Link>
              <Link href="/messages" className="rt-btn rt-btn--ghost"><MessageSquareText size={16}/> Ver mensajes</Link>
              <Link href="/profile" className="rt-btn rt-btn--ghost">Editar perfil</Link>
            </div>
          </SectionCard>
        </div>
      </section>
    </PageContainer>
  );
}
