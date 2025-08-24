import Link from 'next/link';
import GetRandomtripCta from '@/components/common/GetRandomtripCta';

export default function PawsInspiration() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Historias con huellas</h2>
        <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
          Descubre relatos de viajeros y sus compañeros de cuatro patas. Destinos, consejos y aventuras para inspirarte a viajar juntos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Patagonia con tu mejor amigo</h3>
            <p className="text-gray-700 text-sm">Lagos y senderos del sur argentino con perro: logística y momentos clave.</p>
            <Link href="/blog/patagonia-paws" className="text-[#D4AF37] hover:underline mt-3 inline-block">
              Leer más →
            </Link>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Hoteles pet-friendly en la costa</h3>
            <p className="text-gray-700 text-sm">Alojamientos que realmente reciben a tu mascota (y tips de check-in).</p>
            <Link href="/blog/hoteles-costa-paws" className="text-[#D4AF37] hover:underline mt-3 inline-block">
              Leer más →
            </Link>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Actividades al aire libre dog-friendly</h3>
            <p className="text-gray-700 text-sm">De caminatas a kayak: ideas para que ambos disfruten al máximo.</p>
            <Link href="/blog/actividades-paws" className="text-[#D4AF37] hover:underline mt-3 inline-block">
              Leer más →
            </Link>
          </div>
        </div>

        <GetRandomtripCta align="center" />
      </div>
    </section>
  );
}