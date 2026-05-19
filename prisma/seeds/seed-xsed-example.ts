import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';

async function main() {
  const drop = await prisma.xsedExperience.upsert({
    where: { slug: 'mendoza-desde-arriba' },
    update: {},
    create: {
      slug: 'mendoza-desde-arriba',
      status: 'ACTIVE',
      titleInternal: 'Mendoza desde arriba — Drop #5',
      titlePublicTeaser: 'Mendoza desde arriba',
      heroImage: '/images/drops/drops-mendoza.jpg',
      destinationCity: 'Mendoza',
      destinationState: 'Mendoza',
      originCity: 'Buenos Aires',
      originCountry: 'Argentina',
      distanceKmFromOrigin: 1040,
      tripDate: new Date('2026-02-20T00:00:00.000Z'),
      pricePerPerson: 450,
      currency: 'USD',
      minSpots: 2,
      maxSpots: 12,
      included: 'Hotel, cena, actividad de bodega, transfer aeropuerto',
      notIncluded: 'Vuelos, bebidas adicionales',
      benefits: {
        create: [
          {
            type: 'ACCOMMODATION',
            sortOrder: 1,
            name: 'El Hotel',
            providerName: 'Entre Cielos Wine & Wellness Hotel',
            city: 'Mendoza',
            state: 'Mendoza',
            customerVisibleNotes:
              '<p>En el corazón de Mendoza, donde la cordillera marca el horizonte y el vino define el ritmo de los días, hay hoteles que no se sienten como hoteles, sino como destinos en sí mismos. Lugares pensados para desconectar del ruido y reconectar con lo esencial: el paisaje, el tiempo lento y los pequeños placeres. Desde la arquitectura hasta el aroma del aire seco de montaña, todo invita a bajar un cambio.</p><p>Uno de esos refugios es Entre Cielos Wine &amp; Wellness Hotel, un hotel que combina diseño contemporáneo con la tradición vitivinícola de la región. Rodeado de viñedos y con vistas abiertas a los Andes, propone una experiencia que va más allá del descanso: spa de nivel internacional, gastronomía local de autor y hasta la posibilidad de dormir entre las vides en su icónica "Wine Cabin". Cada detalle está pensado para que el viaje sea sensorial, íntimo y distinto.</p><p>Quedarse acá es entender Mendoza desde otro lugar. Es despertarse con la luz dorada filtrándose entre las montañas, brindar con un Malbec al atardecer y dejar que el tiempo pase sin apuro. Un plan perfecto para una escapada de fin de semana que no necesita mucho más que ganas de irse y dejarse sorprender.</p>',
            photos: {
              create: [
                { url: '/images/drops/drops-mendoza.jpg', altText: 'Vista desde el balcón', type: 'gallery', sortOrder: 0 },
                { url: '/images/drops/drops-mendoza.jpg', altText: 'Lobby', type: 'gallery', sortOrder: 1 },
              ],
            },
          },
          {
            type: 'ACTIVITY',
            sortOrder: 2,
            name: 'La Experiencia',
            customerVisibleNotes:
              '<p>El recorrido arrancó a las diez de la mañana con una van y un guía que hablaba poco pero sabía dónde estaban todas las bodegas que no aparecen en Google. Subimos por caminos de tierra entre viñedos que parecían pintados.</p><p>En el mirador, Mendoza se ve distinta. No como ciudad, sino como textura. Un mapa vivo que se lee mejor desde arriba.</p>',
            photos: {
              create: [
                { url: '/images/drops/drops-mendoza.jpg', type: 'gallery', sortOrder: 0 },
                { url: '/images/drops/drops-mendoza.jpg', type: 'gallery', sortOrder: 1 },
                { url: '/images/drops/drops-mendoza.jpg', type: 'gallery', sortOrder: 2 },
              ],
            },
          },
          {
            type: 'DINNER',
            sortOrder: 3,
            name: 'La Cena',
            customerVisibleNotes:
              '<p>Cerramos con un lugar chico, sin menú impreso. La recomendación del chef: lo que llegó esa mañana del mercado. Cordero, papas andinas, y una botella de Cabernet Franc que no pedimos pero que apareció igual.</p><p>La cuenta llegó antes que las ganas de irnos.</p>',
            photos: {
              create: [
                { url: '/images/drops/drops-mendoza.jpg', type: 'gallery', sortOrder: 0 },
                { url: '/images/drops/drops-mendoza.jpg', type: 'gallery', sortOrder: 1 },
                { url: '/images/drops/drops-mendoza.jpg', type: 'gallery', sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Created drop: ${drop.slug} (${drop.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
