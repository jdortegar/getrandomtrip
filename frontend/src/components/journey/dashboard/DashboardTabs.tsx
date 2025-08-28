'use client'

import { useEffect, useMemo, useState } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import TripCard from './TripCard'
import PaymentHistory from './PaymentHistory'
import EmptyState from './EmptyState'
import { Trip, PaymentItem } from './types'

function useDemoData() {
  // Mock simple; en el futuro, reemplazar por datos reales del usuario
  const trips: Trip[] = [
    {
      id: 't1',
      title: 'Randomtrip confirmado',
      subtitle: 'Tu viaje a lo desconocido',
      startISO: '2025-12-24',
      endISO: '2026-01-01',
      city: '—',
      country: '—',
      status: 'upcoming',
      coverUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 't2',
      title: 'A weekend in the mountains',
      subtitle: '2 nights in the mountains, 2023',
      startISO: '2023-07-12',
      endISO: '2023-07-14',
      city: 'Chamonix',
      country: 'France',
      status: 'past',
      coverUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 't3',
      title: 'Trip to the unknown',
      subtitle: 'Destination: Tokyo, Japan',
      startISO: '2024-06-18',
      endISO: '2024-06-24',
      city: 'Tokyo',
      country: 'Japan',
      status: 'past',
      coverUrl: 'https://images.unsplash.com/photo-1549693578-d683be217e58?q=80&w=1200&auto=format&fit=crop'
    }
  ]

  const payments: PaymentItem[] = [
    { id: 'p1', dateISO: '2025-05-01', description: 'Booking fee', amountUsd: 50, status: 'Completed' },
    { id: 'p2', dateISO: '2025-05-15', description: 'Initial deposit', amountUsd: 200, status: 'Completed' },
    { id: 'p3', dateISO: '2025-06-01', description: 'Payment for Randomtrip', amountUsd: 500, status: 'Completed' },
  ]

  return { trips, payments }
}

export default function DashboardTabs() {
  const { trips, payments } = useDemoData()
  const [tab, setTab] = useState<'upcoming' | 'past' | 'canceled'>('upcoming')
  const upcoming = trips.filter(t => t.status === 'upcoming')
  const past = trips.filter(t => t.status === 'past')
  const canceled = trips.filter(t => t.status === 'canceled')

  const next = upcoming[0]

  // countdown simple
  const [left, setLeft] = useState<string>('—')
  useEffect(() => {
    const tick = () => {
      if (!next?.startISO) return setLeft('—')
      const now = Date.now()
      const start = new Date(next.startISO).getTime()
      const ms = start - now
      if (ms <= 0) return setLeft('¡Es hoy!')
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setLeft(`${String(d).padStart(2,'0')}d : ${String(h).padStart(2,'0')}h : ${String(m).padStart(2,'0')}m : ${String(s).padStart(2,'0')}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [next?.startISO])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        {[
          { key: 'upcoming', label: 'Próximos' },
          { key: 'past', label: 'Pasados' },
          { key: 'canceled', label: 'Cancelados' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 ${
              tab === t.key
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upcoming: hero + countdown + payment history */}
      {tab === 'upcoming' && (
        <>
          {next ? (
            <>
              <TripCard trip={next} />
              <GlassCard>
                <div className="p-5">
                  <div className="text-sm text-neutral-600">Cuenta regresiva</div>
                  <div className="mt-2 text-2xl font-bold tracking-wider text-neutral-900">{left}</div>
                </div>
              </GlassCard>
            </>
          ) : (
            <EmptyState title="No tienes viajes próximos." ctaHref="/?tab=Top%20Trippers#start-your-journey-anchor" />
          )}

          <PaymentHistory items={payments} />
        </>
      )}

      {/* Past */}
      {tab === 'past' && (
        <div className="grid gap-4">
          {past.length ? past.map(t => <TripCard key={t.id} trip={t} />) : (
            <EmptyState title="Aún no tienes viajes pasados." ctaHref="/" />
          )}
        </div>
      )}

      {/* Canceled */}
      {tab === 'canceled' && (
        <div className="grid gap-4">
          {canceled.length ? canceled.map(t => <TripCard key={t.id} trip={t} />) : (
            <EmptyState title="No hay reservas canceladas." ctaHref="/" />
          )}
        </div>
      )}
    </div>
  )
}
