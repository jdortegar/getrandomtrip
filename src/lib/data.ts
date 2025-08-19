import {
  type CityOption,
  type TripTypeOption,
  type TravelersOption,
  type Testimonial,
  type TripCard,
  type CityCard,
  type TrustSignal,
  type NewsletterHero,
  type TrustSignalItem,
  type CounterItem,
  type FooterData,
  type Feature,
  type Step,
  type Destination,
} from '@/lib/types';

// Cities data
export const cities: CityOption[] = [
  { code: 'lisboa', label: '🇵🇹 Lisboa', country: 'Portugal' },
  { code: 'madrid', label: '🇪🇸 Madrid', country: 'España' },
  { code: 'barcelona', label: '🇪🇸 Barcelona', country: 'España' },
  { code: 'valencia', label: '🇪🇸 Valencia', country: 'España' },
  { code: 'sevilla', label: '🇪🇸 Sevilla', country: 'España' },
  { code: 'bilbao', label: '🇪🇸 Bilbao', country: 'España' },
  { code: 'porto', label: '🇵🇹 Porto', country: 'Portugal' },
  { code: 'faro', label: '🇵🇹 Faro', country: 'Portugal' },
];

// Trip types data
export const tripTypes: TripTypeOption[] = [
  { value: 'vuelo_hotel', label: '✈️ Vuelo + Hotel' },
  { value: 'solo_hotel', label: '🏨 Solo Hotel' },
  { value: 'experiencia', label: '🎯 Experiencia' },
];

// Travelers options
export const travelersOptions: TravelersOption[] = [1, 2, 3, 4, 5, 6];

// Footer data
export const footerData: FooterData = {
  language: 'ESPAÑOL',
  contact: {
    email: 'hola@waynabox.com',
    phone: '+34 688 862 945',
  },
  waynaboxLinks: [
    { id: '1', text: 'Cómo funciona', url: '/como-funciona' },
    { id: '2', text: 'Ayuda (FAQs)', url: '/ayuda' },
    { id: '3', text: 'Opiniones', url: '/opiniones' },
    { id: '4', text: 'Pregunta a ChatGPT', url: '/chatgpt' },
  ],
  discoverLinks: [
    { id: '1', text: 'Hoteles', url: '/hoteles' },
    { id: '2', text: 'Blog', url: '/blog' },
  ],
  socialLinks: [
    {
      id: '1',
      name: 'Instagram',
      icon: 'Instagram',
      url: 'https://instagram.com',
    },
    { id: '2', name: 'TikTok', icon: 'Music', url: 'https://tiktok.com' },
    {
      id: '3',
      name: 'Facebook',
      icon: 'Facebook',
      url: 'https://facebook.com',
    },
    { id: '4', name: 'X', icon: 'Twitter', url: 'https://x.com' },
    { id: '5', name: 'YouTube', icon: 'Youtube', url: 'https://youtube.com' },
  ],
  newsletter: {
    placeholder: 'Escribe tu correo',
    buttonText: '¡Descubrir!',
    disclaimer: '*Al hacer click en quiero descuentos aceptas nuestra',
    privacyLink: 'política de privacidad.',
  },
  legal: {
    links: [
      { id: '1', text: 'Términos y condiciones', url: '/terminos' },
      { id: '2', text: 'Política de privacidad', url: '/privacidad' },
      { id: '3', text: 'Política de Cookies', url: '/cookies' },
      { id: '4', text: 'Random Trip en detalle', url: '/detalle' },
    ],
    copyright: '© 2025 Wayna Aero S.L. - B98649247',
    companyInfo: 'Accredited Agent',
  },
};

// Counter Items data
export const counterItems: CounterItem[] = [
  {
    id: '1',
    number: '220.603',
    label: 'noches de hotel',
  },
  {
    id: '2',
    number: '832.765',
    label: 'horas de vuelo',
  },
  {
    id: '3',
    number: '90.877',
    label: 'selfies wayners',
  },
  {
    id: '4',
    number: '45.802.794',
    label: 'km recorridos',
  },
];

// Trust Signal Items data
export const trustSignalItems: TrustSignalItem[] = [
  {
    id: '1',
    title: 'DESTINOS ÚNICOS',
    description:
      'Siempre volarás sin escalas a destinos especiales. Puedes descartar los que no te interesan y evitar repetir si ya viajaste con nosotros.',
    icon: 'MapPin',
    color: 'text-red-500',
  },
  {
    id: '2',
    title: 'ALOJAMIENTO DE CALIDAD',
    description:
      'Dormirás en hoteles, apartamentos o casas rurales con buena ubicación, comunicación y valoración en TripAdvisor.',
    icon: 'Bed',
    color: 'text-blue-500',
  },
  {
    id: '3',
    title: 'PRECIOS IMBATIBLES',
    description:
      'Al no revelar el destino, podemos negociar condiciones especiales con alojamientos y proveedores.',
    icon: 'Euro',
    color: 'text-yellow-500',
  },
  {
    id: '4',
    title: 'ATENCIÓN PERSONALIZADA',
    description:
      'Nuestro equipo de Atención al Cliente resolverá todas tus dudas antes, durante y después del viaje.',
    icon: 'Headphones',
    color: 'text-blue-600',
  },
];

