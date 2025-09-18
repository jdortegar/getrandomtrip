export const NAVBAR_CONSTANTS = {
  HEIGHT: 'h-16', // Increased height for better spacing
  MAX_WIDTH: 'max-w-7xl',
  PADDING: 'px-4 sm:px-6 lg:px-8',
  SPACER_HEIGHT: 'h-16', // Match navbar height
} as const;

export const NAVBAR_LINKS = [
  {
    href: '/?tab=Top%20Trippers#start-your-journey-anchor',
    label: 'Trippers',
    ariaLabel:
      "Ir a la sección 'Comienza tu Viaje' con la tab 'Top Trippers' seleccionada",
  },
  {
    href: '/#inspiration',
    label: 'Inspiración',
    ariaLabel: 'Ir a la sección de inspiración',
    prefetch: false,
  },
  {
    href: '/nosotros',
    label: 'Nosotros',
    ariaLabel: 'Ir a la página sobre nosotros',
  },
  {
    href: '/tripbuddy',
    label: 'IA TripBuddy',
    ariaLabel: 'Ir a IA TripBuddy',
  },
  {
    href: '/bitacoras',
    label: 'Off the Record: Bitácoras del Continente',
    ariaLabel: 'Ir a Off the Record: Bitácoras del Continente',
  },
] as const;

export const NAVBAR_STYLES = {
  SOLID:
    'fixed top-0 inset-x-0 z-50 bg-white/70 text-neutral-900 backdrop-blur-md shadow ring-1 ring-black/5 transition-all duration-500 ease-in-out',
  OVERLAY:
    'fixed top-0 inset-x-0 z-50 bg-white/0 text-white backdrop-blur-md transition-all duration-500 ease-in-out',
} as const;
