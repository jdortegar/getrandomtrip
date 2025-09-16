'use client';

import React, { useState } from 'react';
import type { Tripper } from '@/content/trippers';
import SafeImage from '@/components/common/SafeImage';

export default function TripperProfile({ t }: { t: Tripper }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    // Ancla para “aterrizar” arriba del todo al entrar al perfil
    <section id="tripper-hero" className="relative bg-[#07143A] text-white scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Grid tipo Black Tomato */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Foto */}
          <div className="md:col-span-4">
            <div className="w-56 h-56 md:w-64 md:h-64 relative rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10">
              <SafeImage
                src={t.avatar || t.heroImage || null}
                alt={`Retrato de ${t.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 224px, 256px"
                priority
              />
            </div>
          </div>

          {/* Texto + badges */}
          <div className="md:col-span-8">
            <h1
              className="text-3xl md:text-5xl font-bold uppercase tracking-wide"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {t.name}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              {t.ambassadorId && (
                <span className="inline-flex items-center rounded-full bg-white/10 text-white text-xs md:text-sm px-3 py-1">
                  Tripper Ambassador: ID {t.ambassadorId}
                </span>
              )}
              {t.tierLevel && (
                <span className="inline-flex items-center rounded-full bg-white/10 text-white text-xs md:text-sm px-3 py-1">
                  Tripper Tier: {t.tierLevel}
                </span>
              )}
            </div>

            {(t.agency || t.location) && (
              <div className="mt-3 text-white/80 text-sm">
                {t.agency && <span className="underline">{t.agency}</span>}
                {t.agency && t.location && <span className="mx-2">·</span>}
                {t.location && <span>{t.location}</span>}
              </div>
            )}

            {t.bio && (
              <p className="mt-6 text-white/90 leading-relaxed max-w-2xl">
                {t.bio}
              </p>
            )}

            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3">
              <a
                href="#planner"
                aria-label={`Planear un Randomtrip con ${t.name.split(' ')[0]}`}
                className="inline-flex items-center justify-center rounded-full bg-white text-[#07143A] px-6 py-3 font-semibold shadow hover:-translate-y-0.5 transition"
              >
                Randomtrip ft. {t.name.split(' ')[0]}
              </a>
              <a
                href="#tripper-blog"
                aria-label={`Ver las mejores historias de ${t.name.split(' ')[0]}`}
                className="inline-flex items-center justify-center rounded-full border border-white/60 text-white px-6 py-3 font-semibold hover:bg-white/10 transition"
              >
                Las mejores historias de {t.name.split(' ')[0]}
              </a>
            </div>
          </div>
        </div>

        {/* Video inline opcional */}
        {showVideo && t.videoUrl && (
          <div className="mt-8 rounded-xl overflow-hidden ring-1 ring-white/10 bg-black/20">
            <div className="aspect-video">
              <iframe
                src={t.videoUrl}
                title={`Video de ${t.name}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>

      {/* Tarjeta INTERESTS / DESTINATIONS a la derecha */}
      {(t.interests?.length || t.destinations?.length) && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 md:-mt-6 pb-8">
          <div className="md:ml-auto md:w-[520px] bg-white text-gray-900 rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold tracking-wide text-gray-600">INTERESTS</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {t.interests?.map((it) => <li key={it}>• {it}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wide text-gray-600">DESTINATIONS</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {t.destinations?.map((d) => <li key={d}>• {d}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
