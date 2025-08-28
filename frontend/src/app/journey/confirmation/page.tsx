'use client'
import TopNav from '@/components/chrome/TopNav'
import ChatFab from '@/components/chrome/ChatFab'
import BgCarousel from '@/components/ui/BgCarousel'
import { useJourneyStore } from '@/store/journeyStore'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { buildICS } from '@/lib/ics'

function useCountdown(target: Date) {
  const [now, setNow] = useState<Date>(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now.getTime())
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return { d, h, m, s: ss }
}

export default function Confirmation() {
  const { logistics, basePriceUsd } = useJourneyStore()
  // reveal = 48h antes de la salida (o 72h desde ahora si no hay fecha)
  const start = logistics.startDate ? new Date(logistics.startDate) : new Date(Date.now() + 72*3600*1000)
  const reveal = new Date(start.getTime() - 48*3600*1000)
  const countdown = useCountdown(reveal)

  const icsHref = buildICS(
    'Randomtrip: tu viaje',
    logistics.startDate || new Date().toISOString(),
    logistics.endDate || new Date(Date.now() + 3*24*3600*1000).toISOString(),
    logistics.city?.name || ''
  )

  const shareText = `¡Viaje reservado en Randomtrip! Salida: ${logistics.startDate ?? 'próximamente'} · ${logistics.pax || 1} viajeros · Total aprox: USD ${basePriceUsd}.`
  const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const email = `mailto:?subject=${encodeURIComponent('Mi viaje Randomtrip')}&body=${encodeURIComponent(shareText)}`

  const tryWebShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ text: shareText, url: location.origin }) } catch {}
    } else {
      alert('Compartir del navegador no disponible en este dispositivo.')
    }
  }

  return (
    <>
      <BgCarousel />
      <TopNav />
      <ChatFab />
      <div className="container mx-auto px-4 pb-20 pt-28">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white/95 p-6 text-center shadow-sm ring-1 ring-neutral-200 backdrop-blur">
          <h1 className="text-2xl font-semibold">¡Gracias por confiar en Randomtrip!</h1>
          <p className="mt-2 text-neutral-600">
            Tu destino será revelado <strong>48 horas antes</strong> de la salida.
          </p>

          <div className="mt-6 grid grid-cols-4 gap-3 text-center">
            {[{
              label:'Días', val: countdown.d},
              {label:'Horas', val: countdown.h},
              {label:'Min',  val: countdown.m},
              {label:'Seg',  val: countdown.s},
            ].map(x=>(<div key={x.label} className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <div className="text-2xl font-semibold">{x.val.toString().padStart(2,'0')}</div>
                <div className="text-xs text-neutral-600">{x.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <a href={icsHref} download="randomtrip.ics"
               className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm hover:bg-neutral-50">
              Añadir al calendario (.ics)
            </a>
            <button onClick={tryWebShare}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500">
              Compartir (Web Share)
            </button>
          </div>

          <div className="mt-3 flex justify-center gap-2 text-sm">
            <a className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-50" href={wa} target="_blank">WhatsApp</a>
            <a className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-50" href={email}>Email</a>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/" className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm hover:bg-neutral-50">
              Volver al inicio
            </Link>
            <Link href="/dashboard" className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
              Ir a Mis Viajes
            </Link>
          </div>
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/&gt;
  )
}
