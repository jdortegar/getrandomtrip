'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import TripperCard from '@/components/TripperCard';
import { TRIPPERS } from '@/content/trippers';

export default function TopTrippersGrid() {
  return (
    <div id="top-trippers" className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
        {TRIPPERS.map((tripper) => (
          <motion.div
            key={tripper.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <TripperCard
              name={tripper.name}
              img={
                tripper.avatar ?? tripper.heroImage ?? '/images/fallback.jpg'
              }
              slug={tripper.slug}
              bio={tripper.bio}
            />
          </motion.div>
        ))}

        {/* Link to dedicated trippers page */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Link
            href="/trippers"
            className="group rounded-md w-full h-64 overflow-hidden shadow-xl hover:scale-[1.03] transition-all cursor-pointer  bg-gradient-to-br from-primary to-primary-800 text-white flex flex-col items-center justify-center p-6"
          >
            <div className="text-center">
              <h3 className="font-caveat text-2xl font-bold text-white mb-2">
                Busca tu Tripper
              </h3>
              <p className="text-sm text-white/80 mb-4">
                Encuentra el experto perfecto para tu aventura
              </p>
              <div className="text-sm inline-flex items-center gap-2 text-white font-medium">
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
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