// Newsletter Hero data
export const newsletterHero: NewsletterHero = {
  title: '¡LLÉVATE LA GUÍA DE LOS VIAJEROS MÁS ATREVIDOS!',
  subtitle:
    'Además llévate un descuento de bienvenida para tu próximo viaje sorpresa.',
  placeholder: 'Escribe tu correo',
  buttonText: '¡Descubrir!',
  disclaimer: 'Al hacer click en quiero descuentos aceptas nuestra',
  privacyLink: 'política de privacidad.',
  backgroundImage:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
};

// Trust Signals data
export const trustSignals: TrustSignal[] = [
  {
    id: '1',
    title: 'ELIGE UNA EXPERIENCIA',
    description:
      'Elige la aventura sorpresa que prefieras. Viaje en avión o en coche... ¡tú decides!',
    icon: 'Calendar',
  },
  {
    id: '2',
    title: 'PERSONALIZA TU RESERVA',
    description:
      'Selecciona las fechas y elige los detalles de tu experiencia. ¡La emoción está garantizada desde el primer momento!',
    icon: 'MapPin',
  },
  {
    id: '3',
    title: '¡SORPRESA!',
    description: 'Descubrirás tu aventura 48h antes de viajar!',
    icon: 'PartyPopper',
  },
];

// City Cards data for the scroll component
export const cityCards: CityCard[] = [
  {
    id: 'porto',
    name: 'OPORTO',
    imageUrl:
      'https://images.unsplash.com/photo-1582234372722-597e97be71f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'paris',
    name: 'PARÍS',
    imageUrl:
      'https://images.unsplash.com/photo-1502602898669-a90387078e79?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'berlin',
    name: 'BERLÍN',
    imageUrl:
      'https://images.unsplash.com/photo-1560969185-c684a9135d75?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'lisboa',
    name: 'LISBOA',
    imageUrl:
      'https://images.unsplash.com/photo-1583204727590-e777d357391f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'bruselas',
    name: 'BRUSELAS',
    imageUrl:
      'https://images.unsplash.com/photo-1559561853-c5730017590a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'praga',
    name: 'PRAGA',
    imageUrl:
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'bolonia',
    name: 'BOLONIA',
    imageUrl:
      'https://images.unsplash.com/photo-1558659004-43b73590074d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'roma',
    name: 'ROMA',
    imageUrl:
      'https://images.unsplash.com/photo-1529260810708-8d53048597e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'londres',
    name: 'LONDRES',
    imageUrl:
      'https://images.unsplash.com/photo-1505761671935-60b3a7487170?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'dublin',
    name: 'DUBLÍN',
    imageUrl:
      'https://images.unsplash.com/photo-1547982300-c0628172776b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'atenas',
    name: 'ATENAS',
    imageUrl:
      'https://images.unsplash.com/photo-1597659843121-bb8b060c0f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
  {
    id: 'frankfurt',
    name: 'FRANKFURT',
    imageUrl:
      'https://images.unsplash.com/photo-1558420437-f56a7770777d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600&q=80',
  },
];

// Trip cards data
export const tripCards: TripCard[] = [
  {
    id: '1',
    title: 'ISLA SORPRESA',
    description: 'Descubre las mejores islas donde perderte',
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    link: '/isla-sorpresa',
  },
  {
    id: '2',
    title: 'SORPRESA EN EUROPA',
    description: 'Descubre tu destino 2 días antes de viajar',
    imageUrl:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    link: '/sorpresa-europa',
  },
  {
    id: '3',
    title: 'SORPRESA EN AMÉRICA',
    description: 'Las mejores ciudades al otro lado del Atlántico',
    imageUrl:
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    link: '/sorpresa-america',
  },
  {
    id: '4',
    title: 'REGALA RANDOM TRIP',
    description: 'Caducidad ilimitada',
    imageUrl:
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    link: '/regala-random-trip',
  },
];

// Testimonials data
export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Daniela Galata',
    avatar: '/api/placeholder/60/60',
    rating: 5,
    date: 'Julio, 2025',
    review:
      'Era la primera vez que usaba Random Trip. Mi destino era Praga. Nunca había estado allí. Debo decir que fue maravilloso.',
    googleReviewUrl: '#',
  },
  {
    id: '2',
    name: 'Laura Lago Brenes',
    avatar: '/api/placeholder/60/60',
    rating: 5,
    date: 'Julio, 2025',
    review:
      'Experiencia de 10. Hotel Num en Salou. Ya es mi segunda escapada sorpresa por carretera con vosotros.',
    googleReviewUrl: '#',
  },
  {
    id: '3',
    name: 'Ilenia C.',
    avatar: '/api/placeholder/60/60',
    rating: 5,
    date: 'Junio, 2025',
    review:
      '¡Random Trip cambió nuestras vacaciones! Sin estrés de organización, destinos maravillosos y precios razonables.',
    googleReviewUrl: '#',
  },
  {
    id: '4',
    name: 'Marta Roldán',
    avatar: '/api/placeholder/60/60',
    rating: 5,
    date: 'Junio, 2025',
    review:
      'El factor sorpresa del viaje con Random Trip es genial. Hemos hecho varios, Ginebra, Milán y Nantes. Unos hoteles estupendos y céntricos, horarios de vuelo para aprovechar al máximo!! Os hemos...',
    googleReviewUrl: '#',
  },
  {
    id: '5',
    name: 'Carlos Méndez',
    avatar: '/api/placeholder/60/60',
    rating: 5,
    date: 'Mayo, 2025',
    review:
      'Increíble experiencia. El viaje sorpresa superó todas nuestras expectativas. Lisboa nos enamoró completamente.',
    googleReviewUrl: '#',
  },
  {
    id: '6',
    name: 'Ana Torres',
    avatar: '/api/placeholder/60/60',
    rating: 5,
    date: 'Mayo, 2025',
    review:
      'Perfecto para celebrar nuestro aniversario. Barcelona fue la elección ideal y todo estuvo impecable.',
    googleReviewUrl: '#',
  },
];

