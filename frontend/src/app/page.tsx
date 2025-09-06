'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Img from '@/components/common/Img'; // Added import
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogCard from '@/components/BlogCard';
import EventFinder from '@/components/EventFinder';
import TabButton from '@/components/TabButton';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import RoadtripCard from '@/components/RoadtripCard';
import DecodeResultCard from '@/components/DecodeResultCard';
import { motion, AnimatePresence } from 'framer-motion';
import TopTrippersGrid from '@/components/tripper/TopTrippersGrid';
import { slugify } from '@/lib/slugify';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';
import FooterLanding from '@/components/layout/FooterLanding';
import { BudgetBandsSection } from './BudgetBandsSection';

// Placeholder for Kai Service, if not implemented yet
const getKaiSuggestion = async (destination: string, month: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (destination === 'sin sugerencia') return ''; // For testing
  return `¡Kai sugiere explorar ${destination} en ${month || 'cualquier mes'}! Podría ser una aventura inesperada llena de... ¡sorpresas!`;
};

// --- Data Definitions ---
interface TravelerType {
  title: string;
  description: string;
  imageUrl: string;
  travelType: string;
  query: string;
}

interface RoadtripType {
  type: string;
  icon: string;
  description: string;
  bgImage: string;
  query: string;
}

interface DecodeItem {
  destination: string;
  month: string;
  bg: string;
  profileImg: string;
  title: string;
  author: string;
  query: string;
}

// Data for each tab
const initialTravellerTypes: TravelerType[] = [
  {
    title: 'En Pareja',
    description: 'Escapadas románticas.',
    travelType: 'Couple',
    query: 'heterosexual couple romantic travel',
    imageUrl: '/images/journey-types/couple-hetero.jpg',
  },
  {
    title: 'Solo',
    description: 'Un viaje único.',
    travelType: 'Solo',
    query: 'solo travel adventure landscape',
    imageUrl: '/images/journey-types/solo-traveler.jpg',
  },
  {
    title: 'En Familia',
    description: 'Recuerdos juntos.',
    travelType: 'Family',
    query: 'family vacation happy kids outdoor',
    imageUrl: '/images/journey-types/family-vacation.jpg',
    },
  {
    title: 'En Grupo',
    description: 'Experiencias compartidas.',
    travelType: 'Group',
    query: 'friends group travel exploring city',
    imageUrl: '/images/journey-types/friends-group.jpg',
  },
  {
    title: 'Honeymoon',
    description: 'El comienzo perfecto.',
    travelType: 'Honeymoon',
    query: 'same sex couple honeymoon romantic getaway',
    imageUrl: '/images/journey-types/honeymoon-same-sex.jpg',
  },
  {
    title: 'PAWS',
    description: 'Aventuras con tu mascota.',
    travelType: 'Paws',
    query: 'travel with pet dog',
    imageUrl: '/images/journey-types/paws-card.jpg',
  },
];

const initialRoadtripTypes: RoadtripType[] = [
  {
    type: 'Car',
    icon: '🚗',
    description: 'Libertad sobre ruedas.',
    bgImage: '/images/journey-types/roadtrip-car.jpg',
    query: 'scenic car roadtrip mountain',
  },
  {
    type: 'Motorcycle',
    icon: '🏍️',
    description: 'Siente el camino y el viento.',
    bgImage: '/images/journey-types/roadtrip-motorcycle.jpg',
    query: 'motorcycle adventure open road',
  },
  {
    type: 'Bike',
    icon: '🚴',
    description: 'Una aventura a tu propio ritmo.',
    bgImage: '/images/journey-types/roadtrip-bike.jpg',
    query: 'bicycle touring nature path',
  },
];

