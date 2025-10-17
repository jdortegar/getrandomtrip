import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';

export const familyBlogData = {
  title: 'Nuestros destinos favoritos para viajar en familia',
  subtitle: 'Historias, destinos y gatillos creativos para elegir mejor.',
  posts: [
    { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', category: 'Inspiración', title: 'Explora las historias de nuestros Trippers' },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', category: 'Consejos', title: 'Nuestros lugares favoritos para toda la familia' },
    { image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429', category: 'Experiencias', title: 'Ideas para distintas edades y estilos' },
    { image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4', category: 'Guías', title: 'Cómo planificar un finde familiar sin estrés' },
    { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Aventura', title: 'Naturaleza cerca de casa: 5 escapadas' },
    { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Cultura', title: 'Fiestas locales para ir con chicos' },
  ] as BlogPost[],
  viewAll: { title: 'Ver todas las historias', subtitle: 'Ir al Blog', href: '/blogs/families' } as BlogViewAll,
};

export const familyBlogTitle = familyBlogData.title;
export const familyBlogSubtitle = familyBlogData.subtitle;
export const familyBlogPosts = familyBlogData.posts;
export const familyBlogViewAll = familyBlogData.viewAll;
