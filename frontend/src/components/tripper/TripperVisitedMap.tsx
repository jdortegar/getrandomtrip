'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { Map as LeafletMap, LatLngBounds } from 'leaflet';

type Place = {
  id?: string | number;
  name?: string;
  label?: string;
  lat: number;
  lng: number;
};

export default function TripperVisitedMap({ places = [] as Place[] }: { places?: Place[] }) {
  // Fallback sin lugares
  if (!Array.isArray(places) || places.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-700">
          Aún no hay lugares visitados para mostrar.
        </div>
      </section>
    );
  }

  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const defaultZoom = 10;

  // Fix de iconos de Leaflet (opcional, silencioso)
  useEffect(() => {
    (async () => {
      try {
        const mod = await import('@/lib/fixLeafletIcons');
        if (mod?.default) mod.default();
      } catch {
        // no-op si no existe el helper
      }
    })();
  }, []);

  // Bounds memorizados para 2+ puntos
  const bounds: LatLngBounds | null = useMemo(() => {
    if (!Array.isArray(places) || places.length < 2) return null;
    return L.latLngBounds(places.map(p => [p.lat, p.lng] as [number, number]));
  }, [places]);

  // Centro inicial (no crítico; el ajuste real lo hace whenCreated/effect)
  const initialCenter: [number, number] =
    places.length > 0 ? [places[0].lat, places[0].lng] : [0, 0];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Lista breve para navegación (si la necesitas) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {places.map((p, i) => {
          const key = String(p.id ?? `${p.lat},${p.lng},${i}`);
          return (
            <button
              key={key}
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 transition"
              onClick={() => {
                const m = mapRef.current;
                if (!m) return;
                m.flyTo([p.lat, p.lng], Math.max(m.getZoom(), defaultZoom), { duration: 0.8 });
                markersRef.current[key]?.openPopup();
              }}
            >
              {p.name || p.label || `Lugar ${i + 1}`}
            </button>
          );
        })}
      </div>

      <div className="h-96 md:h-[480px] w-full overflow-hidden rounded-xl border">
        <MapContainer
          center={initialCenter}
          zoom={defaultZoom}
          scrollWheelZoom
          className="h-full w-full"
          whenCreated={(m) => {
            mapRef.current = m;
            if (!Array.isArray(places) || places.length === 0) return;
            if (places.length === 1) {
              const p = places[0];
              m.flyTo([p.lat, p.lng], defaultZoom, { duration: 0.8 });
            } else if (bounds) {
              m.fitBounds(bounds, { padding: [32, 32] });
            }
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {places.map((p, i) => {
            const key = String(p.id ?? `${p.lat},${p.lng},${i}`);
            return (
              <Marker
                key={key}
                position={[p.lat, p.lng]}
                ref={(mk) => {
                  // Guardamos ref para abrir popups desde la lista
                  // @ts-expect-error react-leaflet typings
                  if (mk) markersRef.current[key] = mk;
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{p.name || p.label || `Lugar ${i + 1}`}</strong>
                    <div className="text-gray-600">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}