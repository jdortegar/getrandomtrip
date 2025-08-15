import { notFound } from 'next/navigation';
import SmartHeroMedia from "@/components/SmartHeroMedia";
import { bySlug } from "@/content/bitacoras";

export default function CountryPage({ params }: { params: { pais: string } }) {
  const country = bySlug("/" + params.pais);
  if (!country) return notFound();

  return (
    <main className="bg-white text-neutral-900">
      <section className="relative">
        <SmartHeroMedia
          countryName={country.name}
          heroImage={country.heroImage}
          heroVideo={country.heroVideo}
        />
        {/* Encabezado */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-10">
            {country.heroKicker && (
              <p className="uppercase tracking-wide text-white/90 text-xs mb-1">{country.heroKicker}</p>
            )}
            <h1 className="text-white text-4xl md:text-6xl font-bold mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>{country.h1}</h1>
            <p className="text-white/90 max-w-2xl text-base md:text-lg">{country.heroHeadline}</p>
            <p className="text-white/80 max-w-2xl mt-2">{country.heroSub}</p>
            <a
              href="/?tab=Top+Trippers#start-your-journey-anchor"
              className="inline-block mt-6 px-5 py-3 rounded-full bg-white text-neutral-900 font-medium hover:bg-white/90 transition"
            >
              {country.ctaLabel || "Diseñar mi viaje"}
            </a>
          </div>
        </div>
      </section>

      {/* ... resto de secciones ... */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <h2 className="text-3xl font-bold mb-4">Razones para ir</h2>
                <ul className="grid grid-cols-2 gap-4">
                    {country.reasonsToGo.map((reason, index) => (
                        <li key={index} className="p-4 bg-gray-100 rounded-lg">{reason}</li>
                    ))}
                </ul>

                <h2 className="text-3xl font-bold mt-12 mb-4">Experiencias Únicas</h2>
                <ul className="list-disc list-inside space-y-2">
                    {country.signatureExperiences.map((exp, index) => (
                        <li key={index}>{exp}</li>
                    ))}
                </ul>

                <h2 className="text-3xl font-bold mt-12 mb-4">Ideas de Viaje</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {country.ideas.map((idea, index) => (
                        <div key={index} className="p-6 bg-gray-100 rounded-lg">
                            <h3 className="font-bold text-xl mb-2">{idea.title}</h3>
                            <p>{idea.blurb}</p>
                        </div>
                    ))}
                </div>

                <h2 className="text-3xl font-bold mt-12 mb-4">Preguntas Frecuentes</h2>
                <div className="space-y-4">
                    {country.faqs.map((faq, index) => (
                        <details key={index} className="p-4 bg-gray-100 rounded-lg">
                            <summary className="font-bold cursor-pointer">{faq.q}</summary>
                            <p className="mt-2">{faq.a}</p>
                        </details>
                    ))}
                </div>
            </div>
            <aside>
                <div className="sticky top-24 p-6 bg-gray-100 rounded-lg">
                    <h3 className="font-bold text-xl mb-4">Mejor para...</h3>
                    <div className="flex flex-wrap gap-2">
                        {country.bestFor.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-200 text-sm rounded-full">{tag}</span>
                        ))}
                    </div>

                    <h3 className="font-bold text-xl mt-8 mb-4">Cuándo ir</h3>
                    <div className="space-y-4">
                        {country.whenToGo.map((season, index) => (
                            <div key={index}>
                                <p className="font-bold">{season.months}</p>
                                <p className="text-sm text-gray-600">{season.why}</p>
                            </div>
                        ))}
                    </div>

                    <a href="https://wa.me/526241928208" className="inline-block mt-8 w-full text-center px-5 py-3 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition">
                        Contactar por WhatsApp
                    </a>
                </div>
            </aside>
        </div>
      </div>

    </main>
  );
}

// Generate static paths for all countries
export async function generateStaticParams() {
  const { COUNTRIES } = await import("@/content/bitacoras");
  return COUNTRIES.map((country) => ({
    pais: country.slug.substring(1),
  }));
}