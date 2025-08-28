'use client'
import { useJourneyStore } from '@/store/journeyStore'
import { ADDONS } from '@/data/addons-catalog'
import { X } from 'lucide-react'

export default function SelectedAddonsChips(){
  const { addons, removeAddon } = useJourneyStore()
  if (!addons.selected.length) return null
  return (
    <div className="mb-4 rounded-xl bg-neutral-50 ring-1 ring-neutral-200 p-3">
      <div className="text-sm font-medium text-neutral-700 mb-2">Tus add-ons ({addons.selected.length})</div>
      <div className="flex flex-wrap gap-2">
        {addons.selected.map(s=>{
          const a = ADDONS.find(x=>x.id===s.id)
          if(!a) return null
          return (
            <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-violet-50 text-violet-800 border border-violet-200">
              {a.title}{s.qty>1?` ×${s.qty}`:''}
              <button onClick={()=>removeAddon(s.id)} className="ml-1 -mr-1 rounded p-0.5 hover:bg-violet-200" aria-label={`Quitar ${a.title}`}>
                <X size={14}/>
              </button>
            </span>
          )
        })}
      </div>
    &lt;/div&gt;
  )
}
