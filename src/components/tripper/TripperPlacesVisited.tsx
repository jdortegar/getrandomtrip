"use client";

import TripperMap from "./TripperMap.client";
import type { Tripper } from "@/content/trippers";

export default function TripperPlacesVisited({ tripper }: { tripper: Tripper }) {
  const places = tripper.visitedPlaces;
  if (!places?.length) return null;

  return (
    <section className="rt-container px-4 md:px-8 py-10" id="places-visited">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold">Places Visited</h2>
      </div>

      {/* Mapa */}
      <TripperMap places={places} />

      {/* Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <ul className="space-y-2">
          {places.map((p) => (
            <li key={p.label} className="text-sm">
              <span className="font-medium">{p.label}</span>
              {(p.lastTrip || p.trips) ? (
                <span className="text-neutral-500">
                  {" "}
                  ({p.lastTrip ? `Last Trip: ${p.lastTrip}` : ""}
                  {p.lastTrip && p.trips ? "; " : ""}
                  {p.trips ? `Trips: ${p.trips}` : ""})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}