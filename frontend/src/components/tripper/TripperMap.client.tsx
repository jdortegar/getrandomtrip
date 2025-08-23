"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { VisitedPlace } from "@/content/trippers";
import { fixLeafletIcons } from "@/lib/fixLeafletIcons";

type Props = {
  places: VisitedPlace[];
  className?: string;
  height?: number | string;
};

export default function TripperMap({ places, className, height = 420 }: Props) {
  useEffect(() => fixLeafletIcons(), []);

  const bounds = useMemo(() => {
    const pts = places.map(p => [p.lat, p.lng]) as [number, number][];
    return pts.length ? L.latLngBounds(pts) : undefined;
  }, [places]);

  return (
    <div className={className} style={{ height, borderRadius: 12, overflow: "hidden" }}>
      <MapContainer
        style={{ height: "100%", width: "100%" }}
        center={bounds ? bounds.getCenter() : [20, 0]}
        zoom={bounds ? 4 : 2}
        scrollWheelZoom
        worldCopyJump
        attributionControl
        preferCanvas
      >
        <TileLayer
          // OSM libre; si luego queremos Mapbox, lo cambiamos por token
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
        />
        <MarkerClusterGroup chunkedLoading>
          {places.map((p) => (
            <Marker key={p.label} position={[p.lat, p.lng]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{p.label}</div>
                  {(p.lastTrip || p.trips) && (
                    <div className="text-xs text-neutral-500">
                      {p.lastTrip ? `Último viaje: ${p.lastTrip}` : null}
                      {p.lastTrip && p.trips ? ' · ' : null}
                      {p.trips ? `Nº de viajes: ${p.trips}` : null}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}