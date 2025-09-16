'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TabButton from '@/components/TabButton';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import RoadtripCard from '@/components/RoadtripCard';
import DecodeResultCard from '@/components/DecodeResultCard';
import TopTrippersGrid from '@/components/tripper/TopTrippersGrid';
import { slugify } from '@/lib/slugify';
import {
  initialTravellerTypes,
  type TravelerType,
} from '@/lib/data/travelerTypes';
import {
  initialRoadtripTypes,
  type RoadtripType,
} from '@/lib/data/roadtripTypes';
import { initialDecodeData, type DecodeItem } from '@/lib/data/decodeData';

// Placeholder for Kai Service, if not implemented yet
const getKaiSuggestion = async (destination: string, month: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (destination === 'sin sugerencia') return ''; // For testing
  return `¡Kai sugiere explorar ${destination} en ${month || 'cualquier mes'}! Podría ser una aventura inesperada llena de... ¡sorpresas!`;
};

const ALLOWED_TABS = new Set([
  'By Traveller',
  'Top Trippers',
  'Roadtrips',
  'Trippers Decode',
]);

function normalizeTab(input: string | null): string | null {
  if (!input) return null;
  try {
    input = decodeURIComponent(input);
  } catch {}
  // normaliza espacios múltiples
  input = input.replace(/\s+/g, ' ').trim();
  return ALLOWED_TABS.has(input) ? input : null;
}

