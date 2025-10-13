'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Minus, Plus, Check } from 'lucide-react';
import type { Addon } from '@/data/addons-catalog';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/button';

// Helper simple para clases
const cn = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ');

type Props = {
  addon: Addon;
  active?: boolean;
  onClick?: () => void;
};

export default function AnimatedDeckCard({ addon, active, onClick }: Props) {
  const { addons, setAddon, removeAddon, logistics, level } = useStore();
  const sel = addons.selected.find((s) => s.id === addon.id);

  const [qty, setQty] = useState(sel?.qty || 0);

  // Re-sincroniza controles al cambiar de add-on
  useEffect(() => {
    setQty(sel?.qty || 0);
  }, [sel, addon.id]);

  const inc = () => {
    const newQty = qty + 1;
    setQty(newQty);
    // Auto-add when incrementing from 0
    setAddon({ id: addon.id, qty: newQty });
  };

  const dec = () => {
    const newQty = Math.max(0, qty - 1);
    setQty(newQty);
    if (newQty === 0) {
      // Remove addon when quantity reaches 0
      removeAddon(addon.id);
    } else {
      // Update addon quantity
      setAddon({ id: addon.id, qty: newQty });
    }
  };

  const handleAddPerTrip = () => {
    if (isSelected) {
      removeAddon(addon.id);
      setQty(0);
    } else {
      setAddon({ id: addon.id, qty: 1 });
      setQty(1);
    }
  };

  const pax = logistics.pax || 1;
  const isSelected = !!sel;

  // Check if addon applies to current level
  const isAvailableForLevel = addon.applyToLevel.includes(level);

  return (
    <div
      className={cn(
        'border border-gray-200 rounded-lg overflow-hidden bg-white',
        !isAvailableForLevel && 'opacity-50',
      )}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onClick}
        disabled={!isAvailableForLevel}
        aria-expanded={active}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          active ? 'bg-gray-50' : '',
          !isAvailableForLevel && 'cursor-not-allowed',
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <h4 className="font-semibold text-neutral-900">{addon.title}</h4>
            <p className="text-sm text-neutral-600 mt-0.5">
              {addon.shortDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-900">
            {addon.priceType === 'currency'
              ? `USD ${addon.price}`
              : `${addon.price}%`}
          </span>
          <motion.div
            animate={{ rotate: active ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-neutral-500" />
          </motion.div>
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {active && isAvailableForLevel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-100 space-y-4 flex justify-between items-center">
              <p className="text-sm text-neutral-600 m-0 p-0">
                {addon.longDescription}{' '}
                {addon.type === 'perPax'
                  ? 'Se cobra por pasajero'
                  : 'Se cobra por viaje'}
              </p>

              {/* Quantity Controls - perPax shows quantity selector, perTrip shows add button */}
              {addon.type === 'perPax' ? (
                <div className="flex flex-col items-center gap-3 justify-between">
                  <label className="block text-sm font-medium text-neutral-700">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={dec}
                      className="h-8 w-8 rounded-sm border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-3 h-4" />
                    </button>
                    <span className="text-lg font-medium min-w-[3ch] text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={inc}
                      className="h-8 w-8 rounded-sm border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={handleAddPerTrip}
                    className={cn(
                      'px-6 py-2 transition-colors',
                      isSelected
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-primary text-white hover:bg-primary/90',
                    )}
                  >
                    {isSelected ? 'Quitar' : 'Agregar'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
