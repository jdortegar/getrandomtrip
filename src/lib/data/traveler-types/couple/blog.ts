import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';

export const coupleBlogData = {
  title: 'Historias de parejas aventureras',
  subtitle: 'Experiencias únicas que solo ustedes dos podrán vivir.',
  posts: [
    {
      image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
      category: 'Romance',
      title: '5 Razones para Amar un Viaje Sorpresa en Pareja',
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
    {
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      category: 'Inspiración',
      title: 'Playas Escondidas de América Latina',
    },
  ] as BlogPost[],
  viewAll: {
    title: 'Más Historias',
    subtitle: 'Descubre todas nuestras aventuras y experiencias únicas',
    href: '/blog',
  } as BlogViewAll,
};

// Keep old exports for backwards compatibility
export const coupleBlogTitle = coupleBlogData.title;
export const coupleBlogSubtitle = coupleBlogData.subtitle;
export const coupleBlogPosts = coupleBlogData.posts;
export const coupleBlogViewAll = coupleBlogData.viewAll;
