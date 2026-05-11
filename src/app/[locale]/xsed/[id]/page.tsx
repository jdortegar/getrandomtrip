import { notFound } from 'next/navigation';
import { XsedInternalHero } from '@/components/app/xsed/XsedInternalHero';
import { XsedDropBody } from '@/components/app/xsed/XsedDropBody';
import Testimonials from '@/components/Testimonials';
import TripperMottoBanner from '@/components/blog/TripperMottoBanner';
import LightboxCarousel from '@/components/media/LightboxCarousel';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import Section from '@/components/layout/Section';

const DROP = {
  id: '1',
  dropNumber: 5,
  date: '20 FEBRERO 2026',
  title: 'Mendoza desde arriba',
  backgroundImage: '/images/drops/drops-mendoza.jpg',
  article: [
    {
      id: 'hotel',
      title: 'El Hotel',
      content: `<p>En el corazón de Mendoza, donde la cordillera marca el horizonte y el vino define el ritmo de los días, hay hoteles que no se sienten como hoteles, sino como destinos en sí mismos. Lugares pensados para desconectar del ruido y reconectar con lo esencial: el paisaje, el tiempo lento y los pequeños placeres. Desde la arquitectura hasta el aroma del aire seco de montaña, todo invita a bajar un cambio.</p>

<p>Uno de esos refugios es Entre Cielos Wine & Wellness Hotel, un hotel que combina diseño contemporáneo con la tradición vitivinícola de la región. Rodeado de viñedos y con vistas abiertas a los Andes, propone una experiencia que va más allá del descanso: spa de nivel internacional, gastronomía local de autor y hasta la posibilidad de dormir entre las vides en su icónica “Wine Cabin”. Cada detalle está pensado para que el viaje sea sensorial, íntimo y distinto.</p>

<p>Quedarse acá es entender Mendoza desde otro lugar. Es despertarse con la luz dorada filtrándose entre las montañas, brindar con un Malbec al atardecer y dejar que el tiempo pase sin apuro. Un plan perfecto para una escapada de fin de semana que no necesita mucho más que ganas de irse y dejarse sorprender.</p>`,
      images: [
        { url: '/images/drops/drops-mendoza.jpg', caption: 'Vista desde el balcón' },
        { url: '/images/drops/drops-mendoza.jpg', caption: 'Lobby' },
      ],
    },
    {
      id: 'experiencia',
      title: 'La Experiencia',
      content: `<p>El recorrido arrancó a las diez de la mañana con una van y un guía que hablaba poco pero sabía dónde estaban todas las bodegas que no aparecen en Google. Subimos por caminos de tierra entre viñedos que parecían pintados.</p><p>En el mirador, Mendoza se ve distinta. No como ciudad, sino como textura. Un mapa vivo que se lee mejor desde arriba.</p>`,
      images: [
        { url: '/images/drops/drops-mendoza.jpg' },
        { url: '/images/drops/drops-mendoza.jpg' },
        { url: '/images/drops/drops-mendoza.jpg' },
      ],
    },
    {
      id: 'cena',
      title: 'La Cena',
      content: `<p>Cerramos con un lugar chico, sin menú impreso. La recomendación del chef: lo que llegó esa mañana del mercado. Cordero, papas andinas, y una botella de Cabernet Franc que no pedimos pero que apareció igual.</p><p>La cuenta llegó antes que las ganas de irnos.</p>`,
      images: [
        { url: '/images/drops/drops-mendoza.jpg' },
        { url: '/images/drops/drops-mendoza.jpg' },
        { url: '/images/drops/drops-mendoza.jpg' },
      ],
    },
  ],
  galleryImages: [
    { url: '/images/drops/drops-mendoza.jpg', caption: 'Mendoza desde el cerro' },
    { url: '/images/drops/drops-mendoza.jpg', caption: 'Bodega del recorrido' },
    { url: '/images/drops/drops-mendoza.jpg', caption: 'Cena de cierre' },
  ],
  coverUrl: '/images/drops/drops-mendoza.jpg',
  author: {
    id: 'alejandra-ramirez',
    name: 'Alejandra Ramirez',
    slug: 'alejandra-ramirez',
    avatarUrl: '/images/fallback-profile.jpg',
    location: 'MÉXICO CITY, MÉXICO',
    motto:
      'Mendoza no se disfruta. Mendoza se toma con tiempo, con vino, y sin apuro.',
    specialization: 'Especialista en Sudamérica',
  },
  testimonials: [
    {
      author: 'Romina',
      avatarUrl: '/images/fallback-profile.jpg',
      country: 'Argentina',
      quote: 'Nunca imaginé que Mendoza me iba a sorprender así. El mirador fue lo mejor del viaje.',
    },
    {
      author: 'Guillermo',
      avatarUrl: '/images/fallback-profile.jpg',
      country: 'Chile',
      quote: 'El plan estuvo perfecto de principio a fin. Volvería sin dudarlo.',
    },
    {
      author: 'Luis',
      avatarUrl: '/images/fallback-profile.jpg',
      country: 'México',
      quote: 'La cena fue un momento único. Sin menú, sin drama. Solo sabor.',
    },
  ],
};

type Props = {
  params: Promise<{ locale?: string; id?: string }>;
};

export default async function XsedInternalPage({ params }: Props) {
  const { id } = await params;

  if (id !== DROP.id) {
    notFound();
  }

  const { article, galleryImages, coverUrl, author, testimonials } = DROP;

  return (
    <>
      <XsedInternalHero content={DROP} />
      <Section className="md:px-20 px-4">
        <Breadcrumb
          items={[
            { href: '/xsed', label: 'Bitácora de escapadas' },
            { label: 'Nº' + DROP.dropNumber },
          ]}
        />
        <XsedDropBody content={DROP.article} />
      </Section>
      <LightboxCarousel images={galleryImages} className="bg-gray-100" />
      <TripperMottoBanner
        authorName={author.name}
        authorSlug={author.slug}
        avatarUrl={author.avatarUrl}
        backgroundImageUrl={coverUrl}
        motto={author.motto}
        specialization={author.specialization}
      />
      <Testimonials
        eyebrow="Opiniones de Viajeros"
        featureColor="#D97E4A"
        testimonials={testimonials}
        title="El Veredicto"
      />
    </>
  );
}
