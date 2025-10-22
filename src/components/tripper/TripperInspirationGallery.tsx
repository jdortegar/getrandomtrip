'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import type { FeaturedTripCard } from '@/types/tripper';
import { getTierBadge, getTypeLabel } from '@/lib/constants/traveller-types';

interface TripperInspirationGalleryProps {
  trips: FeaturedTripCard[];
  tripperName: string;
}

export default function TripperInspirationGallery({
  trips,
  tripperName,
}: TripperInspirationGalleryProps) {
  const firstName = tripperName.split(' ')[0] || tripperName;

  if (!trips.length) return null;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-caveat text-4xl font-bold text-white md:text-5xl">
          Experiencias que {firstName} ha creado
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
          Inspírate con estos viajes sorpresa diseñados por {tripperName}
        </p>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => {
          const tierBadge = getTierBadge(trip.level);
          const typeLabel = getTypeLabel(trip.type);

          return (
            <div
              key={trip.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl transition hover:shadow-2xl"
            >
              {/* Image */}
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  alt={trip.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={trip.heroImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/30 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {typeLabel}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${tierBadge.color}`}
                  >
                    {tierBadge.label}
                  </span>
                </div>

                {/* Likes */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                  <Heart
                    className="h-4 w-4 text-rose-400"
                    fill="currentColor"
                  />
                  <span className="text-sm font-semibold text-white">
                    {trip.likes}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white">{trip.title}</h3>
                <p className="mt-2 text-sm text-white/70">{trip.teaser}</p>

                {/* Highlights */}
                {trip.highlights.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {trip.highlights.slice(0, 3).map((highlight, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-white/80"
                      >
                        <span className="mt-1 text-emerald-400">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Tags */}
                {trip.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trip.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Info */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-white/70">
                  <span>{trip.nights} noches</span>
                  <span>{trip.pax} personas</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transition Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-white/80">
          ¿Te inspiran estos viajes? Diseña el tuyo a continuación ↓
        </p>
      </div>
    </div>
  );
}
