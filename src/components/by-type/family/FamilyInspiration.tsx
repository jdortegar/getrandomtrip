'use client';

import React from 'react';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';

const FamilyInspiration: React.FC = () => {
  // 6 posts (puedes ajustar títulos/imágenes luego)
  const posts = [
    { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', category: 'Inspiración', title: 'Explora las historias de nuestros Trippers' },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', category: 'Consejos', title: 'Nuestros lugares favoritos para toda la familia' },
    { image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429', category: 'Experiencias', title: 'Ideas para distintas edades y estilos' },
    { image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4', category: 'Guías', title: 'Cómo planificar un finde familiar sin estrés' },
    { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Aventura', title: 'Naturaleza cerca de casa: 5 escapadas' },
    { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Cultura', title: 'Fiestas locales para ir con chicos' },
  ];

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section id="inspiracion-families" className="py-20 px-8 bg-[#111827] text-white">
      <div className="rt-container grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

        {/* Columna izquierda: Título + flechas */}
        <div className="md:col-span-1 text-left">
          <h2 className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Nuestros destinos favoritos para viajar en familia
          </h2>
          <p className="text-lg text-gray-300 mt-4">
            Historias, destinos y gatillos creativos para elegir mejor.
          </p>

          <div className="flex space-x-4 mt-8">
            <button
              onClick={() => handleScroll('left')}
              className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors"
              aria-label="Anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors"
              aria-label="Siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Columna derecha: carrusel con BlogCard + "View All" */}
        <div className="md:col-span-2">
          <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-8 pb-8 hide-scrollbar">
            {posts.map((post) => (
              <BlogCard key={post.title} post={post} />
            ))}
            <Link href="/blogs/families">
              <div className="bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-6 w-80 flex-shrink-0 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700">
                <div className="w-16 h-16 border-2 border-gray-500 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>View All</h3>
                <p className="text-gray-400 mt-2">Ir al Blog</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* IMPORTANTE: en /families NO renderizamos CTA inferior (solo flechas) */}
    </section>
  );
};

export default FamilyInspiration;