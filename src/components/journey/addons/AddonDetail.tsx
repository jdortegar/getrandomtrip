'use client';

import { useEffect, useMemo, useState } from 'react';
import { ADDONS } from '@/lib/data/shared/addons-catalog';
import { useStore } from '@/store/store';
import { X, Minus, Plus } from 'lucide-react';

export default function AddonDetail({
  activeId,
  onClose,
}: {
  activeId: string | null;
  onClose: () => void;
}) {
  const { addons, setAddon, removeAddon, logistics, level } = useStore();
  const sel = addons.selected.find((s) => s.id === activeId);

  const [qty, setQty] = useState(sel?.qty || 1);

  const addon = useMemo(
    () => ADDONS.find((a) => a.id === activeId),
    [activeId],
  );

  // Re-sincroniza controles al cambiar de add-on
  useEffect(() => {
    setQty(sel?.qty || 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  if (!addon) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-600">
        Elegí un add-on a la izquierda para ver detalles.
      </div>
    );
  }

  // Check if addon applies to current level
  const isAvailableForLevel = addon.applyToLevel.includes(level);

  const inc = () => setQty((q) => q + 1);
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const pax = logistics.pax || 1;

  const add = () => setAddon({ id: addon.id, qty });
  const remove = () => {
    removeAddon(addon.id);
    onClose();
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-neutral-900">
          <h3 className="text-lg font-semibold">{addon.title}</h3>
          <p className="text-sm text-neutral-600">{addon.shortDescription}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {addon.longDescription}
          </p>
        </div>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-neutral-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Price */}
      <div className="mt-4">
        <div className="text-sm font-medium text-neutral-900">Precio</div>
        <div className="text-lg font-semibold text-neutral-900">
          USD ${addon.price}
        </div>
      </div>

      {/* Cantidad */}
      {isAvailableForLevel && (
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
        </div>
      )}

      {!isAvailableForLevel && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Este add-on no está disponible para tu nivel actual ({level}).
          </p>
        </div>
      )}

      {isAvailableForLevel && (
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
      )}
    </div>
  );
}
