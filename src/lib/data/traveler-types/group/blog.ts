import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';

export const groupBlogData = {
  title: 'Historias de viajes en grupo',
  subtitle: 'Aventuras compartidas que se convierten en leyendas.',
  posts: [
    { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', category: 'Historias', title: '10 momentos que solo pasan viajando en grupo' },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', category: 'Consejos', title: 'Cómo organizar un viaje con amigos sin drama' },
    { image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429', category: 'Experiencias', title: 'La ruta del vino que hicimos entre 8' },
    { image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4', category: 'Guías', title: 'Destinos ideales para grupos grandes' },
    { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Aventura', title: 'Trekking en grupo: tips y risas' },
    { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Cultura', title: 'Festivales para ir con la barra' },
  ] as BlogPost[],
  viewAll: { title: 'Ver todas las historias', subtitle: 'Ir al Blog', href: '/blogs/group' } as BlogViewAll,
};

export const groupBlogTitle = groupBlogData.title;
export const groupBlogSubtitle = groupBlogData.subtitle;
export const groupBlogPosts = groupBlogData.posts;
export const groupBlogViewAll = groupBlogData.viewAll;
