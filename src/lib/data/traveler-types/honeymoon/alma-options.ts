import type { AlmaSpec } from '@/types/planner';

// Honeymoon uses a simplified structure - single tier only
// No alma selection needed, just goes directly to basic-config
export const HONEYMOON_ALMA_OPTIONS: Record<string, AlmaSpec> = {
  'romantic-paradise': {
    title: 'Paraíso Romántico',
    core: 'Playas paradisíacas, atardeceres inolvidables y momentos de intimidad perfecta.',
    ctaLabel: '✨ Crear su paraíso →',
    tint: 'bg-rose-900/30',
    heroImg: 'https://images.unsplash.com/photo-1519741497674-611481863552',
    options: [],
  },
  'luxury-escape': {
    title: 'Escapada de Lujo',
    core: 'Spa de clase mundial, cenas privadas con chef personal y el máximo confort.',
    ctaLabel: '✨ Vivir el lujo →',
    tint: 'bg-amber-900/30',
    heroImg: 'https://images.unsplash.com/photo-1687875495230-96dfea96d9da',
    options: [],
  },
  'adventure-honeymoon': {
    title: 'Luna de Miel Aventurera',
    core: 'Trekking por montañas, buceo en arrecifes y experiencias que aceleran el corazón.',
    ctaLabel: '✨ Empezar la aventura →',
    tint: 'bg-cyan-900/30',
    heroImg: 'https://images.unsplash.com/photo-1562337635-a4d98d22c1d2',
    options: [],
  },
  'cultural-romance': {
    title: 'Romance Cultural',
    core: 'Ciudades históricas, museos íntimos y tradiciones que enriquecen el alma.',
    ctaLabel: '✨ Descubrir juntos →',
    tint: 'bg-purple-900/30',
    heroImg: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
    options: [],
  },
};
