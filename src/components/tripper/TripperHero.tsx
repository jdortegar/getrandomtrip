'use client';

import type { Tripper } from '@/content/trippers';
import SafeImage from '@/components/common/SafeImage';
import React from 'react';

export default function TripperHero({ t }: { t: Tripper }) {
  const videoId = 'xDEsbj4mDR0';

  return (
    <section id="tripper-hero" className="relative h-screen text-white scroll-mt-24 flex items-center justify-center">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <iframe
          className="absolute top-1/2 left-1/2 w-full h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1`}
          title="Tripper Hero Background Video"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
        {/* Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Photo and Basic Info */}
          <div className="md:col-span-4 flex flex-col items-center text-center">
            <div className="w-48 h-48 md:w-56 md:h-56 relative rounded-full overflow-hidden shadow-xl ring-4 ring-white/20">
              <SafeImage
                src={t.avatar || t.heroImage || null}
                alt={`Retrato de ${t.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 192px, 224px"
                priority
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t.name}
            </h1>
            <div className="mt-2 text-white/80">
              <p>{t.location}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              {t.ambassadorId && (
                <span className="inline-flex items-center rounded-full bg-white/10 text-white text-xs px-3 py-1">
                  ID: {t.ambassadorId}
                </span>
              )}
              {t.tierLevel && (
                <span className="inline-flex items-center rounded-full bg-white/10 text-white text-xs px-3 py-1">
                  Tier: {t.tierLevel}
                </span>
              )}
            </div>
          </div>

          {/* Bio and Expertise */}
          <div className="md:col-span-8">
            <p className="text-lg text-white/90 leading-relaxed max-w-2xl">
              {t.bio}
            </p>

            {(t.interests?.length || t.destinations?.length) && (
              <div className="mt-6 bg-black/30 backdrop-blur-sm rounded-xl border border-white/20 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold tracking-wide text-white/80">Áreas de Expertise</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      {t.interests?.map((it) => <li key={it}>• {it}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold tracking-wide text-white/80">Países/Ciudades</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      {t.destinations?.map((d) => <li key={d}>• {d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#planner"
                aria-label={`Planear un Randomtrip con ${t.name.split(' ')[0]}`}
                className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-8 py-3 font-bold shadow-lg hover:bg-gray-200 transition-transform duration-200 hover:-translate-y-1"
              >
                Randomtrip ft. {t.name.split(' ')[0]}
              </a>
              <a
                href="#tripper-blog"
                aria-label={`Ver las mejores historias de ${t.name.split(' ')[0]}`}
                className="inline-flex items-center justify-center rounded-full border-2 border-white text-white px-8 py-3 font-bold hover:bg-white/10 transition-transform duration-200 hover:-translate-y-1"
              >
                Las mejores historias
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
