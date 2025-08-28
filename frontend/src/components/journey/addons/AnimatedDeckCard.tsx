'use client'

import React, { useEffect } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
  useInView,
  animate,
} from 'framer-motion'
import type { Addon } from '@/data/addons-catalog'

// Helper simple para clases
const cn = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ')

type Props = {
  addon: Addon
  active?: boolean
  onClick?: () => void
}

export default function AnimatedDeckCard({ addon, active, onClick }: Props) {
  const prefersReduced = useReducedMotion()

  // Tilt 3D
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rX = useTransform(my, [-0.5, 0.5], [8, -8])
  const rY = useTransform(mx, [-0.5, 0.5], [-8, 8])
  const rx = useSpring(rX, { stiffness: 180, damping: 18 })
  const ry = useSpring(rY, { stiffness: 180, damping: 18 })

  // Autotilt al entrar en viewport
  const ref = React.useRef<HTMLButtonElement | null>(null)
  const inView = useInView(ref, { amount: 0.3, once: true })
  useEffect(() => {
    if (prefersReduced || !inView) return
    const a1 = animate(my, [-0.12, 0.1, 0], { duration: 1.2, ease: 'easeInOut' })
    const a2 = animate(mx, [0.14, -0.08, 0], { duration: 1.2, ease: 'easeInOut' })
    return () => {
      a1.stop()
      a2.stop()
    }
  }, [inView, prefersReduced, mx, my])

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (prefersReduced) return
    const el = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - el.left) / el.width - 0.5
    const py = (e.clientY - el.top) / el.height - 0.5
    mx.set(px)
    my.set(py)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onPointerMove={onPointerMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        'group relative overflow-hidden rounded-2xl ring-1 ring-neutral-200 bg-white aspect-[4/5] p-4 text-left shadow-sm',
        'transition will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        active ? 'ring-2 ring-violet-400' : ''
      )}
      style={{
        transform: prefersReduced
          ? undefined
          : `perspective(900px) rotateX(${rx.get()}deg) rotateY(${ry.get()}deg) translateZ(0)`,
      }}
      initial={{ opacity: 0, y: 16, rotateZ: -0.3 }}
      whileInView={{ opacity: 1, y: 0, rotateZ: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={prefersReduced ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      {/* “Stack” de color detrás */}
      <div className="pointer-events-none absolute -right-4 -bottom-3 w-24 h-24 rounded-xl bg-gradient-to-tr from-violet-200 to-emerald-200 rotate-[14deg] opacity-40" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 w-28 h-28 rounded-xl bg-gradient-to-tr from-orange-200 to-pink-200 rotate-[18deg] opacity-30" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 w-32 h-32 rounded-xl bg-gradient-to-tr from-sky-200 to-fuchsia-200 rotate-[22deg] opacity-25" />

      <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 border border-neutral-200">
        {addon.category}
      </span>

      <div className="mt-3">
        <h4 className="font-semibold leading-snug text-neutral-900">
          {addon.title}
        </h4>
        <p className="text-sm text-neutral-600 mt-1">{addon.short}</p>
      </div>

      <div className="absolute left-4 bottom-4 text-sm font-medium text-neutral-900">
        {addon.unit === 'percent_total'
          ? '15% del subtotal'
          : `desde USD ${addon.priceUsd}`}
      </div>
    </motion.button>
  )
}