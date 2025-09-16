import type { CountryCopy } from "./types";

const peru: CountryCopy = {
  slug: "/peru",
  name: "Perú",
  seoTitle: "Viajes a Perú a medida | Machu Picchu, Gastronomía y Amazonas",
  seoDescription: "Descubre Perú con un viaje diseñado por Randomtrip. Explora Machu Picchu, disfruta de la galardonada gastronomía limeña y aventúrate en el Amazonas.",
  h1: "Perú, herencia mística",
  heroKicker: "El Hilo Ancestral",
  heroHeadline: "Donde la historia se saborea y la naturaleza sobrecoge.",
  heroSub: "Desde la ciudad sagrada de los Incas hasta los sabores que conquistan el mundo y la selva que respira vida. Un viaje para conectar con lo esencial.",
  ctaLabel: "Diseñar mi viaje a Perú",
  reasonsToGo: [
    "Machu Picchu al amanecer",
    "La revolución gastronómica de Lima",
    "Navegar el río Amazonas",
    "Las enigmáticas Líneas de Nazca",
    "Cultura viva en el Valle Sagrado",
  ],
  bestFor: ["Cultura", "Gastronomía", "Aventura", "Naturaleza", "Historia"],
  whenToGo: [
    { months: "Abr–Oct", why: "temporada seca en los Andes, ideal para trekking" },
    { months: "Nov–Mar", why: "temporada verde en la sierra y menos multitudes" },
    { months: "Todo el año", why: "la costa y Lima tienen un clima templado" },
  ],
  signatureExperiences: [
    "Recorrer el Camino Inca hacia Machu Picchu",
    "Cena de degustación en un restaurante top de Lima",
    "Estadía en un lodge en la Reserva Nacional de Tambopata",
    "Sobrevolar las Líneas de Nazca",
    "Explorar los mercados artesanales de Cusco",
    "Visitar las comunidades locales del Lago Titicaca",
  ],
  ideas: [
    { title: "Triángulo Clásico", blurb: "Lima, Cusco y Machu Picchu en 7-9 días. La introducción perfecta." },
    { title: "Aventura Amazónica", blurb: "Iquitos y la selva norte, una inmersión profunda en la biodiversidad." },
    { title: "Sur Desconocido", blurb: "Arequipa, el Cañón del Colca y la costa desértica." },
  ],
  faqs: [
    { q: "¿Es difícil el mal de altura?", a: "Puede afectar en Cusco y el Lago Titicaca. Recomendamos aclimatarse el primer día, beber mate de coca y moverse con calma." },
    { q: "¿Qué tan exigente es el Camino Inca?", a: "Requiere buena condición física. Hay alternativas más moderadas como el tren o rutas de trekking más cortas." },
    { q: "¿Es la comida peruana muy picante?", a: "No toda. La gastronomía peruana es increíblemente diversa. Siempre puedes pedir platos sin ají (chile)." },
  ],
  heroImage: "/images/bitacoras/peru.jpg",
  gallery: [
    "/images/bitacoras/peru-gallery-1.jpg",
    "/images/bitacoras/peru-gallery-2.jpg",
    "/images/bitacoras/peru-gallery-3.jpg",
    "/images/bitacoras/peru-gallery-4.jpg",
  ]
};

export default peru;