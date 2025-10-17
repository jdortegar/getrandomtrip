import type { AlmaSpec } from '@/types/planner';

// Family alma structure is different - it's a 2-step process
// Step 1: Choose family composition (who's traveling)
// Step 2: Choose escape type (what kind of trip)

export const FAMILY_ALMA_OPTIONS: Record<string, AlmaSpec> = {
  toddlers: {
    title: 'Con los más chicos',
    core: 'Cuando todavía hay cochecitos, mamaderas y siestas obligadas, todo cuenta… lo transformamos en juego y calma.',
    ctaLabel: 'Continuar →',
    tint: 'bg-orange-900/30',
    heroImg: '/images/journey-types/family-traveler.jpg',
    options: [
      {
        key: 'aventura',
        label: 'Aventura en familia',
        desc: 'Actividades pensadas para todas las edades.',
        img: '/images/journey-types/aventura-familiar.jpg',
      },
      {
        key: 'naturaleza',
        label: 'Naturaleza & fauna',
        desc: 'Descubrir la naturaleza con los más pequeños.',
        img: '/images/journey-types/naturaleza-y-fauna.jpg',
      },
      {
        key: 'playas',
        label: 'Playas & Dunas',
        desc: 'Días de playa y arena para toda la familia.',
        img: '/images/journey-types/playas-y-medanos.jpg',
      },
      {
        key: 'cultura',
        label: 'Cultura & tradiciones',
        desc: 'Experiencias culturales adaptadas para niños.',
        img: '/images/journey-types/cultura-y-tradiciones.jpg',
      },
    ],
  },
  teens: {
    title: 'Con adolescentes',
    core: 'Secretos para que dejen el celular: primero viven, después publican.',
    ctaLabel: 'Continuar →',
    tint: 'bg-teal-900/30',
    heroImg: '/images/journey-types/family-traveler.jpg',
    options: [
      {
        key: 'aventura',
        label: 'Aventura en familia',
        desc: 'Experiencias intensas que compiten con el WiFi.',
        img: '/images/journey-types/aventura-familiar.jpg',
      },
      {
        key: 'naturaleza',
        label: 'Naturaleza & fauna',
        desc: 'Actividades outdoor que desconectan para conectar.',
        img: '/images/journey-types/naturaleza-y-fauna.jpg',
      },
      {
        key: 'cultura',
        label: 'Cultura & tradiciones',
        desc: 'Experiencias culturales que realmente interesan.',
        img: '/images/journey-types/cultura-y-tradiciones.jpg',
      },
      {
        key: 'graduaciones',
        label: 'Graduaciones & celebraciones',
        desc: 'Celebrar los logros con un viaje memorable.',
        img: '/images/journey-types/graduaciones-y-celebraciones.jpg',
      },
    ],
  },
  adults: {
    title: 'Con hijos grandes',
    core: 'Aventuras más intensas: trekking, surf, cultura local.',
    ctaLabel: 'Continuar →',
    tint: 'bg-slate-900/30',
    heroImg: '/images/journey-types/family-traveler.jpg',
    options: [
      {
        key: 'aventura',
        label: 'Aventura en familia',
        desc: 'Experiencias desafiantes para disfrutar juntos.',
        img: '/images/journey-types/aventura-familiar.jpg',
      },
      {
        key: 'naturaleza',
        label: 'Naturaleza & fauna',
        desc: 'Trekking, surf y actividades outdoor intensas.',
        img: '/images/journey-types/naturaleza-y-fauna.jpg',
      },
      {
        key: 'cultura',
        label: 'Cultura & tradiciones',
        desc: 'Inmersión cultural profunda y auténtica.',
        img: '/images/journey-types/cultura-y-tradiciones.jpg',
      },
      {
        key: 'duos',
        label: 'Escapadas Madre-hij@ / Padre-hij@',
        desc: 'Tiempo de calidad uno a uno.',
        img: '/images/journey-types/Escapadas%20madre-hija%20-%20padre-hijo.jpg',
      },
    ],
  },
  multigen: {
    title: 'Con toda la familia',
    core: 'Nadie queda afuera. Logística y actividades para cada edad.',
    ctaLabel: 'Continuar →',
    tint: 'bg-amber-900/30',
    heroImg: '/images/journey-types/family-traveler.jpg',
    options: [
      {
        key: 'aventura',
        label: 'Aventura en familia',
        desc: 'Actividades para todas las generaciones.',
        img: '/images/journey-types/aventura-familiar.jpg',
      },
      {
        key: 'naturaleza',
        label: 'Naturaleza & fauna',
        desc: 'Experiencias al aire libre para todos.',
        img: '/images/journey-types/naturaleza-y-fauna.jpg',
      },
      {
        key: 'cultura',
        label: 'Cultura & tradiciones',
        desc: 'Historia y cultura que une generaciones.',
        img: '/images/journey-types/cultura-y-tradiciones.jpg',
      },
      {
        key: 'playas',
        label: 'Playas & Dunas',
        desc: 'Relax y diversión para todas las edades.',
        img: '/images/journey-types/playas-y-medanos.jpg',
      },
    ],
  },
};
