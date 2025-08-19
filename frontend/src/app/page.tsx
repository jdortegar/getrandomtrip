'use client'; 

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PrimaryButton from '@/components/PrimaryButton';
import BlogCard from '@/components/BlogCard';
import EventFinder from '@/components/EventFinder';
import TabButton from '@/components/TabButton';
import TravelerTypeCard from '@/components/TravelerTypeCard';
import TripperCard from '@/components/TripperCard';
import RoadtripCard from '@/components/RoadtripCard';
import DecodeResultCard from '@/components/DecodeResultCard';
import { motion, AnimatePresence } from 'framer-motion';
import { TRIPPERS } from "@/content/trippers";
import { slugify } from '@/lib/slugify';

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
];

const initialRoadtripTypes: RoadtripType[] = [
  { type: 'Car', description: 'Libertad sobre ruedas.', bgImage: '/images/journey-types/roadtrip-car.jpg', query: 'scenic car roadtrip mountain' },
  { type: 'Motorcycle', description: 'Siente el camino y el viento.', bgImage: '/images/journey-types/roadtrip-motorcycle.jpg', query: 'motorcycle adventure open road' },
  { type: 'Bike', description: 'Una aventura a tu propio ritmo.', bgImage: '/images/journey-types/roadtrip-bike.jpg', query: 'bicycle touring nature path' },
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

  const [tripperSearchState, setTripperSearchState] = useState<'initial' | 'categories' | 'searching' | 'found'>('initial');
  const [foundTripper, setFoundTripper] = useState<{name: string, img: string} | null>(null);
  const [decodeDestination, setDecodeDestination] = useState('');
  const [decodeMonth, setDecodeMonth] = useState('');
  const [decodeSearchResults, setDecodeSearchResults] = useState<DecodeItem[]>([]);
  const [kaiSuggestion, setKaiSuggestion] = useState('');
  const [isSearchingDecode, setIsSearchingDecode] = useState(false);

  const findTripper = (name: string) => {
    if (name.trim()) {
      const found = TRIPPERS.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
      setFoundTripper(found ? { name: found.name, img: found.avatar } : { name: 'Tripper no encontrado', img: '/images/fallback.jpg' });
      setTripperSearchState('found');
    }
  };

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
                  {initialTravellerTypes.map((type) => (
                    <motion.div
                      key={type.title}
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

            {activeTab === 'Top Trippers' && (
              <div id="top-trippers" className="py-8">
                <p className="text-center text-gray-600 mb-8 italic">Ellos ya dejaron huella. ¿Quién será tu cómplice de viaje?</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
                  {TRIPPERS.map(tripper => (
                    <motion.div
                      key={tripper.name}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <TripperCard key={tripper.name} name={tripper.name} img={tripper.avatar} onClick={() => router.push(`/packages/${tripper.slug}`)} />
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative group rounded-2xl overflow-hidden shadow-xl hover:scale-[1.03] transition-all cursor-pointer bg-white text-gray-900 flex flex-col items-center justify-center p-6 min-h-[196px]"
                  >
                    {tripperSearchState === 'initial' && (
                      <div onClick={() => setTripperSearchState('categories')} className="cursor-pointer text-center">
                        <h3 className="font-bold text-lg">Busca a tu Tripper favorito</h3>
                        <p className="text-sm text-gray-400 mt-1">Haz click aquí</p>
                      </div>
                    )}
                    {tripperSearchState === 'categories' && (
                      <div className="w-full flex flex-col space-y-2 text-center">
                        <h3 className="font-bold text-lg mb-2">Busca por Categoría</h3>
                        <button onClick={() => setTripperSearchState('searching')} className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900">Travel Bloggers</button>
                        <button onClick={() => setTripperSearchState('searching')} className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900">Creadores</button>
                        <button onClick={() => setTripperSearchState('searching')} className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded transition-colors text-gray-900">Travel Advisors</button>
                      </div>
                    )}
                    {tripperSearchState === 'searching' && (
                      <form onSubmit={(e) => { e.preventDefault(); findTripper((e.target as HTMLFormElement).tripperName.value); }} className="w-full flex flex-col items-center">
                        <h3 className="font-bold text-lg mb-2">Nombre del Tripper</h3>
                        <input
                          name="tripperName"
                          type="text"
                          placeholder="Escribe un nombre..."
                          autoFocus
                          className="w-full bg-gray-100 text-gray-900 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none placeholder-gray-500"
                        />
                        <button type="submit" className="mt-4 w-full bg-[#D4AF37] text-gray-900 hover:bg-[#EACD65] py-3 rounded-lg transition-colors font-bold">Buscar</button>
                      </form>
                    )}
                    {tripperSearchState === 'found' && foundTripper && (
                      <div className="flex flex-col items-center text-center">
                        <img src={foundTripper.img} alt={foundTripper.name} className='w-24 h-24 rounded-full border-4 border-[#D4AF37]' />
                        <h3 className='mt-2 font-semibold text-gray-900'>{foundTripper.name}</h3>
                        <p className="text-xs text-[#D4AF37]">¡Tripper encontrado!</p>
                        <button onClick={() => router.push('/journey/experience-level')} className="text-sm text-gray-600 mt-2 hover:text-gray-900 transition-colors">Continuar con {foundTripper.name.split(' ')[0]}</button>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            )}

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
                        onClick={() => router.push('/packages/build/basic-config')}
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

// --- Section Component: How It Works ---
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#D97E4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: '1. Planificá',
      description: 'Elegí fechas, ciudad de origen, duración y presupuesto. Añadí filtros si querés.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#D97E4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M10 14h.01M14 14h.01M9 18h6" />
        </svg>
      ),
      title: '2. Sorprendete',
      description: 'Confirmá tu viaje. Te revelaremos tu destino 48 horas antes de partir.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#D97E4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      title: '3. Disfrutá',
      description: 'Hacé las valijas y preparate para una aventura inolvidable. ¡Nosotros nos encargamos del resto!',
    },
  ];

  return (
    <section className="py-20 px-8 bg-white text-black">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>¿Cómo funciona?</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(step => (
            <div key={step.title} className="text-center flex flex-col items-center">
              <div className="flex justify-center mb-6">{step.icon}</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>{step.title}</h3>
              <p className="text-gray-600 max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Section Component: Key Benefits ---
const BenefitsSection: React.FC = () => {
    const benefits = [
        { title: 'Sin Estrés', description: 'Olvidate de horas planeando. Nosotros lo hacemos por vos.'},
        { title: 'Todo Resuelto', description: 'Vuelos y alojamiento adaptados a tu presupuesto.' },
        { title: 'Descubrimiento Auténtico', description: 'Viví la emoción de lo inesperado.' }
    ];
    return (
        <section className="py-20 bg-white text-black px-8 border-t border-gray-200">
             <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>Beneficios Clave</h2>
                <div className="grid md:grid-cols-3 gap-10">
                    {benefits.map(benefit => (
                           <div key={benefit.title} className="text-center px-4">
                               <h3 className="text-2xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>{benefit.title}</h3>
                               <p className="text-gray-600">{benefit.description}</p>
                           </div>
                    ))}
                </div>
             </div>
        </section>
    )
}

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
  const router = useRouter();
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

const AppFooter: React.FC = () => {
  const footerLinks = {
    'USEFUL INFORMATION': [
      { label: 'About Us', href: '#' },
      { label: 'Booking Conditions', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'Frequently Asked Questions', href: '#' },
      { label: 'Online Enquiry', href: '#' },
      { label: 'Press Room', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Regenerative Travel', href: '#' },
      { label: 'Sitemap', href: '#' },
      { label: 'Travel Insurance', href: '#' },
    ],
    'POPULAR DESTINATIONS': [
      { label: 'Argentina', href: '#' },
      { label: 'Canada', href: '#' },
      { label: 'Chile', href: '#' },
      { label: 'Iceland', href: '#' },
      { label: 'Italy', href: '#' },
      { label: 'Japan', href: '#' },
      { label: 'Kenya', href: '#' },
      { label: 'Morocco', href: '#' },
      { label: 'Peru', href: '#' },
      { label: 'Thailand', href: '#' },
      { label: 'The USA', href: '#' },
    ],
    'WHO': [
      { label: 'Couples', href: '#' },
      { label: 'Family', href: '#' },
      { label: 'Group', href: '#' },
      { label: 'Honeymoons', href: '#' },
      { label: 'Solo', href: '#' },
      { label: 'James Bond', href: '#' }, // Example, adapt as needed
      { label: 'Adventures', href: '#' },
    ],
    'WHAT': [
      { label: 'Pursuit Of Feeling', href: '#' },
      { label: 'Feelings Engine', href: '#' },
      { label: 'See You In The Moment', href: '#' },
      { label: 'Live Me On A Story', href: '#' },
      { label: 'James Bond', href: '#' }, // Example, adapt as needed
      { label: 'Adventures', href: '#' },
      { label: 'Beach', href: '#' },
      { label: 'Bhutan', href: '#' },
      { label: 'Eclipse', href: '#' },
      { label: 'Field Trip', href: '#' },
      { label: 'Food', href: '#' },
      { label: 'Get Lost', href: '#' },
      { label: 'Safari', href: '#' },
      { label: 'Unusual', href: '#' },
    ],
  };

  const socialLinks = [
    {
      name: 'Instagram',
      href: '#',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/instagram.svg'
    },
    {
      name: 'YouTube',
      href: '#',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/youtube.svg'
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/linkedin.svg'
    },
    {
      name: 'TikTok',
      href: '#',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/tiktok.svg'
    }
  ];

  return (
    <footer className="bg-[#0D0D0D] text-gray-400 py-16 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Optional: Add the "SO, READY TO START?" section here if it's part of the footer */}
        {/* For now, assuming it's part of ReadyForAdventureSection */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white text-lg font-semibold mb-4 uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>{category}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-white transition-colors text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          {/* NEW SOCIAL SHARE SECTION */}
          <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
            <h3 className="uppercase text-sm tracking-widest mb-4">Comparte tus viajes</h3>
            <div className="flex space-x-6">
              <a href="#" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/instagram.svg" alt="Instagram" className="h-6 w-6 filter-invert" />
              </a>
              <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/youtube.svg" alt="YouTube" className="h-6 w-6 filter-invert" />
              </a>
              <a href="#" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/linkedin.svg" alt="LinkedIn" className="h-6 w-6 filter-invert" />
              </a>
              <a href="#" aria-label="TikTok" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/tiktok.svg" alt="TikTok" className="h-6 w-6 filter-invert" />
              </a>
            </div>
          </div>
          {/* END NEW SOCIAL SHARE SECTION */}
          <div className="mb-4 md:mb-0">
            <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>© 2025 Randomtrip. Where the routine ends, the adventure begins.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main Home Page Component ---
export default function HomePage() {
  const router = useRouter();

  return (
    <main className="bg-[#111827] text-white">
      {/* HERO */}
      <section
        id="home-hero"
        className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden"
      >
        {/* Sentinel para el navbar (overlay vs sólido) */}
        <div id="hero-sentinel" className="absolute inset-x-0 top-0 h-4 pointer-events-none" />

        {/* Capa de fondo (video o imagen que ya tengas) */}
        <div className="absolute top-0 left-0 w-full h-full z-0">
          <video src="/videos/hero-video.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Oscurecedor */}
        <div className="absolute inset-0 bg-black/40 z-0" />

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

        {/* Indicador de scroll (unificado) */}
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
      <AppFooter />
    </main>
  );
}