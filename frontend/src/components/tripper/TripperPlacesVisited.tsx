"use client";

import TripperMap from "./TripperMap.client";
import type { Tripper } from "@/content/trippers";

export default function TripperPlacesVisited({ tripper }: { tripper: Tripper }) {
  if (!tripper.placesVisited?.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10" id="places-visited">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold">Places Visited</h2>
        {/* opcional: botón "Ver Contacto"/CTA */}
      </div>

      {/* Mapa */}
      <TripperMap places={tripper.placesVisited} />

      {/* Lista al lado o debajo (responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <ul className="space-y-2">
          {tripper.placesVisited.map(p => (
            <li key={p.id} className="text-sm">
              <span className="font-medium">{p.label}</span>, {p.country}
              {p.lastTripYear || p.tripsCount ? (
                <span className="text-neutral-500">
                  {" "}
                  ({p.lastTripYear ? `Last Trip: ${p.lastTripYear}` : ""}
                  {p.lastTripYear && p.tripsCount ? "; " : ""}
                  {p.tripsCount ? `Trips: ${p.tripsCount}` : ""})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}