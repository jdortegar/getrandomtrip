'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { TRIPPERS } from '@/content/trippers';

type TripperSearchState = 'initial' | 'categories' | 'searching' | 'found';

interface Tripper {
  name: string;
  img: string;
  slug: string;
  bio?: string;
}

export default function TrippersPage() {
  const router = useRouter();
  const [tripperSearchState, setTripperSearchState] =
    useState<TripperSearchState>('initial');
  const [foundTripper, setFoundTripper] = useState<Tripper | null>(null);

  const findTripper = (name: string) => {
    const tripper = TRIPPERS.find((t) =>
      t.name.toLowerCase().includes(name.toLowerCase()),
    );

    if (tripper) {
      setFoundTripper({
        name: tripper.name,
        img: tripper.avatar,
        slug: tripper.slug,
        bio: tripper.bio,
      });
      setTripperSearchState('found');
    } else {
      // Handle not found case
      setTripperSearchState('searching');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-caveat text-5xl font-bold text-gray-900 mb-4">
            Encuentra tu Tripper
          </h1>
          <p className="font-jost text-xl text-gray-600 max-w-2xl mx-auto">
            Conecta con nuestros expertos viajeros y descubre experiencias
            únicas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Interactive Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative group rounded-2xl overflow-hidden shadow-xl hover:scale-[1.03] transition-all cursor-pointer bg-white text-gray-900 flex flex-col items-center justify-center p-6 min-h-[300px]"
          >
            {tripperSearchState === 'initial' && (
              <div
                onClick={() => setTripperSearchState('categories')}
                className="cursor-pointer text-center"
              >
                <h3 className="font-bold text-lg">
                  Busca a tu Tripper favorito
                </h3>
                <p className="text-sm text-gray-400 mt-1">Haz click aquí</p>
              </div>
            )}

            {tripperSearchState === 'categories' && (
              <div className="w-full flex flex-col space-y-2 text-center">
                <h3 className="font-bold text-lg mb-2">Busca por Categoría</h3>
                <button
                  onClick={() => setTripperSearchState('searching')}
                  className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900"
                >
                  Travel Bloggers
                </button>
                <button
                  onClick={() => setTripperSearchState('searching')}
                  className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900"
                >
                  Creadores
                </button>
                <button
                  onClick={() => setTripperSearchState('searching')}
                  className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900"
                >
                  Travel Advisors
                </button>
              </div>
            )}

            {tripperSearchState === 'searching' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = (form.elements.namedItem(
                    'tripperName',
                  ) as HTMLInputElement) || { value: '' };
                  findTripper(input.value);
                }}
                className="w-full flex flex-col items-center"
              >
                <h3 className="font-bold text-lg mb-2">Nombre del Tripper</h3>
                <input
                  name="tripperName"
                  type="text"
                  placeholder="Escribe un nombre..."
                  autoFocus
                  className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="mt-4 w-full bg-primary text-white hover:bg-primary-800 py-3 rounded-lg transition-colors font-bold"
                >
                  Buscar
                </button>
              </form>
            )}

            {tripperSearchState === 'found' && foundTripper && (
              <div className="flex flex-col items-center text-center">
                <Image
                  src={foundTripper.img}
                  alt={foundTripper.name}
                  className="w-24 h-24 rounded-full border-4 border-primary"
                  width={96}
                  height={96}
                />
                <h3 className="mt-2 font-semibold text-gray-900">
                  {foundTripper.name}
                </h3>
                <p className="text-xs text-primary">¡Tripper encontrado!</p>
                <button
                  onClick={() => router.push(`/packages/${foundTripper.slug}`)}
                  className="text-sm text-gray-600 mt-2 hover:text-gray-900 transition-colors"
                >
                  Ver perfil de {foundTripper.name.split(' ')[0]}
                </button>
              </div>
            )}
          </motion.div>

          {/* All Trippers Grid */}
          {TRIPPERS.map((tripper, index) => (
            <motion.div
              key={tripper.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: index * 0.1,
              }}
              className="group rounded-2xl overflow-hidden shadow-xl hover:scale-[1.03] transition-all cursor-pointer bg-white"
              onClick={() => router.push(`/packages/${tripper.slug}`)}
            >
              <div className="relative w-full h-64">
                <Image
                  src={tripper.avatar}
                  alt={tripper.name}
                  fill
                  sizes="(min-width:1024px) 220px, (min-width:768px) 33vw, 50vw"
                  className="object-cover transition-all duration-500 filter grayscale group-hover:grayscale-0"
                  priority={false}
                />
                <div className="absolute bottom-0 left-0 right-0 text-white bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="font-caveat text-lg font-bold">
                    {tripper.name}
                  </h3>
                  <div className="mt-1 gap-2 text-[11px] uppercase tracking-wide text-center">
                    Ver Perfil
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
