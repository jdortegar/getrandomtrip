'use client';

import Image from 'next/image';
import { Heart, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Section from '@/components/layout/Section';
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
    <Section className="bg-primary py-20" fullWidth={true} variant="dark">
      <div className="rt-container px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-caveat text-4xl font-bold text-white md:text-6xl mb-6">
            Experiencias que {firstName} ha creado
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-white/90 leading-relaxed font-jost">
            Inspírate con estos viajes sorpresa diseñados por {tripperName}.
            Cada experiencia está pensada para crear recuerdos únicos.
          </p>
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {trips.map((trip) => {
            const tierBadge = getTierBadge(trip.level);
            const typeLabel = getTypeLabel(trip.type);

            return (
              <div
                key={trip.id}
                className="group relative overflow-hidden rounded-sm border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl transition-all duration-300 hover:shadow-3xl hover:border-white/20"
              >
                {/* Image */}
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    alt={trip.title}
                    className="h-full w-full object-cover transition duration-300"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    src={trip.heroImage}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                  {/* Badges */}
                  <div className="absolute left-6 top-6 flex flex-wrap gap-3">
                    <span className="rounded-sm border border-white/40 bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md shadow-lg font-jost">
                      {typeLabel}
                    </span>
                    <span
                      className={`rounded-sm px-4 py-2 text-sm font-semibold text-white shadow-lg font-jost ${tierBadge.color}`}
                    >
                      {tierBadge.label}
                    </span>
                  </div>

                  {/* Likes */}
                  <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-sm bg-black/70 px-4 py-2 backdrop-blur-md shadow-lg">
                    <Heart
                      className="h-5 w-5 text-secondary"
                      fill="currentColor"
                    />
                    <span className="text-sm font-semibold text-white font-jost">
                      {trip.likes}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-secondary transition-colors font-caveat">
                    {trip.title}
                  </h3>
                  <p className="text-white/90 mb-4 leading-relaxed font-jost">
                    {trip.teaser}
                  </p>

                  {/* Highlights */}
                  {trip.highlights.length > 0 && (
                    <ul className="mb-4 space-y-2">
                      {trip.highlights.slice(0, 3).map((highlight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-white/90"
                        >
                          <span className="mt-1 text-secondary text-lg">✓</span>
                          <span className="text-sm font-jost">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Tags */}
                  {trip.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {trip.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-sm bg-white/15 px-3 py-1 text-xs text-white/80 backdrop-blur-sm font-jost"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-4 text-sm text-white/70 justify-center w-full">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-jost">{trip.nights} noches</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-jost">{trip.pax} personas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
