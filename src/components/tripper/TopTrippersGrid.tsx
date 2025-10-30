'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import TripperCard from '@/components/TripperCard';

export default function TopTrippersGrid() {
  const [trippers, setTrippers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrippers() {
      try {
        const response = await fetch('/api/trippers');
        const data = await response.json();
        setTrippers(data);
      } catch (error) {
        console.error('Error fetching trippers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrippers();
  }, []);

  if (loading) {
    return (
      <div id="top-trippers" className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="group rounded-md overflow-hidden shadow-xl bg-white"
            >
              <div className="relative w-full h-64 bg-gray-200 animate-pulse">
                <div className="absolute bottom-0 left-0 right-0 text-white bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="top-trippers" className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
        {trippers.map((tripper) => (
          <motion.div
            key={tripper.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <TripperCard
              name={tripper.name}
              img={tripper.avatarUrl ?? '/images/fallback.jpg'}
              slug={
                tripper.tripperSlug ||
                tripper.name.toLowerCase().replace(/\s+/g, '-')
              }
              bio={tripper.bio || ''}
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
