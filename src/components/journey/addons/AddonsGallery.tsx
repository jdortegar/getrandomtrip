// frontend/src/components/journey/addons/AddonsGallery.tsx
'use client'

import { useMemo, useState, useRef } from 'react'
import { ADDONS, Addon } from '@/data/addons-catalog'
import AddonDetail from './AddonDetail'
import AnimatedDeckCard from './AnimatedDeckCard'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'

export default function AddonsGallery() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [seed, setSeed] = useState(0) // para shuffle

  const grouped = useMemo(() => {
    // shuffle estable por seed
    const arr = [...ADDONS].sort((a, b) => {
      const ka = (a.id + b.id + seed).length % 7
      const kb = (b.id + a.id + seed).length % 7
      return ka - kb
    })
    const m: Record<string, Addon[]> = {}
    arr.forEach((a) => (m[a.category] ??= []).push(a))
    return m
  }, [seed])

  const categories = Object.keys(grouped)

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  } as const;

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  } as const;

  // Parallax suave del panel de detalle
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ['start 0.9', 'end 0.1'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -32])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      {/* izquierda: grilla / deck */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Elegí tus add-ons</h2>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="text-sm px-3 py-1 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50"
          >
            Shuffle
          </button>
        </div>

        {categories.map((cat) => (
          <section key={cat}>
            <h3 className="mb-3 text-base font-semibold">{cat}</h3>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {grouped[cat].map((a) => (
                <motion.div key={a.id} variants={item}>
                  <AnimatedDeckCard
                    addon={a}
                    active={activeId === a.id}
                    onClick={() => setActiveId(a.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        ))}
      </div>

      {/* derecha: panel de detalle con parallax */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={panelRef}
          key={activeId ?? 'empty'}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ type: 'spring', stiffness: 150, damping: 16 }}
          style={{ y: parallaxY }}
          className="xl:sticky xl:top-24"
        >
          <AddonDetail activeId={activeId} onClose={() => setActiveId(null)} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
