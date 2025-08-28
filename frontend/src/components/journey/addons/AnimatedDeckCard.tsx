'use client'
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion'
import { Addon } from '@/data/addons-catalog'

// Simple cn helper if not available globally
const cn = (...c: (string|false|undefined)[]) => c.filter(Boolean).join(' ')

type Props = {
  addon: Addon
  active?: boolean
  onClick?: () => void
}

export default function AnimatedDeckCard({ addon, active, onClick }: Props) {
  const prefersReduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rX = useTransform(my, [-0.5, 0.5], [8, -8])     // rotación vertical
  const rY = useTransform(mx, [-0.5, 0.5], [-8, 8])     // rotación horizontal
  const rx = useSpring(rX, { stiffness: 180, damping: 18 })
  const ry = useSpring(rY, { stiffness: 180, damping: 18 })

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (prefersReduced) return
    const el = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - el.left) / el.width - 0.5   // -0.5..0.5
    const py = (e.clientY - el.top) / el.height - 0.5
    mx.set(px)
    my.set(py)
  }
  function onLeave() { mx.set(0); my.set(0) }

  return (
    <motion.button
      type="button"
      onPointerMove={onPointerMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative overflow-hidden rounded-2xl ring-1 ring-neutral-200 bg-white aspect-[4/5] p-4 text-left shadow-sm",
        "transition will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        active && "ring-2 ring-violet-400"
      )}
      style={{
        transform: prefersReduced
          ? undefined
          : (`perspective(900px) rotateX(${rx.get()}deg) rotateY(${ry.get()}deg) translateZ(0)`)
      }}
      initial={{ opacity: 0, y: 16, rotateZ: -0.3 }}
      whileInView={{ opacity: 1, y: 0, rotateZ: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={prefersReduced ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      {/* “Stack” de cartas de colores detrás */}
      <motion.div
        className="pointer-events-none absolute -right-4 -bottom-3 w-24 h-24 rounded-xl bg-gradient-to-tr from-violet-200 to-emerald-200 rotate-[14deg] opacity-40"
        whileHover={prefersReduced ? {} : { x: 4, y: 4, opacity: 0.55 }}
      />
      <motion.div
        className="pointer-events-none absolute -right-10 -bottom-10 w-28 h-28 rounded-xl bg-gradient-to-tr from-orange-200 to-pink-200 rotate-[18deg] opacity-30"
        whileHover={prefersReduced ? {} : { x: 8, y: 8, opacity: 0.45 }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 -bottom-16 w-32 h-32 rounded-xl bg-gradient-to-tr from-sky-200 to-fuchsia-200 rotate-[22deg] opacity-25"
        whileHover={prefersReduced ? {} : { x: 12, y: 12, opacity: 0.4 }}
      />

      {/* Sheen / brillo siguiendo el puntero */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            prefersReduced
              ? undefined
              : `radial-gradient(600px circle at calc(${mx.get() + 0.5}*100%) calc(${my.get() + 0.5}*100%), rgba(255,255,255,0.25), transparent 40%)`
        }}
      />

      {/* Contenido */}
      <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 border border-neutral-200">
        {addon.category}
      </span>
      <div className="mt-3">
        <h4 className="font-semibold leading-snug">{addon.title}</h4>
        <p className="text-sm text-neutral-600 mt-1">{addon.short}</p>
      &lt;/div&gt;
      <div className="absolute left-4 bottom-4 text-sm font-medium">
        {addon.unit === 'percent_total' ? '15% del subtotal' : `desde USD ${addon.priceUsd}`}
      &lt;/div&gt;
    &lt;/motion.button&gt;
  )
}
