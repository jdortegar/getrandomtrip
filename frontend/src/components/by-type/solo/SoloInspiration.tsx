'use client';

import React from 'react';
import Link from 'next/link';
import BlogCard from '@/components/BlogCard';

const SoloInspiration: React.FC = () => {
    const posts = [
        { image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff', category: 'Inspiración', title: '5 Razones para Hacer tu Primer Viaje Solo' },
        { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Consejos', title: 'Cómo Empacar Ligero para una Aventura en Solitario' },
        { image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', category: 'Experiencias', title: 'La Historia de un Randomtrip en Solitario por la Patagonia' },
        { image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3', category: 'Guías', title: 'Sabores que Solo Descubrirás Viajando Solo por Asia' },
        { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Aventura', title: 'Un Camino que se Recorre Mejor Solo: Carretera Austral' },
        { image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff', category: 'Inspiración', title: 'Lo que Aprendés Cuando Viajas Solo' },
    ];

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section id="inspiracion-solo" className="py-20 px-8 bg-[#111827] text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                <div className="md:col-span-1 text-left">
                    <h2 className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Nuestros destinos favoritos para viajar solo
                    </h2>
                    <p className="text-lg text-gray-300 mt-4">
                        El camino en solitario no significa estar solo. Estas historias y destinos te muestran que perderte también es otra forma de encontrarte.
                    </p>
                    <div className="flex space-x-4 mt-8">
                        <button onClick={() => handleScroll('left')} className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <button onClick={() => handleScroll('right')} className="border border-gray-600 rounded-full p-3 hover:border-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-8 pb-8 hide-scrollbar">
                        {posts.map(post => (
                            <BlogCard key={post.title} post={post} />
                        ))}
                        <Link href="/blogs/solo">
                            <div className="bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-6 w-80 flex-shrink-0 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700">
                                <div className="w-16 h-16 border-2 border-gray-500 rounded-full flex items-center justify-center mb-4">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </div>
                                <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>View all</h3>
                                <p className="text-gray-400 mt-2">Ir al Blog</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            {/* CTA al final */}
            <div className="text-center mt-12">
                <p className="text-xl mb-4">Lo que empieza como un viaje solo, termina como una historia para siempre.</p>
                <Link
                    href="#planes"
                    className="btn-primary"
                >
                    👉 ACTIVAR MI RANDOMTRIP SOLUM
                </Link>
            </div>
        </section>
    );
};

export default SoloInspiration;
