import Link from 'next/link';

export default function PawsHero() {
  return (
    <section className="relative w-full h-[90vh] md:h-screen flex items-center justify-center overflow-hidden">
      {/* Video bg */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/images/journey-types/paws-card.jpg"
        className="absolute z-0 w-full h-full object-cover"
      >
        <source src="/videos/paws-hero-video.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute z-10 w-full h-full bg-black/50 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              PAWS© RANDOMTRIP
            </h1>
            <p className="text-lg md:text-2xl mb-8">
              Viajar con ellos es parte del plan. Diseñamos escapadas donde tu mejor amig@ de cuatro patas también es protagonista.
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-3 mb-8">
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm md:text-base">🐶 Pet-friendly garantizado</span>
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm md:text-base">✈️ Logística sin estrés (traslados & alojamientos)</span>
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm md:text-base">🌳 Experiencias al aire libre pensadas para ambos</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/packages/by-type/paws#paws-planner"
                className="bg-[#D4AF37] text-gray-900 font-bold py-3 px-6 rounded-full text-lg hover:bg-[#EACD65] transition-colors shadow-lg"
                data-analytics="cta_paws_planner_hero"
              >
                🐾 RANDOMTRIP-paws! →
              </Link>
              <Link
                href="/blog"
                aria-label="Ver relatos que inspiran de viajes con mascotas"
                className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-white hover:text-gray-900 transition-colors shadow-lg"
                data-analytics="cta_paws_blog_hero"
              >
                ✨ Relatos que inspiran →
              </Link>
            </div>

            {/* Storytelling */}
            <div className="bg-white/10 p-5 rounded-lg max-w-3xl text-sm md:text-base italic">
              <p className="mb-3">
                “Dicen que la vida es mejor con compañía… y pocas compañías son tan leales como la que te espera al llegar a casa con un movimiento de cola o un ronroneo.
              </p>
              <p className="mb-3">
                En PAWS© RANDOMTRIP creemos que los viajes no deberían dejar a nadie atrás. Diseñamos escapadas donde tu mascota no es un problema logístico, sino parte esencial de la aventura.”
              </p>
              <p className="mb-3">
                Un camino nuevo huele distinto; un bosque tiene sonidos que despiertan curiosidad; una playa es territorio para correr sin relojes. Ellos no solo te acompañan: te enseñan a viajar distinto.
              </p>
              <p className="mb-1">Porque algunas huellas se dejan en la arena, y otras, para siempre en la memoria.</p>
              <p className="text-right font-semibold not-italic">— RANDOMTRIP. Wonder. Wander. Repeat. —</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}