// Features data
export const features: Feature[] = [
  {
    id: '1',
    title: 'Experiencia Premium',
    description:
      'Acceso exclusivo a los mejores hoteles y experiencias que solo los expertos conocen.',
    icon: 'Crown',
    gradient: 'from-pink-500 to-red-500',
  },
  {
    id: '2',
    title: 'Garantía de Calidad',
    description:
      'Cada viaje es cuidadosamente seleccionado y verificado para garantizar la máxima calidad.',
    icon: 'Award',
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    id: '3',
    title: 'Reconocimiento Internacional',
    description:
      'Premios y reconocimientos de las principales revistas de viajes del mundo.',
    icon: 'Trophy',
    gradient: 'from-green-500 to-teal-500',
  },
];

// How it works steps
export const steps: Step[] = [
  {
    id: '1',
    number: 1,
    title: 'Elige tus preferencias',
    description:
      'Selecciona fechas, número de viajeros y cualquier ciudad que quieras excluir.',
    gradient: 'from-pink-500 to-red-500',
  },
  {
    id: '2',
    number: 2,
    title: 'Personaliza tu experiencia',
    description:
      'Añade extras como equipaje, seguro de viaje o late checkout según tus necesidades.',
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    id: '3',
    number: 3,
    title: 'Descubre tu destino',
    description:
      'Recibe la revelación de tu destino y todos los detalles de tu viaje sorpresa.',
    gradient: 'from-green-500 to-teal-500',
  },
];

// Popular destinations
export const destinations: Destination[] = [
  {
    id: '1',
    name: 'Lisboa',
    country: 'Portugal',
    description:
      'La ciudad de las siete colinas te espera con su encanto único y gastronomía excepcional.',
    price: 'Desde €299',
    gradient: 'from-blue-400 to-purple-500',
  },
  {
    id: '2',
    name: 'Madrid',
    country: 'España',
    description:
      'La capital española te sorprenderá con su vibrante cultura y vida nocturna.',
    price: 'Desde €349',
    gradient: 'from-red-400 to-orange-500',
  },
  {
    id: '3',
    name: 'Barcelona',
    country: 'España',
    description:
      'Arquitectura única, playas mediterráneas y una gastronomía de vanguardia.',
    price: 'Desde €399',
    gradient: 'from-green-400 to-blue-500',
  },
  {
    id: '4',
    name: 'Porto',
    country: 'Portugal',
    description:
      'La ciudad del vino de Oporto te cautivará con su historia y tradición vinícola.',
    price: 'Desde €279',
    gradient: 'from-purple-400 to-pink-500',
  },
];

// Footer data
export const footerDestinations = ['Portugal', 'España', 'Italia', 'Francia'];

export const footerSupport = [
  'Centro de ayuda',
  'Contacto',
  'FAQ',
  'Política de privacidad',
];

// (no helpers exported here; this file holds only data content)
