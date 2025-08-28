'use client'
import { useMemo, useState } from 'react'
import { ADDONS, Addon } from '@/data/addons-catalog'
import AddonDetail from './AddonDetail'

export default function AddonsGallery(){
  const [activeId, setActiveId] = useState<string | null>(null)
  const grouped = useMemo(() => {
    const m: Record<string,Addon[]> = {}
    ADDONS.forEach(a => (m[a.category] ??= []).push(a))
    return m
  }, [])

  const categories = Object.keys(grouped)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      {/* Left: deck grid */}
      <div className="space-y-8">
        {categories.map(cat => (
          <section key={cat}>
            <h3 className="mb-3 text-lg font-semibold">{cat}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[cat].map(a => (
                <button
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className={`group relative overflow-hidden rounded-2xl ring-1 ring-neutral-200 bg-white aspect-[4/5] p-4 text-left shadow-sm transition
                            hover:-translate-y-0.5 hover:shadow-md ${activeId===a.id?'ring-violet-400 ring-2':''}`}
                >
                  {/* deck effect */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-xl bg-gradient-to-tr from-violet-200 to-emerald-200 rotate-12 opacity-40 group-hover:opacity-70" />
                  <div className="absolute -right-10 -bottom-10 w-24 h-24 rounded-xl bg-gradient-to-tr from-orange-200 to-pink-200 rotate-12 opacity-30" />
                  <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 border border-neutral-200">
                    {a.category}
                  </span>
                  <div className="mt-3">
                    <h4 className="font-semibold leading-snug">{a.title}</h4>
                    <p className="text-sm text-neutral-600 mt-1">{a.short}</p>
                  </div>
                  <div className="absolute left-4 bottom-4 text-sm font-medium">
                    {a.unit==='percent_total' ? '15% del subtotal' : `desde USD ${a.priceUsd}`}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      &lt;/div&gt;

      {/* Right: detail panel */}
      <div className="xl:sticky xl:top-24">
        <AddonDetail activeId={activeId} onClose={()=>setActiveId(null)} />
      &lt;/div&gt;
    &lt;/div&gt;
  )
}
