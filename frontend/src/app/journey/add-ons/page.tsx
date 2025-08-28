// frontend/src/app/journey/add-ons/page.tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useJourneyStore } from '@/store/journeyStore'
import SummaryCard from '@/components/journey/SummaryCard'
import AddonsGallery from '@/components/journey/addons/AddonsGallery'
import SelectedAddonsChips from '@/components/journey/addons/SelectedAddonsChips'

export default function AddOnsPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { logistics } = useJourneyStore()

  const backToAvoid = () => {
    const qs = new URLSearchParams(sp.toString())
    qs.set('tab','avoid')
    router.push(`/journey/basic-config?${qs.toString()}`)
  }
  const goCheckout = () => router.push('/journey/summary') // stub

  return (
    <div className="container mx-auto px-4 pb-16 pt-24 md:pt-28 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-2">Add-ons</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Mejorá tu experiencia con servicios extra. Precios orientativos LATAM. ({logistics.pax||1} viajeros)
        </p>

        <SelectedAddonsChips />

        <AddonsGallery />

        <div className="mt-6 flex items-center justify-between">
          <button onClick={backToAvoid} className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50">
            Volver a filtros
          </button>
          <button onClick={goCheckout} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500">
            Continuar a checkout
          </button>
        </div>
      </div>

      <aside><SummaryCard /></aside>
    </div>
  )
}
