export interface BlogPost {
  image: string;
  category: string;
  title: string;
  href?: string;
}

export interface BlogViewAll {
  title: string;
  subtitle: string;
  href: string;
}

export interface BlogContent {
  title: string;
  subtitle: string;
  posts: BlogPost[];
  viewAll?: BlogViewAll;
}

export function getBlogDataByPackage(packageType: string): BlogContent {
  const blogContents: Record<string, BlogContent> = {
    couple: {
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
      ],
      viewAll: {
        title: 'Más Historias',
        subtitle: 'Descubre todas nuestras aventuras y experiencias únicas',
        href: '/blog',
      },
    },
    solo: {
      title: 'Nuestros destinos favoritos para viajar solo',
      subtitle:
        'El camino en solitario no significa estar solo. Estas historias y destinos te muestran que perderte también es otra forma de encontrarte.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
          category: 'Inspiración',
          title: '5 Razones para Hacer tu Primer Viaje Solo',
        },
        {
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          category: 'Consejos',
          title: 'Cómo Empacar Ligero para una Aventura en Solitario',
        },
        {
          image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
          category: 'Experiencias',
          title: 'La Historia de un Randomtrip en Solitario por la Patagonia',
        },
        {
          image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
          category: 'Guías',
          title: 'Sabores que Solo Descubrirás Viajando Solo por Asia',
        },
        {
          image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
          category: 'Aventura',
          title: 'Un Camino que se Recorre Mejor Solo: Carretera Austral',
        },
        {
          image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
          category: 'Inspiración',
          title: 'Lo que Aprendés Cuando Viajas Solo',
        },
      ],
      viewAll: {
        title: 'View all',
        subtitle: 'Ir al Blog',
        href: '/blogs/solo',
      },
    },
    families: {
      title: 'Nuestros destinos favoritos para viajar en familia',
      subtitle: 'Historias, destinos y gatillos creativos para elegir mejor.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
          category: 'Inspiración',
          title: 'Explora las historias de nuestros Trippers',
        },
        {
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          category: 'Consejos',
          title: 'Nuestros lugares favoritos para toda la familia',
        },
        {
          image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
          category: 'Experiencias',
          title: 'Ideas para distintas edades y estilos',
        },
        {
          image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
          category: 'Guías',
          title: 'Cómo planificar un finde familiar sin estrés',
        },
        {
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          category: 'Aventura',
          title: 'Naturaleza cerca de casa: 5 escapadas',
        },
        {
          image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
          category: 'Cultura',
          title: 'Fiestas locales para ir con chicos',
        },
      ],
      viewAll: {
        title: 'View all',
        subtitle: 'Ir al Blog',
        href: '/blogs/families',
      },
    },
    group: {
      title: 'Historias de viajes en grupo',
      subtitle: 'Aventuras compartidas que se convierten en leyendas.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
          category: 'Historias',
          title: '10 momentos que solo pasan viajando en grupo',
        },
        {
          image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b',
          category: 'Consejos',
          title: 'Cómo alinear expectativas sin matar la sorpresa',
        },
        {
          image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38',
          category: 'Experiencias',
          title: 'Un Randomtrip con amigos que terminó en ritual',
        },
        {
          image: 'https://images.unsplash.com/photo-1474631245212-32dc3c8310c6',
          category: 'Guías',
          title: 'Offsite inolvidable: 6 ideas para equipos',
        },
        {
          image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
          category: 'Fantasía',
          title: 'Vivir una saga: rutas para cinéfilos y gamers',
        },
        {
          image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
          category: 'Música',
          title: 'Festivales & escenas locales: cómo elegir',
        },
      ],
      viewAll: {
        title: 'View all',
        subtitle: 'Ir al Blog',
        href: '/blogs/group',
      },
    },
    honeymoon: {
      title: 'Lunas de miel que son prólogos',
      subtitle:
        'Historias de parejas que comenzaron su vida juntos con sorpresa y magia.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          category: 'Playas & Dunas',
          title: 'Arenas doradas y promesas al atardecer',
        },
        {
          image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
          category: 'Naturaleza',
          title: 'Cordilleras, lagos y la calma de estar a dos',
        },
        {
          image: 'https://images.unsplash.com/photo-1526312426976-593c2d0a3d5b',
          category: 'Cultura',
          title: 'Ciudades que susurran historias para dos',
        },
        {
          image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03',
          category: 'Gastronomía',
          title: 'Viñedos, sobremesas y conversaciones infinitas',
        },
        {
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          category: 'Aventura',
          title: 'Roadtrips, miradas y playlists compartidas',
        },
        {
          image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
          category: 'Música',
          title: 'Pequeñas salas, grandes canciones',
        },
      ],
      viewAll: {
        title: 'View all',
        subtitle: 'Ir al Blog',
        href: '/blogs/honeymoon',
      },
    },
    paws: {
      title: 'Aventuras con huellas',
      subtitle: 'Historias de viajes donde las mascotas son protagonistas.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
          category: 'Patagonia',
          title: 'Patagonia con tu mejor amigo',
        },
        {
          image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
          category: 'Hoteles',
          title: 'Hoteles pet-friendly en la costa',
        },
        {
          image: 'https://images.unsplash.com/photo-1526312426976-593c2d0a3d5b',
          category: 'Actividades',
          title: 'Actividades al aire libre dog-friendly',
        },
        {
          image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03',
          category: 'Viajes',
          title: 'Viajes en auto con mascotas',
        },
        {
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          category: 'Salud',
          title: 'Salud y seguridad en viajes con mascotas',
        },
        {
          image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
          category: 'Destinos',
          title: 'Destinos internacionales pet-friendly',
        },
      ],
      viewAll: {
        title: 'View all',
        subtitle: 'Ir al Blog',
        href: '/blogs/paws',
      },
    },
  };

  return blogContents[packageType] || blogContents.couple;
}
