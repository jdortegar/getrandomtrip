// frontend/src/components/journey/addons/AddonsGallery.tsx
'use client';

import { useMemo, useState } from 'react';
import { ADDONS, Addon } from '@/lib/data/shared/addons-catalog';
import AnimatedDeckCard from './AnimatedDeckCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useStore } from '@/store/store';

export default function AddonsGallery() {
  const { level } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [seed] = useState(0); // para shuffle

  const grouped = useMemo(() => {
    // Filter addons by current level and prePurchase only
    const availableAddons = ADDONS.filter(
      (addon) =>
        addon.applyToLevel.includes(level) &&
        addon.purchaseType === 'prePurchase',
    );

    // shuffle estable por seed
    const arr = [...availableAddons].sort((a, b) => {
      const ka = (a.id + b.id + seed).length % 7;
      const kb = (b.id + a.id + seed).length % 7;
      return ka - kb;
    });
    const m: Record<string, Addon[]> = {};
    arr.forEach((a) => (m[a.category] ??= []).push(a));
    return m;
  }, [seed, level]);

  const categories = Object.keys(grouped);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="font-jost space-y-4" data-testid="addons-gallery">
      <div className="rt-container py-6">
        <p className="text-center text-gray-600 italic text-lg">
          Elegí tus add-ons
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const isOpen = openCategories.has(cat);
          return (
            <div
              key={cat}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <h3 className="text-base font-semibold text-neutral-900">
                  {cat}
                  <span className="ml-2 text-sm text-neutral-500 font-normal">
                    ({grouped[cat].length})
                  </span>
                </h3>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-neutral-500" />
                </motion.div>
              </button>

              {/* Category Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3 border-t border-gray-100">
                      {grouped[cat].map((addon) => (
                        <AnimatedDeckCard
                          key={addon.id}
                          addon={addon}
                          active={activeId === addon.id}
                          onClick={() =>
                            setActiveId(activeId === addon.id ? null : addon.id)
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
