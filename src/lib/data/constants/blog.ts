export const BLOG_CONSTANTS = {
  SECTION: {
    TITLE: 'Explora las historias de nuestros Trippers',
    SUBTITLE: 'Experiencias memorables para inspirar tu mente.',
    ID: 'trippers-inspiration',
  },

  POSTS: [
    {
      image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
      category: 'Inspiración',
      title: '5 Razones para Amar un Viaje Sorpresa',
    },
    {
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
      category: 'Consejos',
      title: 'Cómo Hacer la Valija para un Destino Desconocido',
    },
    {
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
      category: 'Experiencias',
      title: 'La Historia de un Randomtrip a los Alpes',
    },
    {
      image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
      category: 'Guías',
      title: 'Sabores del Sudeste Asiático',
    },
    {
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
      category: 'Aventura',
      title: 'Recorriendo la Carretera Austral',
    },
  ] as const,

  VIEW_ALL: {
    TITLE: 'Más Historias',
    SUBTITLE: 'Descubre todas nuestras aventuras y experiencias únicas',
    HREF: '/blog',
  },

  SCROLL: {
    AMOUNT: 0.8, // 80% of container width
  },
} as const;
