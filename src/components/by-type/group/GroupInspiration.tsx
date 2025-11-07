'use client';

import React from 'react';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';

const GroupInspiration: React.FC = () => {
  // Posts de ejemplo (reemplazá por data real cuando la tengas)
  const posts = [
    {
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      category: 'Historias',
      title: '10 momentos que solo pasan viajando en grupo',
    },
    {
      image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b',
      category: 'Consejos',
      title: 'Cómo alinear expectativas sin matar la sorpresa',
    },
    {
      image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38',
      category: 'Experiencias',
      title: 'Un Randomtrip con amigos que terminó en ritual',
    },
    {
      image: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6',
      category: 'Guías',
      title: 'Offsite inolvidable: 6 ideas para equipos',
    },
    {
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      category: 'Fantasía',
      title: 'Vivir una saga: rutas para cinéfilos y gamers',
    },
    {
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
      category: 'Música',
      title: 'Festivales & escenas locales: cómo elegir',
    },
  ];

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'right' ? delta : -delta, behavior: 'smooth' });
  };

  return (
    <section id="inspiracion-group" className="py-20 px-8 bg-[#111827] text-white">
      <div className="rt-container grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Columna izquierda: título + copy + flechas */}
        <div className="md:col-span-1 text-left">
          <h2 className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Nuestros destinos favoritos para viajar en grupo
          </h2>
          <p className="text-lg text-gray-300 mt-4">
            Ideas para equipos, amigos y tribus; porque el viaje se vive mejor en plural.
          </p>
          <div className="flex space-x-4 mt-8">
            <button
              onClick={() => handleScroll('left')}
              className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors"
              aria-label="Scroll hacia la izquierda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors"
              aria-label="Scroll hacia la derecha"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Columna derecha: carrusel horizontal */}
        <div className="md:col-span-2">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-8 pb-8 hide-scrollbar"
          >
            {posts.map((post) => (
              <BlogCard key={post.title} post={post} />
            ))}

            {/* Tarjeta "View All" */}
            <Link href="/blogs/group">
              <div className="bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-6 w-80 flex-shrink-0 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700">
                <div className="w-16 h-16 border-2 border-gray-500 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  View All
                </h3>
                <p className="text-gray-400 mt-2">Ir al Blog</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA al final (opcional, consistente con otras landings) */}
      <div className="text-center mt-12">
        <Link href="#group-planner" className="btn-primary">
          Activar Randomtrip en grupo
        </Link>
      </div>
    </section>
  );
};

export default GroupInspiration;
