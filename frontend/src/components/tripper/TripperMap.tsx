// src/components/tripper/TripperMap.tsx
'use client';

/**
 * Componente placeholder para el mapa del tripper.
 * Evita romper el build mientras conectamos la versión con Leaflet.
 * Acepta props flexibles y no usa librerías externas.
 */

type Coord = { lat: number; lng: number; label?: string };
type TripperMapProps = {
  coords?: Coord[];
  title?: string;
  className?: string;
};

export default function TripperMap({ coords = [], title, className = '' }: TripperMapProps) {
  return (
    <section className={`w-full rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {title ?? 'Mapa de viajes'}
        </h3>
        <span className="text-sm text-slate-500">
          {coords.length > 0 ? `${coords.length} punto(s)` : 'Sin puntos para mostrar'}
        </span>
      </div>

      {/* Contenedor visual del mapa (placeholder) */}
      <div className="h-64 w-full rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200 flex items-center justify-center">
        <span className="text-slate-500">
          El mapa se renderizará aquí.
        </span>
      </div>

      {/* Lista simple de puntos (útil mientras conectamos Leaflet) */}
      {coords.length > 0 && (
        <ul className="mt-3 list-disc pl-6 text-sm text-slate-700">
          {coords.map((c, i) => (
            <li key={`${c.lat}-${c.lng}-${i}`}>
              {c.label ?? 'Punto'} — {c.lat.toFixed(3)}, {c.lng.toFixed(3)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
