'use client';

import { Bus, Plane, Ship, Train } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { normalizeTransportId } from '@/lib/helpers/transport';

export const TRANSPORT_ICONS: Record<string, typeof Plane> = {
  plane: Plane,
  ship: Ship,
  bus: Bus,
  train: Train,
};

export const TRANSPORT_OPTIONS = [
  { id: 'bus', label: 'Bus' },
  { id: 'plane', label: 'Plane' },
  { id: 'ship', label: 'Ship' },
  { id: 'train', label: 'Train' },
] as const;

export const DEFAULT_TRANSPORT_ORDER: string[] = [
  'plane',
  'train',
  'bus',
  'ship',
];

const DEFAULT_OPTION_LABELS: Record<string, string> = {
  bus: 'Bus',
  plane: 'Plane',
  ship: 'Ship',
  train: 'Train',
};

export interface TransportSelectorLabels {
  ariaPreferenceTemplate: string;
  hintOrder: string;
  hintTransfers: string;
  optionLabels: Record<string, string>;
}

interface TransportSelectorProps {
  labels?: TransportSelectorLabels;
  onChange: (orderedIds: string[]) => void;
  value: string[];
}

function TransportSelector({ labels: labelsProp, onChange, value }: TransportSelectorProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const labels = {
    ariaPreferenceTemplate:
      labelsProp?.ariaPreferenceTemplate ??
      '{label}, preferencia {position}. Arrastrar para reordenar.',
    hintOrder:
      labelsProp?.hintOrder ??
      'No es una sola opción: ordená del 1 al 4 según tu preferencia. Según el destino podríamos usar otra opción de la lista.',
    hintTransfers:
      labelsProp?.hintTransfers ??
      'Tren y Barco podrían requerir traslados extra.',
    optionLabels: { ...DEFAULT_OPTION_LABELS, ...labelsProp?.optionLabels },
  };

  const orderedOptions =
    value.length === TRANSPORT_OPTIONS.length ? value : DEFAULT_TRANSPORT_ORDER;
  const optionsById = Object.fromEntries(
    TRANSPORT_OPTIONS.map((o) => [
      o.id,
      { id: o.id, label: labels.optionLabels[o.id] ?? o.label },
    ]),
  );

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/json', JSON.stringify({ id }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedId && draggedId !== id) setDragOverId(id);
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setDragOverId(null);
      const sourceId = e.dataTransfer.getData('text/plain');
      if (!sourceId || sourceId === targetId) return;
      const current = [...orderedOptions];
      const fromIndex = current.indexOf(sourceId);
      const toIndex = current.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return;
      current.splice(fromIndex, 1);
      current.splice(toIndex, 0, sourceId);
      onChange(current);
      setDraggedId(null);
    },
    [onChange, orderedOptions],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {orderedOptions.map((id, index) => {
          const option = optionsById[id];
          const Icon = TRANSPORT_ICONS[id];
          if (!option || !Icon) return null;
          const isFirst = index === 0;
          const isDragging = draggedId === id;
          const isDragOver = dragOverId === id;
          const ariaLabel = labels.ariaPreferenceTemplate
            .replace('{label}', option.label)
            .replace('{position}', String(index + 1));
          return (
            <div className="flex min-w-[100px] flex-col items-center gap-2" key={id}>
              <div
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 px-5 py-4 transition-colors',
                  isFirst
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-300 bg-white text-gray-600',
                )}
              >
                <Icon
                  className={isFirst ? 'text-white' : 'text-gray-500'}
                  size={36}
                />
                <span className="text-center text-sm font-medium">
                  {option.label}
                </span>
              </div>
              <div
                aria-label={ariaLabel}
                className={cn(
                  'flex h-9 w-9 cursor-grab items-center justify-center rounded-md border-2 bg-white text-sm font-semibold text-gray-700 transition-colors active:cursor-grabbing',
                  isDragging && 'opacity-50',
                  isDragOver
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-gray-300',
                )}
                draggable
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => handleDragOver(e, id)}
                onDragStart={(e) => handleDragStart(e, id)}
                onDrop={(e) => handleDrop(e, id)}
                role="button"
                tabIndex={0}
                title={ariaLabel}
              >
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-gray-500">
        {labels.hintOrder}
      </p>
      <p className="text-center text-sm text-gray-500">
        {labels.hintTransfers}
      </p>
    </div>
  );
}

export default TransportSelector;
