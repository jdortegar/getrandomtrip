import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';

export const soloBlogData = {
  title: 'Nuestros destinos favoritos para viajar solo',
  subtitle: 'El camino en solitario no significa estar solo. Estas historias y destinos te muestran que perderte también es otra forma de encontrarte.',
  posts: [
    { image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828', category: 'Independencia', title: 'Viajar Solo: La Mejor Decisión que Puedes Tomar' },
    { image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', category: 'Seguridad', title: 'Consejos de Seguridad para Viajeros Solitarios' },
    { image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', category: 'Destinos', title: 'Los Mejores Destinos para tu Primer Viaje Solo' },
    { image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3', category: 'Presupuesto', title: 'Cómo Viajar Solo Sin Gastar de Más' },
    { image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60', category: 'Experiencias', title: 'Conociendo Personas en el Camino' },
    { image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', category: 'Inspiración', title: 'El Arte de Viajar en Solitario' },
  ] as BlogPost[],
  viewAll: { title: 'Ver todas las historias', subtitle: 'Más aventuras en solitario', href: '/blog/solo' } as BlogViewAll,
};

export const soloBlogTitle = soloBlogData.title;
export const soloBlogSubtitle = soloBlogData.subtitle;
export const soloBlogPosts = soloBlogData.posts;
export const soloBlogViewAll = soloBlogData.viewAll;