// --- TravelerTypesCarousel Component ---
const TravelerTypesCarousel: React.FC = () => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [translateX, setTranslateX] = React.useState(0);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // w-80 = 320px
    const gap = 24; // space-x-6 = 24px
    const totalCardWidth = cardWidth + gap;
    const containerWidth = container.clientWidth;
    const visibleCards = Math.floor(containerWidth / totalCardWidth);

    let newIndex = currentIndex;
    if (direction === 'right') {
      newIndex = Math.min(
        currentIndex + 1,
        initialTravellerTypes.length - visibleCards,
      );
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    setCurrentIndex(newIndex);
    setTranslateX(-newIndex * totalCardWidth);
  };

  // Calculate if arrows should be visible
  const container = scrollContainerRef.current;
  const cardWidth = 320;
  const gap = 24;
  const totalCardWidth = cardWidth + gap;
  const containerWidth = container?.clientWidth || 0;
  const visibleCards = Math.floor(containerWidth / totalCardWidth);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight =
    currentIndex < initialTravellerTypes.length - visibleCards;

  return (
    <div className="relative w-full">
      {/* Left Arrow - Only show when can scroll left */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-full p-3 hover:border-gray-400 transition-colors shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      )}

      {/* Right Arrow - Only show when can scroll right */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-300 rounded-full p-3 hover:border-gray-400 transition-colors shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      )}

      {/* Carousel Container */}
      <div ref={scrollContainerRef} className="relative py-8">
        <div
          className="flex space-x-6 pb-4 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX}px)` }}
        >
          {initialTravellerTypes.map((type) => (
            <motion.div
              key={type.title}
              className="flex-shrink-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <TravelerTypeCard
                title={type.title}
                description={type.description}
                imageUrl={type.imageUrl}
                href={`/packages/by-type/${slugify(type.travelType)}`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- ExplorationPageContent Component ---
function ExplorationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const safeTab = normalizeTab(rawTab);

  const [activeTab, setActiveTab] = useState(safeTab || 'By Traveller');

  useEffect(() => {
    const tab = searchParams.get('tab');
    // Si viene ?tab=..., seleccionamos la tab y scrolleamos al ancla
    if (tab) {
      setActiveTab(tab);
      const el = document.getElementById('start-your-journey-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const heading = document.querySelector(
          'section[aria-label="Comienza tu Viaje"] h2',
        ) as HTMLElement | null;
        if (heading)
          setTimeout(() => heading.focus({ preventScroll: true }), 350);
      }
    } else if (
      typeof window !== 'undefined' &&
      window.location.hash === '#start-your-journey-anchor'
    ) {
      // Fallback: si no hay ?tab pero hay hash, igual scrollear
      const el = document.getElementById('start-your-journey-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  const [decodeDestination, setDecodeDestination] = useState('');
  const [decodeMonth, setDecodeMonth] = useState('');
  const [decodeSearchResults, setDecodeSearchResults] = useState<DecodeItem[]>(
    [],
  );
  const [kaiSuggestion, setKaiSuggestion] = useState('');
  const [isSearchingDecode, setIsSearchingDecode] = useState(false);

  const handleDecodeSearch = async () => {
    setIsSearchingDecode(true);
    setKaiSuggestion('');
    const destination = decodeDestination.trim().toLowerCase();
    const month = decodeMonth.trim().toLowerCase();

    const results = initialDecodeData.filter(
      (d) =>
        d.destination.toLowerCase().includes(destination) &&
        (!month || d.month.toLowerCase() === month),
    );
    setDecodeSearchResults(results);

    if (results.length === 0 && destination) {
      const suggestion = await getKaiSuggestion(decodeDestination, decodeMonth);
      setKaiSuggestion(suggestion);
    }
    setIsSearchingDecode(false);
  };

  return (
    <main className="bg-white text-gray-900 min-h-screen py-16 px-4 md:px-8">
      <div id="start-your-journey-anchor" />
      <section
        data-testid="journey-section"
        aria-label="Comienza tu Viaje"
        className="max-w-7xl mx-auto text-center"
      >
        <h2
          data-testid="journey-title"
          tabIndex={-1}
          className="text-2xl md:text-4xl font-bold mb-2 text-gray-900"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Nuestros Puntos de Partida
        </h2>
        <p
          className="text-lg text-gray-800 mt-4 mb-12"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Elige cómo quieres empezar a dar forma a tu aventura.
        </p>

        <div className="flex justify-center space-x-4 md:space-x-8 border-b border-gray-300 mb-12">
          {['By Traveller', 'Top Trippers', 'Roadtrips', 'Trippers Decode'].map(
            (tabName) => (
              <TabButton
                key={tabName}
                label={tabName}
                isActive={activeTab === tabName}
                onClick={() => setActiveTab(tabName)}
              />
            ),
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeTab === 'By Traveller' && (
              <div id="by-traveller" className="py-8">
                <p className="text-center text-gray-600 mb-8 italic">
                  ¿Con quién vas a escribir tu próxima historia?
                </p>
                <TravelerTypesCarousel />
              </div>
            )}

            {activeTab === 'Top Trippers' && <TopTrippersGrid />}

            {activeTab === 'Roadtrips' && (
              <div className="py-8">
                <p className="text-center text-gray-600 mb-8 italic">
                  Libertad sobre ruedas. Tú eliges el ritmo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {initialRoadtripTypes.map((item) => (
                    <motion.div
                      key={item.type}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                      <RoadtripCard
                        title={item.type}
                        icon={item.icon}
                        description={item.description}
                        bgImage={item.bgImage}
                        href="/journey/basic-config" // 👈 usamos Link
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Trippers Decode' && (
              <div className="py-8">
                <p className="text-center text-gray-600 mb-8 italic max-w-2xl mx-auto">
                  Rutas con alma, contadas por quienes las vivieron. Vive
                  destinos a través de los ojos de auténticos expertos.
                </p>
                <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-100 p-6 rounded-lg max-w-3xl mx-auto mb-12 shadow-md">
                  <input
                    value={decodeDestination}
                    onChange={(e) => setDecodeDestination(e.target.value)}
                    type="text"
                    placeholder="Where next? Ej: Río Negro"
                    className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none placeholder-gray-500"
                  />
                  <select
                    value={decodeMonth}
                    onChange={(e) => setDecodeMonth(e.target.value)}
                    className="w-full md:w-auto bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="">Cualquier Mes</option>
                    {[
                      'Enero',
                      'Febrero',
                      'Marzo',
                      'Abril',
                      'Mayo',
                      'Junio',
                      'Julio',
                      'Agosto',
                      'Septiembre',
                      'Octubre',
                      'Noviembre',
                      'Diciembre',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleDecodeSearch}
                    disabled={isSearchingDecode}
                    className="w-full md:w-auto bg-[#D4AF37] text-gray-900 hover:bg-[#EACD65] font-bold p-3 rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    {isSearchingDecode ? (
                      <svg
                        className="animate-spin h-6 w-6 text-gray-900"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      'Buscar'
                    )}
                  </button>
                </div>

                {(decodeSearchResults.length > 0 || kaiSuggestion) && (
                  <div className="mt-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {initialDecodeData.map((item) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                          <DecodeResultCard
                            item={item}
                            onClick={() =>
                              router.push('/packages/build/add-ons')
                            }
                          />
                        </motion.div>
                      ))}
                    </div>
                    {kaiSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="mt-6 text-center border-2 border-dashed border-[#D4AF37] bg-white shadow-xl p-6 rounded-lg max-w-xl mx-auto"
                      >
                        <span className="text-4xl">🤖</span>
                        <h4
                          className="font-bold text-xl text-[#D4AF37] mt-4"
                          style={{ fontFamily: 'Playfair Display, serif' }}
                        >
                          Sugerencia de Kai
                        </h4>
                        <p className="text-gray-800 mt-2 italic">
                          {kaiSuggestion}
                        </p>
                      </motion.div>
                    )}
                    {decodeSearchResults.length === 0 &&
                      !kaiSuggestion &&
                      decodeDestination &&
                      !isSearchingDecode && (
                        <p className="text-center text-gray-500 mt-8">
                          No se encontraron resultados. Intenta con otra
                          búsqueda.
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

export default ExplorationPageContent;
