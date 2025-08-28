'use client'
import { useMemo, useState } from 'react'
import { ADDONS, Addon } from '@/data/addons-catalog'
import AddonDetail from './AddonDetail'
import AnimatedDeckCard from './AnimatedDeckCard'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddonsGallery(){
  const [activeId, setActiveId] = useState<string | null>(null)
  const [seed, setSeed] = useState(0) // para shuffle simple

  const grouped = useMemo(() => {
    // shuffle estable por seed
    const arr = [...ADDONS].sort((a,b)=> ((a.id+b.id+seed).length % 7) - ((b.id+a.id+seed).length % 7))
    const m: Record<string,Addon[]> = {}
    arr.forEach(a => (m[a.category] ??= []).push(a))
    return m
  }, [seed])

  const categories = Object.keys(grouped)

  const container = { hidden:{}, show:{ transition:{ staggerChildren: 0.05 } } }
  const item = { hidden:{ opacity:0, y:12 }, show:{ opacity:1, y:0 } }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      {/* left */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Elegí tus add-ons</h2>
          <button onClick={()=>setSeed(s=>s+1)} className="text-sm px-3 py-1 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50">
            Shuffle
          </button>
        </div>

        {categories.map(cat => (
          <section key={cat}>
            <h3 className="mb-3 text-base font-semibold">{cat}</h3>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {grouped[cat].map(a => (
                <motion.div key={a.id} variants={item}>
                  <AnimatedDeckCard addon={a} active={activeId===a.id} onClick={()=>setActiveId(a.id)} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        ))}
      &lt;/div&gt;

      {/* right detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId ?? 'empty'}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ type:'spring', stiffness: 150, damping: 16 }}
          className="xl:sticky xl:top-24"
        >
          <AddonDetail activeId={activeId} onClose={()=>setActiveId(null)} />
        </motion.div>
      </AnimatePresence>
    &lt;/div&gt;
  )
}