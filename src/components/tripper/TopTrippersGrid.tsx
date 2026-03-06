'use client';

import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import TripperCard from '@/components/TripperCard';
import TripperSearchModal from '@/components/tripper/TripperSearchModal';
import Section from '@/components/layout/Section';

// ---------------------------------------------------------------------------
// Cache + suspend-style fetcher for React 18 Suspense (throw promise until ready)
// ---------------------------------------------------------------------------

const trippersCache: {
  error: Error | null;
  promise: Promise<any[]> | null;
  result: any[] | null;
} = { error: null, promise: null, result: null };

function fetchTrippers(): any[] {
  if (trippersCache.result !== null) return trippersCache.result;
  if (trippersCache.error !== null) throw trippersCache.error;
  if (!trippersCache.promise) {
    trippersCache.promise = fetch('/api/trippers')
      .then((res) => res.json())
      .then((data: any[]) => {
        trippersCache.result = data;
        return data;
      })
      .catch((err: Error) => {
        trippersCache.error = err;
        throw err;
      });
  }
  throw trippersCache.promise;
}

// ---------------------------------------------------------------------------
// Skeleton fallback (shown by Suspense while data loads)
// ---------------------------------------------------------------------------

function TopTrippersGridSkeleton() {
  return (
    <Section className="py-20" fullWidth={false} id="trippers-grid">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="group overflow-hidden rounded-md bg-white shadow-xl"
          >
            <div className="relative h-64 w-full animate-pulse bg-gray-200">
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                <div className="mx-auto mb-2 h-6 rounded bg-gray-300" />
                <div className="mx-auto h-3 w-16 rounded bg-gray-300" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Content that suspends until trippers are loaded
// ---------------------------------------------------------------------------

function TopTrippersGridContent() {
  const trippers = fetchTrippers();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <Section className="py-20" fullWidth={false} id="trippers-grid">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-5">
        {trippers.map((tripper) => (
          <motion.div
            key={tripper.name}
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <TripperCard
              bio={tripper.bio || ''}
              href={
                tripper.tripperSlug ||
                tripper.name.toLowerCase().replace(/\s+/g, '-')
              }
              imageUrl={tripper.avatarUrl ?? '/images/fallback.jpg'}
              name={tripper.name}
            />
          </motion.div>
        ))}

        {/* CTA: open tripper search modal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <button
            className="group flex aspect-[269/230] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-primary-800 p-6 text-left text-white shadow-xl transition-all hover:scale-[1.03]"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <div className="text-center">
              <h3 className="mb-2 font-caveat text-2xl font-bold text-white">
                Busca tu Tripper
              </h3>
              <p className="mb-4 text-sm text-white/80">
                Encuentra el experto perfecto para tu aventura
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <span>Explorar Trippers</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        </motion.div>
      </div>

      <TripperSearchModal
        onClose={() => setSearchOpen(false)}
        open={searchOpen}
        trippers={trippers}
      />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Public component: wraps content in Suspense with skeleton fallback
// ---------------------------------------------------------------------------

export default function TopTrippersGrid() {
  return (
    <Suspense fallback={<TopTrippersGridSkeleton />}>
      <TopTrippersGridContent />
    </Suspense>
  );
}
