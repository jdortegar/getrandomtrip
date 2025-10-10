'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Minus, Plus, Check } from 'lucide-react';
import type { Addon } from '@/data/addons-catalog';
import { useStore } from '@/store/store';

// Helper simple para clases
const cn = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(' ');

type Props = {
  addon: Addon;
  active?: boolean;
  onClick?: () => void;
};

export default function AnimatedDeckCard({ addon, active, onClick }: Props) {
  const { addons, setAddon, removeAddon, logistics } = useStore();
  const sel = addons.selected.find((s) => s.id === addon.id);

  const [qty, setQty] = useState(sel?.qty || 0);
  const [opt, setOpt] = useState<string | undefined>(sel?.optionId);

  // Re-sincroniza controles al cambiar de add-on
  useEffect(() => {
    setQty(sel?.qty || 0);
    setOpt(sel?.optionId);
  }, [sel, addon.id]);

  // Set default "Incluido" option when component mounts
  useEffect(() => {
    if (!sel?.optionId && addon.options && addon.options.length > 0) {
      const includedOption = addon.options.find(
        (option) => !option.deltaUsd || option.deltaUsd === 0,
      );
      if (includedOption) {
        setOpt(includedOption.id);
      }
    }
  }, [addon.options, sel?.optionId]);

  const inc = () => {
    const newQty = qty + 1;
    setQty(newQty);

    // Auto-select "Incluido" option if no option is selected and there are options
    let selectedOptionId = opt;
    if (!selectedOptionId && addon.options && addon.options.length > 0) {
      const includedOption = addon.options.find(
        (option) => !option.deltaUsd || option.deltaUsd === 0,
      );
      selectedOptionId = includedOption?.id || addon.options[0].id;
      setOpt(selectedOptionId);
    }

    // Auto-add when incrementing from 0
    setAddon({ id: addon.id, qty: newQty, optionId: selectedOptionId });
  };

  const dec = () => {
    const newQty = Math.max(0, qty - 1);
    setQty(newQty);
    if (newQty === 0) {
      // Remove addon when quantity reaches 0
      removeAddon(addon.id);
    } else {
      // Update addon quantity
      setAddon({ id: addon.id, qty: newQty, optionId: opt });
    }
  };

  const pax = logistics.pax || 1;

  const handleOptionChange = (optionId: string) => {
    setOpt(optionId);
    // Auto-update if addon is already selected
    if (qty > 0) {
      setAddon({ id: addon.id, qty, optionId });
    }
  };

  const isSelected = !!sel;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={onClick}
        aria-expanded={active}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          'hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          active ? 'bg-gray-50' : '',
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <h4 className="font-semibold text-neutral-900">{addon.title}</h4>
            <p className="text-sm text-neutral-600 mt-0.5">{addon.short}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-900">
            {addon.unit === 'percent_total'
              ? '15% del subtotal'
              : `desde USD ${addon.priceUsd}`}
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
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4  border-t border-gray-100 space-y-4">
              <p className="text-sm text-neutral-600">{addon.description}</p>

              {/* Options */}
              {addon.options && addon.options.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Opciones:
                  </label>
                  <div className="space-y-2">
                    {addon.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionChange(option.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-md border transition-colors text-left',
                          opt === option.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300',
                        )}
                      >
                        <span className="text-sm text-neutral-700">
                          {option.label}
                        </span>
                        <span className="text-sm font-medium text-neutral-900">
                          {option.deltaUsd
                            ? `+USD ${option.deltaUsd}`
                            : 'Incluido'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {addon.unit === 'per_pax' && logistics.pax === 1 ? null : (
                <div className="flex items-center gap-3 justify-between">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Cantidad{addon.unit === 'per_pax' && ` (por ${pax} pax)`}:
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
