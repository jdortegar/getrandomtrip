import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample providers first
  const providers = await Promise.all([
    prisma.provider.upsert({
      where: { id: 'provider-1' },
      update: {},
      create: {
        id: 'provider-1',
        name: 'InterContinental Hotels',
        description: 'Luxury hotel chain with properties worldwide',
        email: 'reservations@intercontinental.com',
        website: 'https://intercontinental.com',
        companyType: 'hotel',
        country: 'Mexico',
        city: 'Cancun',
        logo: '/images/providers/intercontinental-logo.png',
        isVerified: true,
        rating: 4.5,
        tags: ['luxury', 'hotels', 'international'],
      },
    }),
    prisma.provider.upsert({
      where: { id: 'provider-2' },
      update: {},
      create: {
        id: 'provider-2',
        name: 'Aeroméxico',
        description: "Mexico's leading airline",
        email: 'contact@aeromexico.com',
        website: 'https://aeromexico.com',
        companyType: 'airline',
        country: 'Mexico',
        city: 'Mexico City',
        logo: '/images/providers/aeromexico-logo.png',
        isVerified: true,
        rating: 4.2,
        tags: ['airline', 'mexico', 'international'],
      },
    }),
    prisma.provider.upsert({
      where: { id: 'provider-3' },
      update: {},
      create: {
        id: 'provider-3',
        name: 'Allianz Travel Insurance',
        description: 'Comprehensive travel insurance coverage',
        email: 'info@allianz.com',
        website: 'https://allianz.com',
        companyType: 'insurance',
        country: 'Germany',
        city: 'Munich',
        logo: '/images/providers/allianz-logo.png',
        isVerified: true,
        rating: 4.3,
        tags: ['insurance', 'travel', 'protection'],
      },
    }),
  ]);

  // Create sample filters
  const filters = await Promise.all([
    prisma.filter.upsert({
      where: { id: 'filter-1' },
      update: {},
      create: {
        id: 'filter-1',
        key: 'transport',
        name: 'Transportation',
        description: 'Choose your preferred transportation method',
        category: 'logistics',
        price: 0,
        icon: 'plane',
        options: [
          { value: 'avion', label: 'Avión', price: 0 },
          { value: 'bus', label: 'Bus', price: 0 },
          { value: 'tren', label: 'Tren', price: 50 },
          { value: 'barco', label: 'Barco', price: 100 },
        ],
        sortOrder: 1,
      },
    }),
    prisma.filter.upsert({
      where: { id: 'filter-2' },
      update: {},
      create: {
        id: 'filter-2',
        key: 'climate',
        name: 'Climate Preference',
        description: 'Select your preferred climate',
        category: 'preferences',
        price: 0,
        icon: 'sun',
        options: [
          { value: 'indistinto', label: 'Indistinto', price: 0 },
          { value: 'calido', label: 'Cálido', price: 0 },
          { value: 'frio', label: 'Frío', price: 0 },
          { value: 'templado', label: 'Templado', price: 0 },
        ],
        sortOrder: 2,
      },
    }),
    prisma.filter.upsert({
      where: { id: 'filter-3' },
      update: {},
      create: {
        id: 'filter-3',
        key: 'maxTravelTime',
        name: 'Maximum Travel Time',
        description: 'Maximum time you want to spend traveling',
        category: 'logistics',
        price: 0,
        icon: 'clock',
        options: [
          { value: 'sin-limite', label: 'Sin límite', price: 0 },
          { value: '3h', label: '3 horas', price: 0 },
          { value: '5h', label: '5 horas', price: 0 },
          { value: '8h', label: '8 horas', price: 0 },
        ],
        sortOrder: 3,
      },
    }),
    prisma.filter.upsert({
      where: { id: 'filter-4' },
      update: {},
      create: {
        id: 'filter-4',
        key: 'departPref',
        name: 'Departure Preference',
        description: 'Preferred time of day to depart',
        category: 'logistics',
        price: 0,
        icon: 'sunrise',
        options: [
          { value: 'indistinto', label: 'Indistinto', price: 0 },
          { value: 'manana', label: 'Mañana', price: 0 },
          { value: 'tarde', label: 'Tarde', price: 0 },
          { value: 'noche', label: 'Noche', price: 0 },
        ],
        sortOrder: 4,
      },
    }),
    prisma.filter.upsert({
      where: { id: 'filter-5' },
      update: {},
      create: {
        id: 'filter-5',
        key: 'arrivePref',
        name: 'Arrival Preference',
        description: 'Preferred time of day to arrive',
        category: 'logistics',
        price: 0,
        icon: 'sunset',
        options: [
          { value: 'indistinto', label: 'Indistinto', price: 0 },
          { value: 'manana', label: 'Mañana', price: 0 },
          { value: 'tarde', label: 'Tarde', price: 0 },
          { value: 'noche', label: 'Noche', price: 0 },
        ],
        sortOrder: 5,
      },
    }),
    prisma.filter.upsert({
      where: { id: 'filter-6' },
      update: {},
      create: {
        id: 'filter-6',
        key: 'avoidDestinations',
        name: 'Avoid Destinations',
        description: 'Destinations you want to avoid',
        category: 'avoid',
        price: 0,
        icon: 'x-circle',
        options: [
          { value: 'mexico-city', label: 'Ciudad de México', price: 0 },
          { value: 'cancun', label: 'Cancún', price: 0 },
          { value: 'tulum', label: 'Tulum', price: 0 },
          { value: 'playa-del-carmen', label: 'Playa del Carmen', price: 0 },
          { value: 'puerto-vallarta', label: 'Puerto Vallarta', price: 0 },
          { value: 'los-cabos', label: 'Los Cabos', price: 0 },
          { value: 'guadalajara', label: 'Guadalajara', price: 0 },
          { value: 'monterrey', label: 'Monterrey', price: 0 },
        ],
        sortOrder: 6,
      },
    }),
  ]);

  // Create sample premium filters
  const premiumFilters = await Promise.all([
    prisma.premiumFilter.upsert({
      where: { id: 'premium-filter-1' },
      update: {},
      create: {
        id: 'premium-filter-1',
        key: 'premium_transport',
        name: 'Premium Transportation',
        description: 'Luxury transportation options',
        category: 'premium_logistics',
        price: 200,
        icon: 'star',
        options: [
          { value: 'first_class', label: 'Primera Clase', price: 200 },
          { value: 'business', label: 'Business', price: 150 },
          { value: 'private_jet', label: 'Jet Privado', price: 1000 },
        ],
        sortOrder: 1,
      },
    }),
    prisma.premiumFilter.upsert({
      where: { id: 'premium-filter-2' },
      update: {},
      create: {
        id: 'premium-filter-2',
        key: 'premium_accommodation',
        name: 'Premium Accommodation',
        description: 'Luxury accommodation options',
        category: 'premium_preferences',
        price: 300,
        icon: 'crown',
        options: [
          { value: '5_star', label: '5 Estrellas', price: 300 },
          { value: 'boutique', label: 'Boutique Hotel', price: 250 },
          { value: 'villa', label: 'Villa Privada', price: 500 },
        ],
        sortOrder: 2,
      },
    }),
  ]);

  // Create sample addons
  const addons = await Promise.all([
    prisma.addon.upsert({
      where: { id: 'addon-1' },
      update: {},
      create: {
        id: 'addon-1',
        name: 'Seat Selection',
        description: 'Choose your preferred seat on flights',
        category: 'transportation',
        price: 25.0,
        providerId: providers[1].id, // Aeroméxico
        image: '/images/addons/seat-selection.jpg',
        icon: 'seat',
        tags: ['flight', 'comfort'],
        serviceType: 'transport',
        duration: 'per_flight',
        location: 'Airport',
        sortOrder: 1,
      },
    }),
    prisma.addon.upsert({
      where: { id: 'addon-2' },
      update: {},
      create: {
        id: 'addon-2',
        name: 'Travel Insurance',
        description: 'Comprehensive travel insurance coverage',
        category: 'services',
        price: 45.0,
        providerId: providers[2].id, // Allianz
        image: '/images/addons/travel-insurance.jpg',
        icon: 'shield',
        tags: ['insurance', 'protection'],
        serviceType: 'insurance',
        duration: 'full trip',
        location: 'Worldwide',
        sortOrder: 2,
      },
    }),
    prisma.addon.upsert({
      where: { id: 'addon-3' },
      update: {},
      create: {
        id: 'addon-3',
        name: 'Airport Transfer',
        description: 'Private transfer to/from airport',
        category: 'transportation',
        price: 35.0,
        providerId: providers[0].id, // InterContinental
        image: '/images/addons/airport-transfer.jpg',
        icon: 'car',
        tags: ['transfer', 'convenience'],
        serviceType: 'transfer',
        duration: '1 hour',
        location: 'Airport to Hotel',
        sortOrder: 3,
      },
    }),
  ]);

  // Create sample premium packages
  const premiumPackages = await Promise.all([
    prisma.premiumPackage.upsert({
      where: { id: 'essenza' },
      update: {},
      create: {
        id: 'essenza',
        title: 'Essenza',
        tagline: 'Lo básico, pero nunca aburrido',
        budget: 350,
        budgetType: 'Hasta',
        maxNights: 2,
        accommodation: 'Midscale (3★ o equivalentes)',
        transportation: 'Low cost (buses o vuelos off-peak)',
        keyExtras: ['Guía esencial con recomendaciones simples'],
        archetype: 'budget',
        channels: ['web', 'mobile'],
        ctaText: 'Reservar fácil →',
        sortOrder: 1,
      },
    }),
    prisma.premiumPackage.upsert({
      where: { id: 'explora' },
      update: {},
      create: {
        id: 'explora',
        title: 'Modo Explora',
        tagline: 'Para los que creen que descubrir es un verbo en movimiento',
        budget: 500,
        budgetType: 'Hasta',
        maxNights: 3,
        accommodation: 'Midscale – Upper Midscale',
        transportation: 'Multimodal, horarios flexibles',
        keyExtras: ['Guía "Randomtrip Decode" curada con pistas y actividades'],
        archetype: 'explorer',
        channels: ['web', 'mobile'],
        ctaText: 'Activen su modo Explora →',
        sortOrder: 2,
      },
    }),
    prisma.premiumPackage.upsert({
      where: { id: 'atelier' },
      update: {},
      create: {
        id: 'atelier',
        title: 'Atelier',
        tagline: 'Experiencias únicas y personalizadas',
        budget: 1200,
        budgetType: 'Desde',
        maxNights: 5,
        accommodation: 'Luxury (5★ o equivalentes)',
        transportation: 'Premium con todas las comodidades',
        keyExtras: ['Concierge personal', 'Experiencias exclusivas'],
        archetype: 'luxury',
        channels: ['web', 'mobile'],
        ctaText: 'Vivir la experiencia →',
        sortOrder: 5,
      },
    }),
  ]);

  // Create sample tripper
  const tripper = await prisma.tripper.upsert({
    where: { id: 'tripper-1' },
    update: {},
    create: {
      id: 'tripper-1',
      slug: 'ale-ramirez',
      name: 'Alejandra Ramírez',
      title: 'Tripper | Travel Curator',
      location: 'CDMX, México',
      avatar: '/images/trippers/ale.jpg',
      heroImage: '/images/trippers/ale-hero.jpg',
      ambassadorId: '167-2021',
      tierLevel: 'ELITE',
      bio: 'Especialista en viajes de lujo y experiencias únicas en América Latina.',
      videoUrl: 'https://youtube.com/embed/example',
      interests: ['gastronomía', 'cultura', 'naturaleza'],
      destinations: ['Perú', 'Chile', 'Colombia', 'México'],
      languages: ['Español', 'Inglés', 'Portugués'],
      certifications: ['Virtuoso Verified', 'IATA'],
      partnerBadges: [
        {
          name: 'Virtuoso',
          logoUrl: '/images/partners/virtuoso.png',
          url: 'https://virtuoso.com',
        },
      ],
      gallery: [
        { src: '/images/trippers/ale-gallery-1.jpg', alt: 'Alejandra in Peru' },
        {
          src: '/images/trippers/ale-gallery-2.jpg',
          alt: 'Alejandra in Chile',
        },
      ],
      posts: [
        {
          image: '/images/posts/peru-guide.jpg',
          category: 'Destinos',
          title: 'Guía completa de Perú',
          href: '/blog/peru-guide',
        },
      ],
      visitedPlaces: [
        {
          country: 'Perú',
          cities: ['Lima', 'Cusco', 'Arequipa'],
          lastTrip: 2023,
          trips: 5,
        },
      ],
      testimonials: [
        {
          author: 'María González',
          quote:
            'Alejandra hizo que nuestro viaje a Perú fuera inolvidable. Su conocimiento local es excepcional.',
        },
      ],
      agency: 'Randomtrip',
      metaTitle: 'Alejandra Ramírez | Tripper | Randomtrip',
      metaDescription:
        'Especialista en viajes de lujo y experiencias únicas en América Latina.',
    },
  });

  // Create tripper tiers
  await Promise.all([
    prisma.tripperTier.upsert({
      where: { id: 'tier-1' },
      update: {},
      create: {
        id: 'tier-1',
        tripperId: tripper.id,
        tierKey: 'essenza',
        name: 'Essenza',
        price: 350,
        description: 'Experiencia básica pero curada',
        features: [
          'Guía personalizada',
          'Recomendaciones locales',
          'Soporte 24/7',
        ],
      },
    }),
    prisma.tripperTier.upsert({
      where: { id: 'tier-2' },
      update: {},
      create: {
        id: 'tier-2',
        tripperId: tripper.id,
        tierKey: 'atelier',
        name: 'Atelier',
        price: 1200,
        description: 'Experiencia de lujo personalizada',
        features: [
          'Concierge personal',
          'Experiencias exclusivas',
          'Accommodation de lujo',
        ],
      },
    }),
  ]);

  // Create sample bitacora
  await prisma.bitacora.upsert({
    where: { id: 'bitacora-1' },
    update: {},
    create: {
      id: 'bitacora-1',
      slug: 'machu-picchu-secrets',
      title: 'Los secretos de Machu Picchu que nadie te cuenta',
      excerpt:
        'Descubre los rincones ocultos y la historia real detrás de la ciudadela inca más famosa del mundo.',
      content: 'Machu Picchu es mucho más que una postal...',
      author: 'Alejandra Ramírez',
      authorBio:
        'Especialista en viajes a Perú con más de 10 años de experiencia.',
      authorImage: '/images/trippers/ale.jpg',
      featuredImage: '/images/bitacoras/machu-picchu.jpg',
      gallery: [
        '/images/bitacoras/machu-picchu-1.jpg',
        '/images/bitacoras/machu-picchu-2.jpg',
      ],
      metaTitle: 'Secretos de Machu Picchu | Randomtrip',
      metaDescription:
        'Descubre los rincones ocultos de Machu Picchu con nuestra guía experta.',
      isPublished: true,
      publishedAt: new Date(),
      tags: ['Perú', 'Machu Picchu', 'Historia', 'Cultura'],
      category: 'Destinos',
      readTime: 8,
    },
  });

  // Create sample blog posts
  const blogPosts = await Promise.all([
    prisma.blogPost.upsert({
      where: { id: 'blog-post-1' },
      update: {},
      create: {
        id: 'blog-post-1',
        tripperId: tripper.id,
        title: 'Los mejores restaurantes secretos de Tulum',
        slug: 'mejores-restaurantes-secretos-tulum',
        excerpt:
          'Descubre los lugares gastronómicos que solo los locales conocen en Tulum.',
        content: 'Tulum no es solo playas paradisíacas...',
        featuredImage: '/images/blog/tulum-restaurants.jpg',
        gallery: [
          {
            src: '/images/blog/tulum-rest-1.jpg',
            alt: 'Restaurante local',
            caption: 'Cocina tradicional',
          },
          {
            src: '/images/blog/tulum-rest-2.jpg',
            alt: 'Plato típico',
            caption: 'Especialidad de la casa',
          },
        ],
        metaTitle: 'Restaurantes Secretos de Tulum | Randomtrip',
        metaDescription:
          'Los mejores restaurantes locales de Tulum que debes conocer.',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 1250,
        likeCount: 89,
        tags: ['Tulum', 'Gastronomía', 'Restaurantes', 'Local'],
        category: 'destinations',
        readTime: 6,
        destination: 'Tulum',
        country: 'Mexico',
        city: 'Tulum',
        relatedTripType: 'couple',
        experienceLevel: 'explora',
      },
    }),
    prisma.blogPost.upsert({
      where: { id: 'blog-post-2' },
      update: {},
      create: {
        id: 'blog-post-2',
        tripperId: tripper.id,
        title: 'Guía completa para viajar en familia a Costa Rica',
        slug: 'guia-viajar-familia-costa-rica',
        excerpt:
          'Todo lo que necesitas saber para planificar el viaje perfecto en familia a Costa Rica.',
        content: 'Costa Rica es un destino ideal para familias...',
        featuredImage: '/images/blog/costa-rica-family.jpg',
        gallery: [
          {
            src: '/images/blog/cr-family-1.jpg',
            alt: 'Familia en playa',
            caption: 'Diversión familiar',
          },
          {
            src: '/images/blog/cr-family-2.jpg',
            alt: 'Niños en tour',
            caption: 'Aventuras para niños',
          },
        ],
        metaTitle: 'Viajar en Familia a Costa Rica | Randomtrip',
        metaDescription:
          'La guía definitiva para viajar en familia a Costa Rica.',
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 2100,
        likeCount: 156,
        tags: ['Costa Rica', 'Familia', 'Viajes', 'Guía'],
        category: 'guides',
        readTime: 12,
        destination: 'Costa Rica',
        country: 'Costa Rica',
        relatedTripType: 'family',
        experienceLevel: 'explora-plus',
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`🏢 Created ${providers.length} providers`);
  console.log(`🔧 Created ${filters.length} filters`);
  console.log(`⭐ Created ${premiumFilters.length} premium filters`);
  console.log(`📦 Created ${addons.length} addons`);
  console.log(`💎 Created ${premiumPackages.length} premium packages`);
  console.log(`👤 Created 1 tripper with tiers`);
  console.log(`📝 Created 1 bitacora`);
  console.log(`📰 Created ${blogPosts.length} blog posts`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
