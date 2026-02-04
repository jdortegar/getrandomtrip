'use client';

import { Bus, Plane, Ship, Train } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

export const TRANSPORT_ICONS: Record<string, typeof Plane> = {
  avion: Plane,
  barco: Ship,
  bus: Bus,
  tren: Train,
};

export const TRANSPORT_OPTIONS = [
  { id: 'avion', label: 'Avión' },
  { id: 'barco', label: 'Barco' },
  { id: 'bus', label: 'Bus' },
  { id: 'tren', label: 'Tren' },
] as const;

export const DEFAULT_TRANSPORT_ORDER: string[] = [
  'avion',
  'tren',
  'bus',
  'barco',
];

interface TransportSelectorProps {
  onChange: (orderedIds: string[]) => void;
  value: string[];
}

function TransportSelector({ onChange, value }: TransportSelectorProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const orderedOptions =
    value.length === TRANSPORT_OPTIONS.length
      ? value
      : DEFAULT_TRANSPORT_ORDER;
  const optionsById = Object.fromEntries(
    TRANSPORT_OPTIONS.map((o) => [o.id, o]),
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
          return (
            <div
              className={cn(
                'flex min-w-[100px] cursor-grab flex-col items-center justify-center gap-2 rounded-xl border-2 py-4 px-5 transition-colors active:cursor-grabbing',
                isFirst
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : 'border-gray-300 bg-white text-gray-600',
                isDragging && 'opacity-50',
                isDragOver && 'ring-2 ring-primary ring-offset-2',
              )}
              draggable
              key={id}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragStart={(e) => handleDragStart(e, id)}
              onDrop={(e) => handleDrop(e, id)}
              role="button"
              tabIndex={0}
              aria-label={`${option.label}, preferencia ${index + 1}. Arrastrar para reordenar.`}
            >
              <Icon
                className={isFirst ? 'text-white' : 'text-gray-500'}
                size={36}
              />

              <span className="text-center text-sm font-medium">
                {option.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 text-center">
        No es una sola opción: ordená del 1 al 4 según tu preferencia. Según el
        destino podríamos usar otra opción de la lista.
      </p>
      <p className="text-sm text-gray-500 text-center">
        Tren y Barco podrían requerir traslados extra.
      </p>
    </div>
  );
}

export default TransportSelector;
