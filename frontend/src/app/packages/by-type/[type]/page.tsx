import Link from 'next/link';
import { getTravellerData, getAllTravellerSlugs } from '@/lib/travellerTypes';
import type { Metadata } from 'next';

// Import new components
import Hero from '@/components/by-type/Hero'; // Keep Hero import for other types
import IntroBlock from '@/components/by-type/IntroBlock'; // Keep for other types
import ImageMosaic from '@/components/by-type/ImageMosaic'; // Keep for other types
import BenefitGrid from '@/components/by-type/BenefitGrid'; // Keep for other types
import LevelsSection from '@/components/by-type/LevelsSection';
import CtaBand from '@/components/by-type/CtaBand';
import CouplePage from '../../(by-type)/couple/page'; // Import the new CouplePage
// import BlogCard from '@/components/BlogCard'; // Removed as it's now in SoloInspiration
import SoloHero from '@/components/by-type/solo/SoloHero';
import SoloInspiration from '@/components/by-type/solo/SoloInspiration'; // Added SoloInspiration import

export function generateStaticParams() {
  return getAllTravellerSlugs().map((type) => ({ type }));
}



export default function Page({ params }:{
  params: { type: string }
}) {
  if (params.type === "couple") {
    return <CouplePage />;
  }

  const base = {
    slug: params.type,
    heroTitle: 'Ruta con Alma',
    subcopy: 'Preparamos la sorpresa; tú te quedas con la historia.',
    palette: { primary:'#FFF', secondary:'#0A2240', accent:'#F2C53D', text:'#212121' },
    images: { hero: '/images/travellers/solo/hero.svg' },
  };

  const data = getTravellerData(params.type) ?? base;

  const style = {
    '--rt-primary': data.palette.primary,
    '--rt-secondary': data.palette.secondary,
    '--rt-accent': data.palette.accent,
    '--rt-text': data.palette.text,
  } as React.CSSProperties;

  if (params.type === "solo") {
    return (
      <main style={style}>
        <SoloHero /> {/* Hero */}

        {/* Planes Section */}
        <section id="planes" className="relative scroll-mt-16 bg-neutral-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <LevelsSection type="solo" palette={data.palette} variant="dark" />
          </div>
        </section>

        {/* Inspiracion Section */}
        <SoloInspiration /> {/* Replaced inline section with SoloInspiration component */}

        {/* Testimonios Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 text-center">👉 Lo que pasa cuando viajás solo y dejás que la sorpresa te lleve</h2>
            <p className="text-lg text-center mb-12">🔹 Historias reales de quienes se animaron a viajar solos.</p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <figure className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                <blockquote className="text-neutral-800 leading-relaxed">"No conocía a nadie, ni siquiera el destino. Volví con amigos nuevos y un recuerdo que no entra en ninguna foto."</blockquote>
                <figcaption className="mt-4 text-sm text-neutral-500">— Martín, 32</figcaption>
              </figure>
              <figure className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                <blockquote className="text-neutral-800 leading-relaxed">"Viajar sola me daba miedo. Ahora me doy cuenta de que lo que asusta es quedarse en casa. Randomtrip fue la excusa perfecta."</blockquote>
                <figcaption className="mt-4 text-sm text-neutral-500">— Laura, 27</figcaption>
              </figure>
              <figure className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                <blockquote className="text-neutral-800 leading-relaxed">"Creí que iba por desconexión. Terminé conectando conmigo mismo de una forma que no esperaba."</blockquote>
                <figcaption className="mt-4 text-sm text-neutral-500">— Tomás, 40</figcaption>
              </figure>
              <figure className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-black/5">
                <blockquote className="text-neutral-800 leading-relaxed">"Me subí al avión con dudas. Me bajé con historias que solo podía haber escrito viajando sola."</blockquote>
                <figcaption className="mt-4 text-sm text-neutral-500">— Valentina, 29</figcaption>
              </figure>
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="#planes" className="btn-primary">👉 RANDOMTRIPME!</Link>
            </div>
          </div>
        </section>
        {/* Removed CtaBand for solo branch */}
      </main>
    );
  }

  return (
    <main style={style}>
      <Hero data={data} />
      <IntroBlock type={data.slug} palette={data.palette} />
      <ImageMosaic type={data.slug} />
      <BenefitGrid type={data.slug} palette={data.palette} />
      <section className="bg-white text-slate-900">
        <LevelsSection type={data.slug} palette={data.palette} />
      </section>
      <CtaBand palette={data.palette} />
    </main>
  );
}