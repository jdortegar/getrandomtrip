import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';

export const honeymoonBlogData = {
  title: 'Historias de lunas de miel inolvidables',
  subtitle: 'El comienzo perfecto para su vida juntos.',
  posts: [
    { image: 'https://images.unsplash.com/photo-1519741497674-611481863552', category: 'Romance', title: 'Los destinos más románticos para luna de miel' },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', category: 'Consejos', title: 'Cómo planificar la luna de miel perfecta' },
    { image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd', category: 'Experiencias', title: 'Nuestra luna de miel sorpresa en la Toscana' },
    { image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4', category: 'Guías', title: 'Actividades románticas para recién casados' },
    { image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', category: 'Aventura', title: 'Luna de miel con adrenalina' },
    { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Cultura', title: 'Experiencias únicas para comenzar juntos' },
  ] as BlogPost[],
  viewAll: { title: 'Ver todas las historias', subtitle: 'Ir al Blog', href: '/blogs/honeymoon' } as BlogViewAll,
};

export const honeymoonBlogTitle = honeymoonBlogData.title;
export const honeymoonBlogSubtitle = honeymoonBlogData.subtitle;
export const honeymoonBlogPosts = honeymoonBlogData.posts;
export const honeymoonBlogViewAll = honeymoonBlogData.viewAll;
