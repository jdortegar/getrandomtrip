'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { ADDONS, type Addon } from '@/lib/data/shared/addons-catalog';
import { cn } from '@/lib/utils';

function formatAddonPrice(addon: Addon): string {
  return addon.priceType === 'currency'
    ? `USD ${addon.price}`
    : `${addon.price}%`;
}

function toggleCsv(
  value: string | undefined,
  item: string,
): string | undefined {
  const cur = (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const has = cur.includes(item);
  const next = has ? cur.filter((x) => x !== item) : [...cur, item];
  return next.length ? next.join(',') : undefined;
}

export interface AddonsSelectorProps {
  experience?: string;
  onChange: (value: string | undefined) => void;
  onClear?: () => void;
  onSave?: () => void;
  value: string | undefined;
}

export function AddonsSelector({
  experience,
  onChange,
  onClear,
  onSave,
  value,
}: AddonsSelectorProps) {
  const groupedAddons = useMemo(() => {
    const list = ADDONS.filter((a) => a.purchaseType === 'prePurchase');
    const byLevel = experience
      ? list.filter((a) => a.applyToLevel.includes(experience))
      : list;
    const m: Record<string, typeof byLevel> = {};
    byLevel.forEach((a) => {
      if (!m[a.category]) m[a.category] = [];
      m[a.category].push(a);
    });
    return m;
  }, [experience]);

  const categories = Object.keys(groupedAddons);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Opcional. Sumá seguros, asientos o equipaje según tu nivel.
      </p>
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">
          Completá tipo de viaje y experiencia para ver add-ons disponibles.
        </p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              key={cat}
            >
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">{cat}</h3>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {groupedAddons[cat].map((addon) => {
                  const isSelected = (value || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .includes(addon.id);
                  return (
                    <button
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition',
                        isSelected
                          ? 'border-gray-800 bg-gray-800 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
                      )}
                      key={addon.id}
                      onClick={() => onChange(toggleCsv(value, addon.id))}
                      type="button"
                    >
                      <span>{addon.title}</span>
                      <span
                        className={cn(
                          'ml-1.5 opacity-90',
                          !isSelected && 'text-gray-500',
                        )}
                      >
                        ({formatAddonPrice(addon)})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-8 flex items-center justify-center gap-10 border-t border-gray-200 pt-6">
            <button
              className="text-sm font-medium text-gray-900 underline hover:no-underline"
              onClick={() => {
                onChange(undefined);
                onClear?.();
              }}
              type="button"
            >
              Borrar
            </button>
            <Button
              className="text-sm font-normal normal-case"
              onClick={onSave}
              size="md"
              type="button"
              variant="default"
            >
              Guardar Add-ons
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
