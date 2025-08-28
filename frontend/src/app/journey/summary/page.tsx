'use client'
import TopNav from '@/components/chrome/TopNav'
import ChatFab from '@/components/chrome/ChatFab'
import BgCarousel from '@/components/ui/BgCarousel'
import { useJourneyStore } from '@/store/journeyStore'
import { computeAddonsCostPerTrip, computeFiltersCostPerTrip } from '@/lib/pricing'
import { ADDONS } from '@/data/addons-catalog'
import { useMemo } from 'react'
import Link from 'next/link'

const usd = (n:number) => `USD ${n.toFixed(2)}`

export default function SummaryPage() {
  const { basePriceUsd, displayPrice, logistics, filters, addons, level, type } = useJourneyStore()
  const pax = logistics.pax || 1
  const filtersTrip = computeFiltersCostPerTrip(filters, pax)
  const { totalTrip: addonsTrip, cancelCost } = 
    computeAddonsCostPerTrip(addons.selected, basePriceUsd, filtersTrip, pax)

  const basePerPax = basePriceUsd
  const filtersPerPax = filtersTrip / pax
  const addonsPerPax = addonsTrip / pax
  const totalPerPax = basePerPax + filtersPerPax + addonsPerPax
  const totalTrip = totalPerPax * pax

  const filterChips = useMemo(() => {
    const out: string[] = []
    if (filters.climate !== 'indistinto') out.push(`Clima ${filters.climate}`)
    if (filters.maxTravelTime !== 'sin-limite') out.push(`Máx ${filters.maxTravelTime}`)
    if (filters.departPref !== 'indistinto') out.push(`Salida: ${filters.departPref}`)
    if (filters.arrivePref !== 'indistinto') out.push(`Llegada: ${filters.arrivePref}`)
    ;(filters.avoidDestinations || []).forEach(d => out.push(`Evitar: ${d}`))
    return out
  }, [filters])

  const addonRows = useMemo(() => {
    return addons.selected.map(s => {
      const a = ADDONS.find(x => x.id === s.id)
      if (!a) return null
      const opt = a.options?.find(o => o.id === s.optionId)
      const unit = (a.priceUsd + (opt?.deltaUsd ?? 0))
      const qty = s.qty || 1
      const total = a.unit === 'per_pax' ? unit * pax * qty : unit * qty
      return { id: s.id, title: a.title + (opt ? ` · ${opt.label}` : ''), total }
    }).filter(Boolean) as {id:string;title:string;total:number}[]
  }, [addons.selected, pax])

  return (
    <>
      <BgCarousel />
      <TopNav />
      <ChatFab />
      <div className="container mx-auto px-4 pb-16 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* izquierda */}
          <div className="space-y-6">
            <section className="rounded-2xl bg-white/90 ring-1 ring-neutral-200 backdrop-blur p-5">
              <h1 className="text-xl font-semibold mb-3">Resumen del viaje</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><div className="text-neutral-500">Ciudad</div><div className="font-medium">{logistics.city?.name ?? '—'}</div></div>
                <div><div className="text-neutral-500">Fechas</div><div className="font-medium">{logistics.startDate && logistics.endDate ? `${logistics.startDate} → ${logistics.endDate}` : '—'}</div></div>
                <div><div className="text-neutral-500">Viajeros</div><div className="font-medium">{pax}</div></div>
                <div><div className="text-neutral-500">Tipo</div><div className="font-medium">{type} · {level}</div></div>
              </div>
            </section>

            <section className="rounded-2xl bg-white/90 ring-1 ring-neutral-200 backdrop-blur p-5">
              <h3 className="text-base font-semibold mb-3">Filtros premium seleccionados</h3>
              {filterChips.length ? (
                <div className="flex flex-wrap gap-2">
                  {filterChips.map(c =>
                    <span key={c} className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1 text-sm">{c}</span>
                  )}
                </div>
              ) : <div className="text-sm text-neutral-600">Sin filtros extra.</div>}
            </section>

            <section className="rounded-2xl bg-white/90 ring-1 ring-neutral-200 backdrop-blur p-5">
              <h3 className="text-base font-semibold mb-3">Tus add-ons</h3>
              {addonRows.length ? (
                <ul className="space-y-2 text-sm">
                  {addonRows.map(r => (
                    <li key={r.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
                      <span className="font-medium text-neutral-900">{r.title}</span>
                      <span className="font-medium">{usd(r.total)}</span>
                    </li>
                  ))}
                  {cancelCost > 0 && (
                    <li className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <span className="font-medium text-amber-900">Seguro de cancelación · 15% del subtotal</span>
                      <span className="font-medium">{usd(cancelCost)}</span>
                    </li>
                  )}
                </ul>
              ) : <div className="text-sm text-neutral-600">Aún no agregaste add-ons.</div>}
            </section>
          </div>

          {/* derecha */}
          <aside className="xl:sticky xl:top-28 h-max">
            <div className="rounded-2xl bg-white/95 ring-1 ring-neutral-200 backdrop-blur p-5">
              <h3 className="text-base font-semibold mb-4">Precio</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Base por persona</span><span className="font-medium">{displayPrice || usd(basePerPax)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Filtros premium</span><span className="font-medium">{usd(filtersPerPax)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Add-ons</span><span className="font-medium">{usd(addonsPerPax)}</span></div>
                <div className="my-2 border-t border-neutral-200" />
                <div className="flex justify-between text-base"><span className="font-medium">Total por persona</span><span className="font-semibold">{usd(totalPerPax)}</span></div>
                <div className="flex justify-between text-base"><span className="text-neutral-600">Total (x{pax})</span><span className="font-semibold">{usd(totalTrip)}</span></div>
              </div>
              <div className="mt-4 grid gap-2">
                <Link href="/journey/add-ons" className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm hover:bg-neutral-50">← Volver a add-ons</Link>
                <Link href="/journey/checkout" className="rounded-xl bg-violet-600 px-4 py-3 text-center text-white text-sm font-medium hover:bg-violet-500">Continuar a pago</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}