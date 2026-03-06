'use client';

import { useEffect, useMemo, useState } from 'react';
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

/** Normalize experience from URL/traveler-type id (e.g. exploraPlus) to catalog level id (e.g. explora-plus). */
function normalizeExperienceForCatalog(experience: string | undefined): string | undefined {
  if (!experience) return undefined;
  const normalized = experience
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace('explora+', 'explora-plus');
  if (normalized === 'exploraplus') return 'explora-plus';
  return normalized || undefined;
}

export interface AddonsSelectorProps {
  experience?: string;
  labels?: {
    addonLabels?: Record<
      string,
      {
        category: string;
        longDescription: string;
        shortDescription: string;
        title: string;
      }
    >;
    addonsClearButton?: string;
    addonsEmptyMessage?: string;
    addonsHint?: string;
    addonsSaveButton?: string;
  };
  onChange: (value: string | undefined) => void;
  onClear?: () => void;
  onSave?: () => void;
  value: string | undefined;
}

export function AddonsSelector({
  experience,
  labels: labelsProp,
  onChange,
  onClear,
  onSave,
  value,
}: AddonsSelectorProps) {
  const labels = {
    addonLabels: labelsProp?.addonLabels,
    addonsClearButton: labelsProp?.addonsClearButton ?? 'Borrar',
    addonsEmptyMessage:
      labelsProp?.addonsEmptyMessage ??
      'Completá tipo de viaje y experiencia para ver add-ons disponibles.',
    addonsHint:
      labelsProp?.addonsHint ??
      'Opcional. Sumá seguros, asientos o equipaje según tu nivel.',
    addonsSaveButton: labelsProp?.addonsSaveButton ?? 'Guardar Add-ons',
  };

  const groupedAddons = useMemo(() => {
    const list = ADDONS.filter((a) => a.purchaseType === 'prePurchase');
    const levelForCatalog = normalizeExperienceForCatalog(experience);
    const byLevel = levelForCatalog
      ? list.filter((a) => a.applyToLevel.includes(levelForCatalog))
      : list;
    const m: Record<string, typeof byLevel> = {};
    byLevel.forEach((a) => {
      if (!m[a.category]) m[a.category] = [];
      m[a.category].push(a);
    });
    return m;
  }, [experience]);

  const categories = Object.keys(groupedAddons);

  // Local state for immediate UI updates; sync from prop when URL/external value changes
  const [localValue, setLocalValue] = useState<string | undefined>(() => value ?? undefined);
  useEffect(() => {
    setLocalValue(value ?? undefined);
  }, [value]);

  const displayValue = localValue;
  const handleToggle = (addonId: string) => {
    const next = toggleCsv(displayValue, addonId);
    setLocalValue(next);
    onChange(next);
  };
  const handleClear = () => {
    setLocalValue(undefined);
    onChange(undefined);
    onClear?.();
  };
  const handleSave = () => {
    onChange(displayValue);
    onSave?.();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{labels.addonsHint}</p>
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">{labels.addonsEmptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              key={cat}
            >
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {labels.addonLabels?.[groupedAddons[cat][0]?.id]?.category ??
                    groupedAddons[cat][0]?.category ??
                    cat}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {groupedAddons[cat].map((addon) => {
                  const isSelected = (displayValue || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .includes(addon.id);
                  const title =
                    labels.addonLabels?.[addon.id]?.title ?? addon.title;
                  return (
                    <button
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition',
                        isSelected
                          ? 'border-gray-800 bg-gray-800 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
                      )}
                      key={addon.id}
                      onClick={() => handleToggle(addon.id)}
                      type="button"
                    >
                      <span>{title}</span>
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
              onClick={handleClear}
              type="button"
            >
              {labels.addonsClearButton}
            </button>
            <Button
              className="text-sm font-normal normal-case"
              onClick={handleSave}
              size="md"
              type="button"
              variant="default"
            >
              {labels.addonsSaveButton}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