const initialDecodeData: DecodeItem[] = [
  { destination: 'Río Negro', month: 'Enero', bg: 'https://images.pexels.com/photos/10398717/pexels-photo-10398717.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', profileImg: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', title: 'Río Negro Edition', author: 'Ana García', query: 'patagonia argentina landscape' },
  { destination: 'Kyoto', month: 'Abril', bg: 'https://images.pexels.com/photos/16142728/pexels-photo-16142728/free-photo-of-persona-sentada-en-banco-de-piedra-con-paraguas-en-kioto-japon.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', profileImg: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', title: 'Esencia de Kyoto', author: 'Julián Soto', query: 'kyoto japan cherry blossoms temple' },
];

// --- Loader Component ---
const PremiumLoader = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-t-4 border-gray-600 border-t-[#D4AF37] rounded-full"
    ></motion.div>
    <p className="mt-4 text-lg italic" style={{ fontFamily: 'Inter, sans-serif' }}>{message}</p>
  </div>
);

const ALLOWED_TABS = new Set(["By Traveller","Top Trippers","Roadtrips","Trippers Decode"]);

function normalizeTab(input: string | null): string | null {
  if (!input) return null;
  try { input = decodeURIComponent(input); } catch {}
  // normaliza espacios múltiples
  input = input.replace(/\s+/g, " ").trim();
  return ALLOWED_TABS.has(input) ? input : null;
}

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
        const heading = document.querySelector('section[aria-label="Comienza tu Viaje"] h2') as HTMLElement | null;
        if (heading) setTimeout(() => heading.focus({ preventScroll: true }), 350);
      }
    } else if (typeof window !== 'undefined' && window.location.hash === '#start-your-journey-anchor') {
      // Fallback: si no hay ?tab pero hay hash, igual scrollear
      const el = document.getElementById('start-your-journey-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  
  const [decodeDestination, setDecodeDestination] = useState('');
  const [decodeMonth, setDecodeMonth] = useState('');
  const [decodeSearchResults, setDecodeSearchResults] = useState<DecodeItem[]>([]);
  const [kaiSuggestion, setKaiSuggestion] = useState('');
  const [isSearchingDecode, setIsSearchingDecode] = useState(false);

  

  const handleDecodeSearch = async () => {
    setIsSearchingDecode(true);
    setKaiSuggestion('');
    const destination = decodeDestination.trim().toLowerCase();
    const month = decodeMonth.trim().toLowerCase();

    const results = initialDecodeData.filter(d =>
      d.destination.toLowerCase().includes(destination) &&
      (!month || d.month.toLowerCase() === month)
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
      <section data-testid="journey-section" aria-label="Comienza tu Viaje" className="max-w-7xl mx-auto text-center">
        <h2 data-testid="journey-title" tabIndex={-1} className="text-5xl md:text-7xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>Comienza tu Viaje</h2>
        <p className="text-lg text-gray-800 mt-4 mb-12" style={{ fontFamily: 'Inter, sans-serif' }}>Elige cómo quieres empezar a dar forma a tu aventura.</p>

        <div className="flex justify-center space-x-4 md:space-x-8 border-b border-gray-300 mb-12">
          {["By Traveller", "Top Trippers", "Roadtrips", "Trippers Decode"].map(tabName => (
            <TabButton
              key={tabName}
              label={tabName}
              isActive={activeTab === tabName}
              onClick={() => setActiveTab(tabName)}
            />
          ))}
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
                <p className="text-center text-gray-600 mb-8 italic">¿Con quién vas a escribir tu próxima historia?</p>
                <div className="flex flex-wrap items-center justify-center gap-4 lg:h-[450px] lg:flex-nowrap lg:-space-x-32">
                  {initialTravellerTypes.map((type) => (
                    <motion.div
                      key={type.title}
                      className="w-72 shrink-0 transition-all duration-300 ease-in-out hover:z-10 hover:-translate-y-4 hover:scale-105 lg:w-64"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
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
            )}

            {activeTab === 'Top Trippers' && <TopTrippersGrid />}

            {activeTab === 'Roadtrips' && (
              <div className="py-8">
                <p className="text-center text-gray-600 mb-8 italic">Libertad sobre ruedas. Tú eliges el ritmo.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {initialRoadtripTypes.map(item => (
                    <motion.div
                      key={item.type}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <RoadtripCard
                        title={item.type}
                        icon={item.icon}
                        description={item.description}
                        bgImage={item.bgImage}
                        href="/journey/basic-config"   // 👈 usamos Link
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Trippers Decode' && (
              <div className="py-8">
                <p className="text-center text-gray-600 mb-8 italic max-w-2xl mx-auto">Rutas con alma, contadas por quienes las vivieron. Vive destinos a través de los ojos de auténticos expertos.</p>
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
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button
                    onClick={handleDecodeSearch}
                    disabled={isSearchingDecode}
                    className="w-full md:w-auto bg-[#D4AF37] text-gray-900 hover:bg-[#EACD65] font-bold p-3 rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    {isSearchingDecode ? (
                      <svg className="animate-spin h-6 w-6 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      "Buscar"
                    )}
                  </button>
                </div>

                {(decodeSearchResults.length > 0 || kaiSuggestion) && (
                  <div className="mt-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {initialDecodeData.map(item => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                          <DecodeResultCard item={item} onClick={() => router.push('/packages/build/add-ons')} />
                        </motion.div>
                      ))}
                    </div>
                    {kaiSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="mt-6 text-center border-2 border-dashed border-[#D4AF37] bg-white shadow-xl p-6 rounded-lg max-w-xl mx-auto"
                      >
                        <span className="text-4xl">🤖</span>
                        <h4 className="font-bold text-xl text-[#D4AF37] mt-4" style={{ fontFamily: 'Playfair Display, serif' }}>Sugerencia de Kai</h4>
                        <p className="text-gray-800 mt-2 italic">{kaiSuggestion}</p>
                      </motion.div>
                    )}
                    {decodeSearchResults.length === 0 && !kaiSuggestion && decodeDestination && !isSearchingDecode && (
                      <p className="text-center text-gray-500 mt-8">No se encontraron resultados. Intenta con otra búsqueda.</p>
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

// --- Section Component: How It Works (v2) ---
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Planificá',
      description:
        'Elegí fechas, ciudad de origen, duración y presupuesto. Sumá filtros y mood si querés.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2a2 2 0 0 0-2 2v1h16V4a2 2 0 0 0-2-2H6Z" />
          <path d="M20 7H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM8 10h5v2H8v-2Z" />
        </svg>
      ),
    },
    {
      num: '2',
      title: 'Recibí la sorpresa',
      description:
        'Confirmá tu viaje. Te revelamos el destino 48 h antes y te enviamos la guía para ese mood.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm1.07-7.75-.9.92A2.51 2.51 0 0 0 12.5 12h-1v-1a1.5 1.5 0 0 1 .44-1.06l1.24-1.25a1.75 1.75 0 1 0-2.97-1.24H8a3.75 3.75 0 1 1 6.07 2.8Z"/>
        </svg>
      ),
    },
    {
      num: '3',
      title: 'Viajá sin estrés',
      description:
        'Hacé la valija. Pasajes y alojamiento listos; soporte humano cuando lo necesites.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Zm5-3h10v2H7V4Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-6 sm:px-8 bg-white text-neutral-900">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-14">
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            ¿Cómo funciona?
          </h2>
          <p className="mt-3 text-neutral-600">
            Tres pasos. Cero estrés. Más descubrimiento.
          </p>
        </header>

        <ol className="grid md:grid-cols-3 gap-8" role="list">
          {steps.map((s) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute -top-4 left-6 inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold shadow">
                {s.num}
              </div>

              <div className="mt-4 flex items-center gap-3 text-[#D97E4A]">
                {s.icon}
                <h3
                  className="text-xl md:text-2xl font-bold text-neutral-900"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {s.title}
                </h3>
              </div>

              <p className="mt-3 text-neutral-600">{s.description}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-xs text-neutral-500 text-center">
          * El destino se revela 48 horas antes para preservar la sorpresa. Se envía guía y checklist.
        </p>

        <div className="mt-10 flex justify-center">
          <GetRandomtripCta align="center" />
        </div>

        {/* Trust bar opcional (logos reales luego) */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 opacity-70">
          {['Confiado por viajeros', 'Atención humana 24/7', 'Pagos seguros', 'Pet-friendly ready'].map(
            (t) => (
              <div key={t} className="text-center text-sm text-neutral-600 border rounded-lg py-3">
                {t}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};

// --- Section Component: Key Benefits (v2) ---
const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: 'Sin estrés y Flexible',
      description: 'Decís cuánto querés gastar y cuándo; con opciones y filtros para adaptar la sorpresa a vos. Nosotros resolvemos lo demás.',
    },
    {
      title: 'Todo resuelto',
      description: 'Pasajes y alojamientos alineados a tu presupuesto y estilo de viaje.',
    },
    {
      title: 'Descubrimiento auténtico',
      description: 'Viví la emoción de lo inesperado con curaduría real, no al azar.',
    },
    // Podés activar estos dos si querés 5 columnas:
    // { title: 'Soporte humano', description: 'Personas (no bots) disponibles cuando las necesitás.' },
    // { title: 'Flexible', description: 'Opciones y filtros para adaptar la sorpresa a vos.' },
  ];

  return (
    <section className="py-20 bg-white text-neutral-900 px-6 sm:px-8 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Beneficios clave
          </h2>
          <p className="mt-3 text-neutral-600">
            Lo difícil es planificar. Lo inolvidable es viajar.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3
                className="text-xl md:text-2xl font-bold mb-2 text-neutral-900"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {b.title}
              </h3>
              <p className="text-neutral-600">{b.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <GetRandomtripCta align="center" />
        </div>

        {/* Agregar la sección de bandas aquí */}
        <div className="mt-16">
          <BudgetBandsSection />
        </div>

        <div className="mt-10 flex justify-center">
          <GetRandomtripCta align="center" />
        </div>
      </div>
    </section>
  );
};

// --- Section Component: Blog ---
const BlogSection: React.FC = () => {
    const posts = [
        { image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff', category: 'Inspiración', title: '5 Razones para Amar un Viaje Sorpresa' },
        { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Consejos', title: 'Cómo Hacer la Valija para un Destino Desconocido' },
        { image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', category: 'Experiencias', title: 'La Historia de un Randomtrip a los Alpes' },
        { image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3', category: 'Guías', title: 'Sabores del Sudeste Asiático' },
        { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Aventura', title: 'Recorriendo la Carretera Austral' },
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
        <section id="trippers-inspiration" className="py-20 px-8 bg-[#111827] text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                
                <div className="md:col-span-1 text-left">
                    <h2 className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Explora las historias de nuestros Trippers
                    </h2>
                    <p className="text-lg text-gray-300 mt-4">
                        Experiencias memorables para inspirar tu mente.
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
                    <GetRandomtripCta align="left" className="md:ml-0" />
                </div>

                <div className="md:col-span-2">
                    <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-8 pb-8 hide-scrollbar">
                        {posts.map(post => (
                            <BlogCard key={post.title} post={post} />
                        ))}
                        <Link href="/blog">
                            <div className="bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-6 w-80 flex-shrink-0 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700">
                                <div className="w-16 h-16 border-2 border-gray-500 rounded-full flex items-center justify-center mb-4">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </div>
                                <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>View All</h3>
                                <p className="text-gray-400 mt-2">Ir al Blog</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Section Component: Ready For Adventure ---
const ReadyForAdventureSection: React.FC = () => {
  return (
    <section
      aria-label="Sección final - Listo para la aventura"
      className="call-to-action-background h-[320px] text-white"
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          ¿Listo para la aventura?
        </h2>
        <p className="text-lg md:text-xl mb-6 max-w-md">
          Tu próximo recuerdo inolvidable está a un solo click de distancia.  
          No lo pienses más.
        </p>
        <Link
          href="/?tab=By%20Traveller#start-your-journey-anchor"
          aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
          className="bg-[#E59A60] hover:bg-[#d58b50] text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          RANDOMTRIPME!
        </Link>
      </div>
    </section>
  );
};

function HomeHeroBackground() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = React.useState(true);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  const SRC = '/videos/hero-video.mp4';
  const POSTER = '/images/journey-types/friends-group.jpg';

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduceMotion(mediaQuery.matches);
    handleChange(); // Initial check
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (video && !reduceMotion) {
      video.muted = true;
      video.play().catch(() => {
        console.error("Video playback failed.");
        setVideoOk(false);
      });
    }
  }, [reduceMotion]);

  return (
    <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
      {reduceMotion || !videoOk ? (
        <Img
          src={POSTER}
          alt="Friends traveling together"
          className="w-full h-full object-cover"
          width={1200} // Assuming a reasonable default width
          height={675} // Assuming a reasonable default height
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={POSTER}
          className="w-full h-full object-cover"
          onError={() => setVideoOk(false)}
        >
          {/* IMPORTANT: .webm should be first for better performance/compatibility */}
          <source src={SRC.replace('.mp4', '.webm')} type="video/webm" /> {/* Ensure this file exists! */}
          <source src={SRC} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      {/* Oscurecedor */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}

// --- Main Home Page Component ---
export default function HomePage() {
  return (
    <main className="bg-[#111827] text-white">
      {/* HERO */}
      <section
        id="home-hero"
        className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden"
      >
        <div id="hero-sentinel" className="absolute inset-x-0 top-0 h-4 pointer-events-none" />

        {/* Fondo con video robusto + poster + fallback */}
        <HomeHeroBackground />

        {/* Contenido del hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Donde termina la rutina, comienza la aventura.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Diseñamos la sorpresa. Odiamos la improvisación. Responde unas preguntas y nos encargaremos del resto.
          </p>
          <Link
            href="/?tab=By%20Traveller#start-your-journey-anchor"
            aria-label="Ir a 'Comienza tu Viaje' con la tab 'By Traveller' seleccionada"
            className="bg-[#D97E4A] text-white font-bold uppercase tracking-wider py-3 px-8 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] focus:ring-[#D4AF37] mt-8 animate-pulse-once"
          >
            RandomtripME!
          </Link>
        </div>

        {/* Indicador de scroll */}
        <style jsx global>{`
          @keyframes push-pulse {
            0% { transform: scaleY(0.2); opacity: 0.8; }
            50% { transform: scaleY(1); opacity: 1; }
            100% { transform: scaleY(0.2); opacity: 0.8; }
          }
          .scroll-indicator { display: flex; flex-direction: column; align-items: center; }
          .scroll-indicator::after {
            content: ''; display: block; width: 2px; height: 40px; background-color: white; margin-top: 0.75rem;
            transform-origin: bottom; animation: push-pulse 2s infinite;
          }
        `}</style>
        <div className="scroll-indicator pointer-events-none select-none z-10" aria-hidden="true">
          SCROLL
        </div>
      </section>

      {/* Resto del contenido existente de la home, INTACTO */}
      <HowItWorksSection />
      <BenefitsSection />
      <section id="inspiration" className="scroll-mt-28">
        <BlogSection />
      </section>
      <Suspense fallback={<PremiumLoader message="Preparando tu aventura..." />}><ExplorationPageContent /></Suspense>
      <EventFinder />
      <ReadyForAdventureSection />
      <FooterLanding />
    </main>
  );
}
