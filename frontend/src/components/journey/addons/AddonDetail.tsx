'use client'

import { useEffect, useMemo, useState } from 'react'
import { ADDONS } from '@/data/addons-catalog'
import { useJourneyStore } from '@/store/journeyStore'
import { X, Minus, Plus } from 'lucide-react'

export default function AddonDetail({
  activeId,
  onClose,
}: {
  activeId: string | null
  onClose: () => void
}) {
  const { addons, setAddon, removeAddon, logistics } = useJourneyStore()
  const sel = addons.selected.find((s) => s.id === activeId)

  const [qty, setQty] = useState(sel?.qty || 1)
  const [opt, setOpt] = useState<string | undefined>(sel?.optionId)

  const addon = useMemo(() => ADDONS.find((a) => a.id === activeId), [activeId])

  // Re-sincroniza controles al cambiar de add-on
  useEffect(() => {
    setQty(sel?.qty || 1)
    setOpt(sel?.optionId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  if (!addon) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-600">
        Elegí un add-on a la izquierda para ver detalles.
      </div>
    )
  }

  const inc = () => setQty((q) => q + 1)
  const dec = () => setQty((q) => Math.max(1, q - 1))
  const pax = logistics.pax || 1

  const add = () => setAddon({ id: addon.id, qty, optionId: opt })
  const remove = () => {
    removeAddon(addon.id)
    onClose()
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-neutral-900">
          <h3 className="text-lg font-semibold">{addon.title}</h3>
          <p className="text-sm text-neutral-600">{addon.description}</p>
        </div>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-neutral-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Opciones (si aplica) */}
      {addon.options?.length ? (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-neutral-900">Opciones</div>
          <div className="flex flex-wrap gap-2">
            {addon.options.map((o) => (
              <label
                key={o.id}
                className={`px-3 py-1 rounded-full border cursor-pointer ${
                  opt === o.id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={`opt-${addon.id}`}
                  value={o.id}
                  checked={opt === o.id}
                  onChange={() => setOpt(o.id)}
                />
                {o.label}
                {o.deltaUsd ? ` (+USD ${o.deltaUsd})` : ''}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* Cantidad (no aplica a percent_total / 15%) */}
      {addon.unit !== 'percent_total' && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-900">Cantidad</span>
          <div className="inline-flex items-center rounded-lg border border-neutral-300">
            <button onClick={dec} className="p-2" aria-label="Disminuir">
              <Minus size={16} />
            </button>
            <span className="px-4 text-neutral-900">{qty}</span>
            <button onClick={inc} className="p-2" aria-label="Aumentar">
              <Plus size={16} />
            </button>
          </div>
          {addon.unit === 'per_pax' && (
            <span className="text-sm text-neutral-500">x {pax} pax</span>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        {sel ? (
          <>
            <button
              onClick={remove}
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800"
            >
              Quitar
            </button>
            <button
              onClick={add}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500"
            >
              Actualizar
            </button>
          </>
        ) : (
          <button
            onClick={add}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500"
          >
            Agregar
          </button>
        )}
      </div>
    </div>
  )
}