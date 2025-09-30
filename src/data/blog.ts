interface BlogPost {
  image: string;
  category: string;
  title: string;
  href?: string;
}

interface BlogContent {
  title: string;
  subtitle: string;
  posts: BlogPost[];
  viewAll?: {
    title: string;
    subtitle: string;
    href: string;
  };
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
      title: 'Aventuras en solitario',
      subtitle: 'Descubre el mundo a tu propio ritmo.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
          category: 'Solo Travel',
          title: 'Viajar Solo: La Libertad de Explorar',
        },
        {
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          category: 'Consejos',
          title: 'Guía para Viajeros Solitarios',
        },
      ],
      viewAll: {
        title: 'Más Historias',
        subtitle: 'Descubre todas nuestras aventuras y experiencias únicas',
        href: '/blog',
      },
    },
    families: {
      title: 'Aventuras familiares',
      subtitle: 'Experiencias que unen a toda la familia.',
      posts: [
        {
          image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
          category: 'Familia',
          title: 'Viajes con Niños: Consejos Prácticos',
        },
        {
          image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
          category: 'Experiencias',
          title: 'Destinos Perfectos para Familias',
        },
      ],
      viewAll: {
        title: 'Más Historias',
        subtitle: 'Descubre todas nuestras aventuras y experiencias únicas',
        href: '/blog',
      },
    },
  };

  return blogContents[packageType] || blogContents.couple;
}
