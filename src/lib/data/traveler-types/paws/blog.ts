import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';

export const pawsBlogData = {
  title: 'Aventuras con tu mejor amigo',
  subtitle: 'Destinos y consejos para viajar con tu mascota.',
  posts: [
    { image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e', category: 'Consejos', title: 'Cómo viajar con tu mascota sin estrés' },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', category: 'Destinos', title: 'Los mejores destinos pet-friendly' },
    { image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', category: 'Experiencias', title: 'Nuestro viaje con Max por la Patagonia' },
    { image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4', category: 'Guías', title: 'Documentación necesaria para viajar con mascotas' },
    { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Aventura', title: 'Trekking con perros: rutas recomendadas' },
    { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Salud', title: 'Tips veterinarios para viajes largos' },
  ] as BlogPost[],
  viewAll: { title: 'Ver todas las historias', subtitle: 'Ir al Blog', href: '/blogs/paws' } as BlogViewAll,
};

export const pawsBlogTitle = pawsBlogData.title;
export const pawsBlogSubtitle = pawsBlogData.subtitle;
export const pawsBlogPosts = pawsBlogData.posts;
export const pawsBlogViewAll = pawsBlogData.viewAll;
