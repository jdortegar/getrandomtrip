'use client'

import { Plus } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Link from 'next/link'

export default function EmptyState({ title, ctaHref }: { title: string; ctaHref: string }) {
  return (
    <GlassCard>
      <div className="p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-600">{title}</div>
          <div className="text-xs text-neutral-500">Guarda favoritos o comienza un plan.</div>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 text-white px-4 py-2 hover:bg-violet-500"
        >
          <Plus size={16}/> Ver productos
        </Link>
      </div>
    </GlassCard>
  )
}
