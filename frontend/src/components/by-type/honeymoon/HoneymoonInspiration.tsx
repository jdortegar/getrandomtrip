'use client';

import React from 'react';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';

const HoneymoonInspiration: React.FC = () => {
  // Posts de ejemplo (luego podés mapear a tu data real)
  const posts = [
    {
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      category: 'Playas & Dunas',
      title: 'Arenas doradas y promesas al atardecer',
    },
    {
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      category: 'Naturaleza',
      title: 'Cordilleras, lagos y la calma de estar a dos',
    },
    {
      image: 'https://images.unsplash.com/photo-1526312426976-593c2d0a3d5b',
      category: 'Cultura',
      title: 'Ciudades que susurran historias para dos',
    },
    {
      image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03',
      category: 'Gastronomía',
      title: 'Viñedos, sobremesas y conversaciones infinitas',
    },
    {
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
      category: 'Aventura',
      title: 'Roadtrips, miradas y playlists compartidas',
    },
    {
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
      category: 'Música',
      title: 'Pequeñas salas, grandes canciones',
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
    <section id="inspiracion-honeymoon" className="py-20 px-8 bg-[#111827] text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Columna izquierda: título + copy + flechas */}
        <div className="md:col-span-1 text-left">
          <h2
            className="text-5xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Destinos y escenas para su luna de miel
          </h2>
          <p className="text-lg text-gray-300 mt-4">
            Inspiración para diseñar el primer capítulo juntos.
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
            <Link href="/blogs/honeymoon">
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

      {/* CTA al final (consistente con otras landings) */}
      <div className="text-center mt-12">
        <Link href="#honeymoon-planner" className="btn-primary">
          A diseñar la luna de miel
        </Link>
      </div>
    </section>
  );
};

export default HoneymoonInspiration;
