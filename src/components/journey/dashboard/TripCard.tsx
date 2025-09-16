'use client'

import Image from 'next/image'
import { Trip } from './types'
import { ExternalLink } from 'lucide-react'

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <div className="rounded-xl ring-1 ring-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_320px] gap-0">
        <div className="p-4">
          <div className="text-xs text-neutral-500">
            {trip.status === 'upcoming' ? 'Próximo' : trip.status === 'past' ? 'Completado' : 'Cancelado'}
          </div>
          <div className="mt-1 text-base font-semibold text-neutral-900">{trip.title}</div>
          {trip.subtitle && <div className="text-sm text-neutral-600">{trip.subtitle}</div>}

          <div className="mt-2 text-sm text-neutral-700">
            {trip.city ? `${trip.city}${trip.country ? `, ${trip.country}` : ''}` : '—'}
          </div>
          <div className="text-sm text-neutral-600">
            {trip.startISO} — {trip.endISO}
          </div>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
          >
            Ver detalles <ExternalLink size={16}/>
          </button>
        </div>

        <div className="relative h-44 sm:h-full">
          {trip.coverUrl ? (
            <Image src={trip.coverUrl} alt={trip.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
          )}
        </div>
      </div>
    </div>
  )
}
