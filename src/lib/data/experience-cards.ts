/**
 * Experience card content (photo-header ExperienceCard) by traveler type × level.
 * Source: "Randomtrip-36-tarjetas" design artifact (Spanish copy verbatim, English
 * translated). Prices are NOT here — they keep coming from traveler-types /
 * pricing resolvers. Honeymoon (NUPTIA) only has Atelier.
 */

import type { LevelSlug } from "@/types/core";
import type {
  ExperienceCardContent,
  ExperienceCardSource,
} from "@/types/planner";
import { normalizeExperienceLevelId } from "@/lib/data/experience-levels";
import type { TravelerTypeSlug } from "@/lib/data/traveler-types";

const EXPERIENCE_CARDS: Record<
  TravelerTypeSlug,
  Partial<Record<LevelSlug, ExperienceCardSource>>
> = {
  solo: {
    xsed: {
      copy: {
        en: {
          ctaLabel: "DON’T MISS THE DROP",
          description:
            "One night, one dinner and a local experience close to home. Head out in your own car and get a change of scenery.",
          details: [
            { label: "Duration", value: "1 night · Saturday to Sunday" },
            {
              label: "Destination",
              value: "Within 300 km of your starting point",
            },
            {
              label: "Transport",
              value: "In your own vehicle",
              kind: "transport",
            },
            { label: "Accommodation", value: "1 night of accommodation" },
            {
              label: "Includes",
              value: "Saturday dinner + a local experience",
            },
          ],
          eyebrow: "A weekend just for you",
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt: "A traveler next to her vehicle on a road-trip getaway",
          revealNote: "Destination revealed 48 h before",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "NO TE PIERDAS EL DROP",
          description:
            "Una noche, una cena y una experiencia local cerca de casa. Sal en tu propio auto y cambia de aire.",
          details: [
            { label: "Duración", value: "1 noche · sábado a domingo" },
            { label: "Destino", value: "A menos de 300 km del origen" },
            {
              label: "Transporte",
              value: "En tu propio vehículo",
              kind: "transport",
            },
            { label: "Alojamiento", value: "1 noche de alojamiento" },
            {
              label: "Incluye",
              value: "Cena de sábado + una experiencia local",
            },
          ],
          eyebrow: "Un fin de semana para ti",
          footnotes: [],
          kicker: "X Suerte Es Domingo",
          name: "XSED™",
          photoAlt: "Viajera junto a su vehículo en una escapada por carretera",
          revealNote: "Destino revelado 48 h antes",
          tag: "THE SUNDAY GLITCH",
          transportNote: "En tu propio vehículo",
        },
      },
      ctaStyle: "feature",
      photoPosition: "center 58%",
      transport: { modes: ["car-front"] },
    },
    essenza: {
      copy: {
        en: {
          ctaLabel: "DESIGN YOUR ESSENZA™",
          description:
            "Two nights for a change of scenery, with transport and accommodation sorted. A short escape to lose yourself in the simple and find yourself in the unexpected.",
          details: [
            { label: "Duration", value: "2 nights" },
            { label: "Destinations", value: "Domestic" },
            {
              label: "Transport",
              value: "Bus, train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Comfort · 3★ or equivalent" },
            { label: "Includes", value: "Essential destination guide" },
          ],
          eyebrow: "A break at your own pace.",
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "A traveler enjoys a coffee at her own pace",
          revealNote: "Destination revealed 48 h before",
          tag: "SOLUM™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "DISEÑA TU ESSENZA™",
          description:
            "Dos noches para cambiar de aire, con transporte y alojamiento resuelto. Un escape breve para perderte en lo simple y encontrarte en lo inesperado.",
          details: [
            { label: "Duración", value: "2 noches" },
            { label: "Destinos", value: "Nacionales" },
            {
              label: "Transporte",
              value: "Autobús, tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Confort · 3★ o equivalente" },
            { label: "Incluye", value: "Guía esencial del destino" },
          ],
          eyebrow: "Una pausa a tu ritmo.",
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt: "Una viajera disfruta de un café a su propio ritmo",
          revealNote: "Destino revelado 48 h antes",
          tag: "SOLUM™ · EXPRESS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 18%",
      transport: { modes: ["bus-front", "train-front", "ship", "plane"] },
    },
    "modo-explora": {
      copy: {
        en: {
          ctaLabel: "ACTIVATE YOUR MODO EXPLORA™",
          description:
            "Three nights to explore a little further, with accommodation full of personality and a Randomtrip guide for those who travel light and want to discover without a script.",
          details: [
            { label: "Duration", value: "3 nights" },
            { label: "Destinations", value: "Domestic and regional" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "With personality · 3–4★" },
            { label: "Includes", value: "Randomtrip destination guide" },
          ],
          eyebrow: "Follow your curiosity.",
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt: "A traveler takes in the landscape from the train",
          revealNote: "Destination revealed 48 h before",
          tag: "SOLUM™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ACTIVA TU MODO EXPLORA™",
          description:
            "Tres noches para explorar un poco más lejos, con un alojamiento con personalidad y una guía Randomtrip para quienes viajan livianos y quieren descubrir sin guion.",
          details: [
            { label: "Duración", value: "3 noches" },
            { label: "Destinos", value: "Nacionales y regionales" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Con personalidad · 3–4★" },
            { label: "Incluye", value: "Guía Randomtrip del destino" },
          ],
          eyebrow: "Sigue tu curiosidad.",
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Una viajera contempla el paisaje desde el tren",
          revealNote: "Destino revelado 48 h antes",
          tag: "SOLUM™ · CONFIDENCIAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 42%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    "explora-plus": {
      copy: {
        en: {
          ctaLabel: "LEVEL UP",
          description:
            "Four nights, premium accommodation and an included experience to connect with the destination beyond the obvious.",
          details: [
            { label: "Duration", value: "4 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Premium · 4★" },
            {
              label: "Includes",
              value: "1 experience + Destination Decoded* guide",
            },
          ],
          eyebrow: "Give your trip more depth.",
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt: "A traveler gazes at the clouds from a lookout",
          revealNote: "Destination revealed 48 h before",
          tag: "SOLUM™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "SUBE DE NIVEL",
          description:
            "Cuatro noches, alojamiento premium y una experiencia incluida para conectar con el destino más allá de lo evidente.",
          details: [
            { label: "Duración", value: "4 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Premium · 4★" },
            {
              label: "Incluye",
              value: "1 experiencia + Guía Destination Decoded*",
            },
          ],
          eyebrow: "Dale más profundidad al viaje.",
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt: "Un viajero contempla las nubes desde un mirador",
          revealNote: "Destino revelado 48 h antes",
          tag: "SOLUM™ · VUELVE DISTINTO",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 50%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    bivouac: {
      copy: {
        en: {
          ctaLabel: "TRAVEL DIFFERENTLY",
          description:
            "Five nights to slow down. An intimate trip, cared for down to the detail, that turns solitude into a personal luxury.",
          details: [
            { label: "Duration", value: "5 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Plane + boat, train or car, as the route requires",
              kind: "transport",
            },
            { label: "Accommodation", value: "Design and service · 4–5★" },
            {
              label: "Includes",
              value:
                "1 exclusive experience + Destination Decoded+* guide + Randomtrip accommodation perks**",
            },
          ],
          eyebrow: "Time for you. Care in every detail.",
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt: "A traveler enjoys the sea from a balcony",
          revealNote: "Destination revealed 48 h before",
          tag: "SOLUM™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "VIAJA DISTINTO",
          description:
            "Cinco noches para bajar el ritmo. Un viaje íntimo, cuidado al detalle, que convierte la soledad en un lujo personal.",
          details: [
            { label: "Duración", value: "5 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Avión + barco, tren o auto, según lo requiera la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Diseño y servicio · 4–5★" },
            {
              label: "Incluye",
              value:
                "1 experiencia exclusiva + Guía Destination Decoded+* + Beneficios Randomtrip en alojamiento**",
            },
          ],
          eyebrow: "Tiempo para ti. Cuidado al detalle.",
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt: "Una viajera disfruta del mar desde un balcón",
          revealNote: "Destino revelado 48 h antes",
          tag: "SOLUM™ · DESCONEXIÓN TOTAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 40%",
      transport: {
        modes: ["plane"],
        optionalModes: ["ship", "train-front", "car-front"],
      },
    },
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "LET’S CREATE THE UNREPEATABLE",
          description:
            "The luxury of traveling without witnesses, creating together experiences that become confidential. A blank canvas to create the getaway no one else will ever repeat.",
          details: [
            { label: "Duration", value: "Tailor-made" },
            { label: "Destinations", value: "Based on your travel project" },
            {
              label: "Transport",
              value: "Defined with your advisor",
              kind: "transport",
            },
            { label: "Accommodation", value: "High-end and boutique hotels" },
            {
              label: "Includes",
              value: "One-to-one design with a Tripper Travel Advisor",
            },
          ],
          eyebrow: "Your Tripper Travel Advisor SOLUM™ EDITION.",
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "A traveler alone facing the sea in a design space",
          revealNote: "Destination revealed 48 h before",
          tag: "SOLUM™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "CREEMOS LO IRREPETIBLE",
          description:
            "El lujo de viajar sin testigos, creando juntos experiencias que se vuelven confidenciales. Un lienzo en blanco para crear la escapada que nadie más podrá repetir.",
          details: [
            { label: "Duración", value: "A medida" },
            { label: "Destinos", value: "Según tu proyecto de viaje" },
            {
              label: "Transporte",
              value: "Definido con tu advisor",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Alta gama y hoteles de autor" },
            {
              label: "Incluye",
              value: "Diseño uno a uno con un Tripper Travel Advisor",
            },
          ],
          eyebrow: "Tu Tripper Travel Advisor SOLUM™ EDITION.",
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt: "Un viajero a solas frente al mar en un espacio de diseño",
          revealNote: "Destino revelado 48 h antes",
          tag: "SOLUM™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center 74%",
    },
  },
  couple: {
    xsed: {
      copy: {
        en: {
          ctaLabel: "DON’T MISS THE DROP",
          description:
            "One night, one dinner and a local experience close to home. You get the car ready; we take care of the plan.",
          details: [
            { label: "Duration", value: "1 night · Saturday to Sunday" },
            {
              label: "Destination",
              value: "Within 300 km of your starting point",
            },
            {
              label: "Transport",
              value: "In your own vehicle",
              kind: "transport",
            },
            { label: "Accommodation", value: "1 night of accommodation" },
            {
              label: "Includes",
              value: "Saturday dinner + a local experience",
            },
          ],
          eyebrow: "A weekend away from the usual.",
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "A couple planning their route with a map next to their vehicle.",
          revealNote: "Destination revealed 48 h before",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "NO SE PIERDAN EL DROP",
          description:
            "Una noche, una cena y una experiencia local cerca de casa. Ustedes preparan el auto; nosotros, el plan.",
          details: [
            { label: "Duración", value: "1 noche · sábado a domingo" },
            { label: "Destino", value: "A menos de 300 km del origen" },
            {
              label: "Transporte",
              value: "En tu propio vehículo",
              kind: "transport",
            },
            { label: "Alojamiento", value: "1 noche de alojamiento" },
            {
              label: "Incluye",
              value: "Cena de sábado + una experiencia local",
            },
          ],
          eyebrow: "Un fin de semana fuera de lo de siempre.",
          footnotes: [],
          kicker: "X Suerte Es Domingo",
          name: "XSED™",
          photoAlt:
            "Pareja preparando su recorrido con un mapa junto a su vehículo.",
          revealNote: "Destino revelado 48 h antes",
          tag: "THE SUNDAY GLITCH",
          transportNote: "En tu propio vehículo",
        },
      },
      ctaStyle: "feature",
      photoPosition: "center 45%",
      transport: { modes: ["car-front"] },
    },
    essenza: {
      copy: {
        en: {
          ctaLabel: "TAKE THE FIRST STEP",
          description:
            "Trade the routine for an unexpected destination. A short getaway, just enough to see each other differently and remember why it all began.",
          details: [
            { label: "Duration", value: "2 nights" },
            { label: "Destinations", value: "Domestic" },
            {
              label: "Transport",
              value: "Bus, train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Comfort · 3★ or equivalent" },
            { label: "Includes", value: "Essential destination guide" },
          ],
          eyebrow: "Two nights to find each other.",
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "Two men in a couple sharing a close moment outdoors.",
          revealNote: "Destination revealed 48 h before",
          tag: "BOND™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "DEN EL PRIMER PASO",
          description:
            "Cambien la rutina por un destino inesperado. Una escapada breve, suficiente para mirarse distinto y recordar por qué empezó todo.",
          details: [
            { label: "Duración", value: "2 noches" },
            { label: "Destinos", value: "Nacionales" },
            {
              label: "Transporte",
              value: "Autobús, tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Confort · 3★ o equivalente" },
            { label: "Incluye", value: "Guía esencial del destino" },
          ],
          eyebrow: "Dos noches para encontrarse.",
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt:
            "Dos hombres en pareja compartiendo un momento de complicidad al aire libre.",
          revealNote: "Destino revelado 48 h antes",
          tag: "BOND™ · EXPRESS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 20%",
      transport: { modes: ["bus-front", "train-front", "ship", "plane"] },
    },
    "modo-explora": {
      copy: {
        en: {
          ctaLabel: "EXPLORE YOUR STORY",
          description:
            "Three nights to discover new places, follow your own detours and enjoy a getaway at your own pace.",
          details: [
            { label: "Duration", value: "3 nights" },
            { label: "Destinations", value: "Domestic and regional" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "With personality · 3–4★" },
            { label: "Includes", value: "Randomtrip destination guide" },
          ],
          eyebrow: "Curiosity is better shared.",
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt:
            "A couple embracing as they take in a green landscape from a train window.",
          revealNote: "Destination revealed 48 h before",
          tag: "BOND™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "EXPLOREN SU HISTORIA",
          description:
            "Tres noches para descubrir nuevos lugares, seguir sus propios desvíos y disfrutar de una escapada a su ritmo.",
          details: [
            { label: "Duración", value: "3 noches" },
            { label: "Destinos", value: "Nacionales y regionales" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Con personalidad · 3–4★" },
            { label: "Incluye", value: "Guía Randomtrip del destino" },
          ],
          eyebrow: "La curiosidad se comparte.",
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt:
            "Pareja abrazada contemplando un paisaje verde desde la ventana de un tren.",
          revealNote: "Destino revelado 48 h antes",
          tag: "BOND™ · CONFIDENCIAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 30%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    "explora-plus": {
      copy: {
        en: {
          ctaLabel: "RAISE THE STAKES",
          description:
            "You bring the story; we turn it into a setting: no logistical friction, with experiences that connect and just the right dose of mystery.",
          details: [
            { label: "Duration", value: "4 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Premium · 4★" },
            {
              label: "Includes",
              value: "1 experience + Destination Decoded* guide",
            },
          ],
          eyebrow: "More time. More moments for two.",
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt:
            "A couple sitting together facing a valley of green mountains.",
          revealNote: "Destination revealed 48 h before",
          tag: "BOND™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "SUBAN LA APUESTA",
          description:
            "Ustedes traen la historia; nosotros la transformamos en escenario: sin fricciones logísticas, con experiencias que conectan y la dosis justa de misterio.",
          details: [
            { label: "Duración", value: "4 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Premium · 4★" },
            {
              label: "Incluye",
              value: "1 experiencia + Guía Destination Decoded*",
            },
          ],
          eyebrow: "Más tiempo. Más momentos de a dos.",
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Pareja sentada junta frente a un valle de montañas verdes.",
          revealNote: "Destino revelado 48 h antes",
          tag: "BOND™ · VUELVAN DISTINTOS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 81%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    bivouac: {
      copy: {
        en: {
          ctaLabel: "TRAVEL DIFFERENTLY",
          description:
            "Five nights to get lost and find each other again. A trip cared for the way you care for a relationship: with detail and patience.",
          details: [
            { label: "Duration", value: "5 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Plane + boat, train or car, as the route requires",
              kind: "transport",
            },
            { label: "Accommodation", value: "Design and service · 4–5★" },
            {
              label: "Includes",
              value:
                "1 exclusive experience + Destination Decoded+* guide + Randomtrip accommodation perks**",
            },
          ],
          eyebrow: "Handcrafted romance.",
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt:
            "A couple embracing as they relax in a pool overlooking green surroundings.",
          revealNote: "Destination revealed 48 h before",
          tag: "BOND™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "VIAJEN DISTINTO",
          description:
            "Cinco noches para perderse y reencontrarse. Un viaje que se cuida como se cuida una relación: con detalle y paciencia.",
          details: [
            { label: "Duración", value: "5 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Avión + barco, tren o auto, según lo requiera la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Diseño y servicio · 4–5★" },
            {
              label: "Incluye",
              value:
                "1 experiencia exclusiva + Guía Destination Decoded+* + Beneficios Randomtrip en alojamiento**",
            },
          ],
          eyebrow: "Romance artesanal.",
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt:
            "Pareja abrazada descansando en una piscina con vista a un entorno verde.",
          revealNote: "Destino revelado 48 h antes",
          tag: "BOND™ · DESCONEXIÓN TOTAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 58%",
      transport: {
        modes: ["plane"],
        optionalModes: ["ship", "train-front", "car-front"],
      },
    },
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "LET’S CREATE THE UNREPEATABLE",
          description:
            "The luxury of traveling without witnesses, creating together experiences that become confidential. A blank canvas to create the trip no one but the two of you will ever repeat.",
          details: [
            { label: "Duration", value: "Tailor-made" },
            { label: "Destinations", value: "Based on your travel project" },
            {
              label: "Transport",
              value: "Defined with your advisor",
              kind: "transport",
            },
            { label: "Accommodation", value: "High-end and boutique hotels" },
            {
              label: "Includes",
              value: "One-to-one design with a Tripper Travel Advisor",
            },
          ],
          eyebrow: "Your Tripper Travel Advisor BOND™ EDITION.",
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "Two women in a couple embracing by the sea.",
          revealNote: "Destination revealed 48 h before",
          tag: "BOND™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "CREEMOS LO IRREPETIBLE",
          description:
            "El lujo de viajar sin testigos, creando juntos experiencias que se vuelven confidenciales. Un lienzo en blanco para crear el viaje que nadie más que ustedes podrán repetir.",
          details: [
            { label: "Duración", value: "A medida" },
            { label: "Destinos", value: "Según su proyecto de viaje" },
            {
              label: "Transporte",
              value: "Definido con su advisor",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Alta gama y hoteles de autor" },
            {
              label: "Incluye",
              value: "Diseño uno a uno con un Tripper Travel Advisor",
            },
          ],
          eyebrow: "Su Tripper Travel Advisor BOND™ EDITION.",
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt: "Dos mujeres en pareja abrazándose junto al mar.",
          revealNote: "Destino revelado 48 h antes",
          tag: "BOND™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center",
    },
  },
  group: {
    xsed: {
      copy: {
        en: {
          ctaLabel: "DON’T MISS THE DROP",
          description:
            "One night, one dinner and a local experience close to home. Gather the group and get your vehicles ready; we take care of the plan.",
          details: [
            { label: "Duration", value: "1 night · Saturday to Sunday" },
            {
              label: "Destination",
              value: "Within 300 km of your starting point",
            },
            {
              label: "Transport",
              value: "In your own vehicles",
              kind: "transport",
            },
            { label: "Accommodation", value: "1 night of accommodation" },
            {
              label: "Includes",
              value: "Saturday dinner + a local experience",
            },
          ],
          eyebrow: "From the group chat to the road.",
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt: "Four friends playing cards next to their vehicle.",
          revealNote: "Destination revealed 48 h before",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicles",
        },
        es: {
          ctaLabel: "NO SE PIERDAN EL DROP",
          description:
            "Una noche, una cena y una experiencia local cerca de casa. Reúnan al grupo y preparen sus vehículos; nosotros nos ocupamos del plan.",
          details: [
            { label: "Duración", value: "1 noche · sábado a domingo" },
            { label: "Destino", value: "A menos de 300 km del origen" },
            {
              label: "Transporte",
              value: "En sus propios vehículos",
              kind: "transport",
            },
            { label: "Alojamiento", value: "1 noche de alojamiento" },
            {
              label: "Incluye",
              value: "Cena de sábado + una experiencia local",
            },
          ],
          eyebrow: "Del chat a la ruta.",
          footnotes: [],
          kicker: "X Suerte Es Domingo",
          name: "XSED™",
          photoAlt:
            "Cuatro amigos compartiendo una partida de cartas junto a su vehículo.",
          revealNote: "Destino revelado 48 h antes",
          tag: "THE SUNDAY GLITCH",
          transportNote: "En sus propios vehículos",
        },
      },
      ctaStyle: "feature",
      photoPosition: "center top",
      transport: { modes: ["car-front"] },
    },
    essenza: {
      copy: {
        en: {
          ctaLabel: "MAKE IT HAPPEN",
          description:
            "Two nights to finally make that long-postponed plan happen. Transport and accommodation sorted, time to catch up and freedom to enjoy it together.",
          details: [
            { label: "Duration", value: "2 nights" },
            { label: "Destinations", value: "Domestic" },
            {
              label: "Transport",
              value: "Bus, train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Comfort · 3★ or equivalent" },
            { label: "Includes", value: "Essential destination guide" },
          ],
          eyebrow: "The plan that finally happens.",
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "Three friends sharing coffee and conversation outdoors.",
          revealNote: "Destination revealed 48 h before",
          tag: "CREW™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "HAGAN QUE SUCEDA",
          description:
            "Dos noches para que ese plan pendiente por fin suceda. Transporte y alojamiento resueltos, tiempo para ponerse al día y libertad para disfrutar juntos.",
          details: [
            { label: "Duración", value: "2 noches" },
            { label: "Destinos", value: "Nacionales" },
            {
              label: "Transporte",
              value: "Autobús, tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Confort · 3★ o equivalente" },
            { label: "Incluye", value: "Guía esencial del destino" },
          ],
          eyebrow: "El plan que por fin sucede.",
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt:
            "Tres amigos compartiendo un café y una conversación al aire libre.",
          revealNote: "Destino revelado 48 h antes",
          tag: "CREW™ · EXPRESS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 45%",
      transport: { modes: ["bus-front", "train-front", "ship", "plane"] },
    },
    "modo-explora": {
      copy: {
        en: {
          ctaLabel: "BREAK THE USUAL PLAN",
          description:
            "Three nights to follow the group’s curiosity. An unexpected destination, accommodation full of personality and a Randomtrip guide to discover together, without a script.",
          details: [
            { label: "Duration", value: "3 nights" },
            { label: "Destinations", value: "Domestic and regional" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "With personality · 3–4★" },
            { label: "Includes", value: "Randomtrip destination guide" },
          ],
          eyebrow: "Curiosity is contagious.",
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt:
            "A group of friends looking out over a lake among the mountains.",
          revealNote: "Destination revealed 48 h before",
          tag: "CREW™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "SALGAN DEL PLAN DE SIEMPRE",
          description:
            "Tres noches para seguir la curiosidad del grupo. Un destino inesperado, un alojamiento con personalidad y una guía Randomtrip para descubrir juntos, sin guion.",
          details: [
            { label: "Duración", value: "3 noches" },
            { label: "Destinos", value: "Nacionales y regionales" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Con personalidad · 3–4★" },
            { label: "Incluye", value: "Guía Randomtrip del destino" },
          ],
          eyebrow: "La curiosidad se contagia.",
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Grupo de amigos contemplando un lago entre montañas.",
          revealNote: "Destino revelado 48 h antes",
          tag: "CREW™ · CONFIDENCIAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 65%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    "explora-plus": {
      copy: {
        en: {
          ctaLabel: "ADD ANOTHER STORY",
          description:
            "You bring the bond; we bring the setting. Four nights to share an experience and come back with stories only the group understands.",
          details: [
            { label: "Duration", value: "4 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Premium · 4★" },
            {
              label: "Includes",
              value: "1 experience + Destination Decoded* guide",
            },
          ],
          eyebrow: "A story for the whole group.",
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt: "Four friends sharing food and conversation on a terrace.",
          revealNote: "Destination revealed 48 h before",
          tag: "CREW™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "SUMEN OTRA HISTORIA",
          description:
            "Ustedes traen la complicidad; nosotros, el escenario. Cuatro noches para compartir una experiencia y volver con historias que solo el grupo entiende.",
          details: [
            { label: "Duración", value: "4 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Premium · 4★" },
            {
              label: "Incluye",
              value: "1 experiencia + Guía Destination Decoded*",
            },
          ],
          eyebrow: "Una historia para todo el grupo.",
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Cuatro amigos compartiendo sabores y conversación en una terraza.",
          revealNote: "Destino revelado 48 h antes",
          tag: "CREW™ · VUELVAN DISTINTOS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 35%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    bivouac: {
      copy: {
        en: {
          ctaLabel: "TRAVEL DIFFERENTLY",
          description:
            "Five nights to stop counting the hours and start being present. A trip cared for down to the detail, to reconnect with the people who make the journey special.",
          details: [
            { label: "Duration", value: "5 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Plane + boat, train or car, as the route requires",
              kind: "transport",
            },
            { label: "Accommodation", value: "Design and service · 4–5★" },
            {
              label: "Includes",
              value:
                "1 exclusive experience + Destination Decoded+* guide + Randomtrip accommodation perks**",
            },
          ],
          eyebrow: "Getting together deserves this time.",
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt:
            "A group of friends relaxing on a wooden deck facing a green landscape.",
          revealNote: "Destination revealed 48 h before",
          tag: "CREW™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "VIAJEN DISTINTO",
          description:
            "Cinco noches para dejar de contar las horas y empezar a estar presentes. Un viaje cuidado al detalle, para reconectar con quienes hacen especial el camino.",
          details: [
            { label: "Duración", value: "5 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Avión + barco, tren o auto, según lo requiera la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Diseño y servicio · 4–5★" },
            {
              label: "Incluye",
              value:
                "1 experiencia exclusiva + Guía Destination Decoded+* + Beneficios Randomtrip en alojamiento**",
            },
          ],
          eyebrow: "Juntarse merece este tiempo.",
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt:
            "Grupo de amigos descansando en una terraza de madera frente a un paisaje verde.",
          revealNote: "Destino revelado 48 h antes",
          tag: "CREW™ · DESCONEXIÓN TOTAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 60%",
      transport: {
        modes: ["plane"],
        optionalModes: ["ship", "train-front", "car-front"],
      },
    },
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "LET’S CREATE THE UNREPEATABLE",
          description:
            "Some trips only make sense with certain people. A blank canvas to create, with your Tripper Travel Advisor, an experience that bears the group’s signature.",
          details: [
            { label: "Duration", value: "Tailor-made" },
            { label: "Destinations", value: "Based on your travel project" },
            {
              label: "Transport",
              value: "Defined with your advisor",
              kind: "transport",
            },
            { label: "Accommodation", value: "High-end and boutique hotels" },
            {
              label: "Includes",
              value: "One-to-one design with a Tripper Travel Advisor",
            },
          ],
          eyebrow: "Your Tripper Travel Advisor CREW™ EDITION.",
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "Friends sharing a break on the deck of a boat at sunset.",
          revealNote: "Destination revealed 48 h before",
          tag: "CREW™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "CREEMOS LO IRREPETIBLE",
          description:
            "Hay viajes que solo tienen sentido con ciertas personas. Un lienzo en blanco para crear, junto a su Tripper Travel Advisor, una experiencia que lleve la firma del grupo.",
          details: [
            { label: "Duración", value: "A medida" },
            { label: "Destinos", value: "Según su proyecto de viaje" },
            {
              label: "Transporte",
              value: "Definido con su advisor",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Alta gama y hoteles de autor" },
            {
              label: "Incluye",
              value: "Diseño uno a uno con un Tripper Travel Advisor",
            },
          ],
          eyebrow: "Su Tripper Travel Advisor CREW™ EDITION.",
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Amigos compartiendo una pausa en la cubierta de una embarcación al atardecer.",
          revealNote: "Destino revelado 48 h antes",
          tag: "CREW™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center 52%",
    },
  },
  family: {
    xsed: {
      copy: {
        en: {
          ctaLabel: "DON’T MISS THE DROP",
          description:
            "One night, one dinner and a local experience close to home. Get your vehicle ready; we take care of a plan to discover as a family.",
          details: [
            { label: "Duration", value: "1 night · Saturday to Sunday" },
            {
              label: "Destination",
              value: "Within 300 km of your starting point",
            },
            {
              label: "Transport",
              value: "In your own vehicle",
              kind: "transport",
            },
            { label: "Accommodation", value: "1 night of accommodation" },
            {
              label: "Includes",
              value: "Saturday dinner + a local experience",
            },
          ],
          eyebrow: "A weekend to be together.",
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "A family getting their vehicle ready for an outdoor getaway.",
          revealNote: "Destination revealed 48 h before",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "NO SE PIERDAN EL DROP",
          description:
            "Una noche, una cena y una experiencia local cerca de casa. Preparen su vehículo; nosotros nos ocupamos de un plan para descubrir en familia.",
          details: [
            { label: "Duración", value: "1 noche · sábado a domingo" },
            { label: "Destino", value: "A menos de 300 km del origen" },
            {
              label: "Transporte",
              value: "En su propio vehículo",
              kind: "transport",
            },
            { label: "Alojamiento", value: "1 noche de alojamiento" },
            {
              label: "Incluye",
              value: "Cena de sábado + una experiencia local",
            },
          ],
          eyebrow: "Un fin de semana para estar juntos.",
          footnotes: [],
          kicker: "X Suerte Es Domingo",
          name: "XSED™",
          photoAlt:
            "Familia preparando su vehículo para compartir una escapada al aire libre.",
          revealNote: "Destino revelado 48 h antes",
          tag: "THE SUNDAY GLITCH",
          transportNote: "En su propio vehículo",
        },
      },
      ctaStyle: "feature",
      photoPosition: "center top",
      transport: { modes: ["car-front"] },
    },
    essenza: {
      copy: {
        en: {
          ctaLabel: "GET AWAY TOGETHER",
          description:
            "Two nights for a change of scenery and time to really see each other again. Transport and accommodation sorted, to enjoy the simple things and discover the unexpected together.",
          details: [
            { label: "Duration", value: "2 nights" },
            { label: "Destinations", value: "Domestic" },
            {
              label: "Transport",
              value: "Bus, train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Comfort · 3★ or equivalent" },
            { label: "Includes", value: "Essential destination guide" },
          ],
          eyebrow: "A break to share.",
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "A family sharing a break and a picnic in a park.",
          revealNote: "Destination revealed 48 h before",
          tag: "KIN™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "CAMBIEN DE AIRE JUNTOS",
          description:
            "Dos noches para cambiar de aire y volver a mirarse con tiempo. Transporte y alojamiento resueltos, para disfrutar lo simple y descubrir juntos lo inesperado.",
          details: [
            { label: "Duración", value: "2 noches" },
            { label: "Destinos", value: "Nacionales" },
            {
              label: "Transporte",
              value: "Autobús, tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Confort · 3★ o equivalente" },
            { label: "Incluye", value: "Guía esencial del destino" },
          ],
          eyebrow: "Una pausa que se comparte.",
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt: "Familia compartiendo una pausa y un picnic en un parque.",
          revealNote: "Destino revelado 48 h antes",
          tag: "KIN™ · EXPRESS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 52%",
      transport: { modes: ["bus-front", "train-front", "ship", "plane"] },
    },
    "modo-explora": {
      copy: {
        en: {
          ctaLabel: "DISCOVER AT YOUR OWN PACE",
          description:
            "Three nights to turn every outing into a new question. Accommodation full of personality and a Randomtrip guide to explore together, at your own pace.",
          details: [
            { label: "Duration", value: "3 nights" },
            { label: "Destinations", value: "Domestic and regional" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "With personality · 3–4★" },
            { label: "Includes", value: "Randomtrip destination guide" },
          ],
          eyebrow: "Curiosity has no age.",
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt: "A family walking a forest trail among the trees.",
          revealNote: "Destination revealed 48 h before",
          tag: "KIN™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "DESCUBRAN A SU RITMO",
          description:
            "Tres noches para convertir cada paseo en una nueva pregunta. Un alojamiento con personalidad y una guía Randomtrip para explorar juntos, a su propio ritmo.",
          details: [
            { label: "Duración", value: "3 noches" },
            { label: "Destinos", value: "Nacionales y regionales" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Con personalidad · 3–4★" },
            { label: "Incluye", value: "Guía Randomtrip del destino" },
          ],
          eyebrow: "La curiosidad no tiene edad.",
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Familia recorriendo un sendero de bosque entre árboles.",
          revealNote: "Destino revelado 48 h antes",
          tag: "KIN™ · CONFIDENCIAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 48%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    "explora-plus": {
      copy: {
        en: {
          ctaLabel: "ADD A NEW MEMORY",
          description:
            "Four nights to share something you haven’t experienced together yet. An included experience and a personalized guide to add a new family story.",
          details: [
            { label: "Duration", value: "4 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Train, boat or plane, depending on the route",
              kind: "transport",
            },
            { label: "Accommodation", value: "Premium · 4★" },
            {
              label: "Includes",
              value: "1 experience + Destination Decoded* guide",
            },
          ],
          eyebrow: "Memories that grow with you.",
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt:
            "A mother and daughter sharing a moment in an apple orchard.",
          revealNote: "Destination revealed 48 h before",
          tag: "KIN™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "SUMEN UN NUEVO RECUERDO",
          description:
            "Cuatro noches para compartir algo que todavía no han vivido juntos. Una experiencia incluida y una guía personalizada para sumar una nueva historia familiar.",
          details: [
            { label: "Duración", value: "4 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Tren, barco o avión, según la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Premium · 4★" },
            {
              label: "Incluye",
              value: "1 experiencia + Guía Destination Decoded*",
            },
          ],
          eyebrow: "Recuerdos que crecen con ustedes.",
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Madre e hija compartiendo un momento en un huerto de manzanas.",
          revealNote: "Destino revelado 48 h antes",
          tag: "KIN™ · VUELVAN DISTINTOS",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center 30%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    bivouac: {
      copy: {
        en: {
          ctaLabel: "TRAVEL DIFFERENTLY",
          description:
            "Five nights to trade the rush for shared time. A trip cared for down to the detail, to be present and enjoy what truly brings you together.",
          details: [
            { label: "Duration", value: "5 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value: "Plane + boat, train or car, as the route requires",
              kind: "transport",
            },
            { label: "Accommodation", value: "Design and service · 4–5★" },
            {
              label: "Includes",
              value:
                "1 exclusive experience + Destination Decoded+* guide + Randomtrip accommodation perks**",
            },
          ],
          eyebrow: "More time to be present.",
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt: "A family walking by the sea in the warm light of sunset.",
          revealNote: "Destination revealed 48 h before",
          tag: "KIN™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "VIAJEN DISTINTO",
          description:
            "Cinco noches para cambiar las prisas por tiempo compartido. Un viaje cuidado al detalle, para estar presentes y disfrutar de lo que de verdad los une.",
          details: [
            { label: "Duración", value: "5 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value: "Avión + barco, tren o auto, según lo requiera la ruta",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Diseño y servicio · 4–5★" },
            {
              label: "Incluye",
              value:
                "1 experiencia exclusiva + Guía Destination Decoded+* + Beneficios Randomtrip en alojamiento**",
            },
          ],
          eyebrow: "Más tiempo para estar presentes.",
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt:
            "Familia caminando junto al mar con la luz cálida del atardecer.",
          revealNote: "Destino revelado 48 h antes",
          tag: "KIN™ · DESCONEXIÓN TOTAL",
          transportNote: "Según la ruta",
        },
      },
      photoPosition: "center top",
      transport: {
        modes: ["plane"],
        optionalModes: ["ship", "train-front", "car-front"],
      },
    },
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "LET’S CREATE THE UNREPEATABLE",
          description:
            "Every family has its own way of traveling. A blank canvas to create, with your Tripper Travel Advisor, a getaway that fits your ages, interests and rhythms.",
          details: [
            { label: "Duration", value: "Tailor-made" },
            { label: "Destinations", value: "Based on your travel project" },
            {
              label: "Transport",
              value: "Defined with your advisor",
              kind: "transport",
            },
            { label: "Accommodation", value: "High-end and boutique hotels" },
            {
              label: "Includes",
              value: "One-to-one design with a Tripper Travel Advisor",
            },
          ],
          eyebrow: "Your Tripper Travel Advisor KIN™ EDITION.",
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Grandparents and granddaughters sharing a break by the sea and the boats.",
          revealNote: "Destination revealed 48 h before",
          tag: "KIN™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "CREEMOS LO IRREPETIBLE",
          description:
            "Cada familia tiene su forma de viajar. Un lienzo en blanco para crear una escapada que contemple sus edades, intereses y ritmos, junto a su Tripper Travel Advisor.",
          details: [
            { label: "Duración", value: "A medida" },
            { label: "Destinos", value: "Según su proyecto de viaje" },
            {
              label: "Transporte",
              value: "Definido con su advisor",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Alta gama y hoteles de autor" },
            {
              label: "Incluye",
              value: "Diseño uno a uno con un Tripper Travel Advisor",
            },
          ],
          eyebrow: "Su Tripper Travel Advisor KIN™ EDITION.",
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Abuelos y nietas compartiendo una pausa junto al mar y las embarcaciones.",
          revealNote: "Destino revelado 48 h antes",
          tag: "KIN™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center 25%",
    },
  },
  honeymoon: {
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "LET’S CREATE YOUR HONEYMOON",
          description:
            "Your honeymoon, designed around the two of you. A blank canvas to create, with your Tripper Travel Advisor, the trip that marks this new beginning.",
          details: [
            { label: "Duration", value: "Tailor-made" },
            { label: "Destinations", value: "Based on your travel project" },
            {
              label: "Transport",
              value: "Defined with your advisor",
              kind: "transport",
            },
            { label: "Accommodation", value: "High-end and boutique hotels" },
            {
              label: "Includes",
              value: "One-to-one design with a Tripper Travel Advisor",
            },
          ],
          eyebrow: "Your Tripper Travel Advisor NUPTIA™ EDITION.",
          footnotes: [],
          kicker: "Your honeymoon, designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "A couple shares an intimate moment during their trip.",
          revealNote: "Destination revealed 48 h before",
          tag: "NUPTIA™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "CREEMOS SU LUNA DE MIEL",
          description:
            "Su luna de miel, diseñada alrededor de ustedes. Un lienzo en blanco para crear, junto a su Tripper Travel Advisor, el viaje que marque este nuevo comienzo.",
          details: [
            { label: "Duración", value: "A medida" },
            { label: "Destinos", value: "Según su proyecto de viaje" },
            {
              label: "Transporte",
              value: "Definido con su advisor",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Alta gama y hoteles de autor" },
            {
              label: "Incluye",
              value: "Diseño uno a uno con un Tripper Travel Advisor",
            },
          ],
          eyebrow: "Su Tripper Travel Advisor NUPTIA™ EDITION.",
          footnotes: [],
          kicker: "Su honeymoon, diseñada uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Una pareja comparte un momento de intimidad durante su viaje.",
          revealNote: "Destino revelado 48 h antes",
          tag: "NUPTIA™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center",
    },
  },
  paws: {
    xsed: {
      copy: {
        en: {
          ctaLabel: "DON’T MISS THE DROP",
          description:
            "One night, one dinner and a local experience close to home. Get your vehicle ready and enjoy a change of scenery with the one who always wants to come along.",
          details: [
            { label: "Duration", value: "1 night · Saturday to Sunday" },
            {
              label: "Destination",
              value: "Within 300 km of your starting point",
            },
            {
              label: "Transport",
              value: "In your own vehicle",
              kind: "transport",
            },
            {
              label: "Accommodation",
              value: "1 night of accommodation · pet-friendly",
            },
            {
              label: "Includes",
              value: "Saturday dinner + a local experience",
            },
          ],
          eyebrow: "Your best companion comes too.",
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "Two travelers taking a break next to their vehicle with their dog.",
          revealNote: "Destination revealed 48 h before",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "NO TE PIERDAS EL DROP",
          description:
            "Una noche, una cena y una experiencia local cerca de casa. Prepara tu vehículo y cambia de aire con quien siempre quiere ir contigo.",
          details: [
            { label: "Duración", value: "1 noche · sábado a domingo" },
            { label: "Destino", value: "A menos de 300 km del origen" },
            {
              label: "Transporte",
              value: "En tu propio vehículo",
              kind: "transport",
            },
            {
              label: "Alojamiento",
              value: "1 noche de alojamiento · pet-friendly",
            },
            {
              label: "Incluye",
              value: "Cena de sábado + una experiencia local",
            },
          ],
          eyebrow: "Tu mejor compañía también viene.",
          footnotes: [],
          kicker: "X Suerte Es Domingo",
          name: "XSED™",
          photoAlt:
            "Dos viajeros compartiendo una pausa junto a su vehículo con su perro.",
          revealNote: "Destino revelado 48 h antes",
          tag: "THE SUNDAY GLITCH",
          transportNote: "En tu propio vehículo",
        },
      },
      ctaStyle: "feature",
      photoPosition: "center 50%",
      transport: { modes: ["car-front"] },
    },
    essenza: {
      copy: {
        en: {
          ctaLabel: "ESCAPE TOGETHER",
          description:
            "Two nights for a change of scenery without leaving your pet behind. Pet-friendly accommodation and an essential guide to enjoy together, at your own pace.",
          details: [
            { label: "Duration", value: "2 nights" },
            { label: "Destinations", value: "Domestic" },
            {
              label: "Transport",
              value:
                "Bus, train, boat or plane, depending on the route and pet acceptance",
              kind: "transport",
            },
            {
              label: "Accommodation",
              value: "Comfort · 3★ or equivalent · pet-friendly",
            },
            {
              label: "Includes",
              value: "Essential guide with a pet-friendly map",
            },
          ],
          eyebrow: "A break for the two of you.",
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "A traveler and her dog taking a break at a café.",
          revealNote: "Destination revealed 48 h before",
          tag: "PAWS™ · EXPRESS",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "ESCÁPATE EN SU COMPAÑÍA",
          description:
            "Dos noches para cambiar de aire sin dejar a tu mascota atrás. Un alojamiento pet-friendly y una guía esencial para disfrutar juntos, a su propio ritmo.",
          details: [
            { label: "Duración", value: "2 noches" },
            { label: "Destinos", value: "Nacionales" },
            {
              label: "Transporte",
              value:
                "Autobús, tren, barco o avión, según la ruta y aceptación de tu mascota",
              kind: "transport",
            },
            {
              label: "Alojamiento",
              value: "Confort · 3★ o equivalente · pet-friendly",
            },
            { label: "Incluye", value: "Guía esencial con mapa pet-friendly" },
          ],
          eyebrow: "Una pausa para los dos.",
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt: "Una viajera y su perro compartiendo una pausa en un café.",
          revealNote: "Destino revelado 48 h antes",
          tag: "PAWS™ · EXPRESS",
          transportNote: "Según ruta y mascota",
        },
      },
      photoPosition: "center 20%",
      transport: { modes: ["bus-front", "train-front", "ship", "plane"] },
    },
    "modo-explora": {
      copy: {
        en: {
          ctaLabel: "FOLLOW NEW TRAILS",
          description:
            "Three nights to follow new paths with your adventure buddy. Accommodation full of personality and a guide to pet-friendly places to discover at your own pace.",
          details: [
            { label: "Duration", value: "3 nights" },
            { label: "Destinations", value: "Domestic and regional" },
            {
              label: "Transport",
              value:
                "Train, boat or plane, depending on the route and pet acceptance",
              kind: "transport",
            },
            {
              label: "Accommodation",
              value: "With personality · 3–4★ · pet-friendly",
            },
            {
              label: "Includes",
              value: "Guide to pet-friendly routes and places",
            },
          ],
          eyebrow: "Curiosity leaves pawprints too.",
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt: "A woman and her dog walking through a forest clearing.",
          revealNote: "Destination revealed 48 h before",
          tag: "PAWS™ · CONFIDENTIAL",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "SIGUE NUEVAS HUELLAS",
          description:
            "Tres noches para seguir nuevos caminos con tu compañero de aventuras. Un alojamiento con personalidad y una guía de lugares pet-friendly para descubrir a su ritmo.",
          details: [
            { label: "Duración", value: "3 noches" },
            { label: "Destinos", value: "Nacionales y regionales" },
            {
              label: "Transporte",
              value:
                "Tren, barco o avión, según la ruta y aceptación de tu mascota",
              kind: "transport",
            },
            {
              label: "Alojamiento",
              value: "Con personalidad · 3–4★ · pet-friendly",
            },
            { label: "Incluye", value: "Guía de rutas y lugares pet-friendly" },
          ],
          eyebrow: "La curiosidad también deja huellas.",
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Una mujer y su perro recorriendo un claro del bosque.",
          revealNote: "Destino revelado 48 h antes",
          tag: "PAWS™ · CONFIDENCIAL",
          transportNote: "Según ruta y mascota",
        },
      },
      photoPosition: "center 45%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    "explora-plus": {
      copy: {
        en: {
          ctaLabel: "ADD MEMORIES WITH PAWPRINTS",
          description:
            "Four nights to make new memories with your pet. Premium accommodation, a pet-compatible experience and a personalized guide to explore together.",
          details: [
            { label: "Duration", value: "4 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value:
                "Train, boat or plane, depending on the route and pet acceptance",
              kind: "transport",
            },
            { label: "Accommodation", value: "Premium · 4★ · pet-friendly" },
            {
              label: "Includes",
              value: "1 pet-compatible experience + Destination Decoded* guide",
            },
          ],
          eyebrow: "More world to share.",
          footnotes: [
            "* Destination Decoded: a personalized guide with pet-friendly places so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt: "Two travelers sharing an outdoor picnic with their dog.",
          revealNote: "Destination revealed 48 h before",
          tag: "PAWS™ · COME BACK DIFFERENT",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "SUMA RECUERDOS CON HUELLAS",
          description:
            "Cuatro noches para sumar nuevos recuerdos con tu mascota. Alojamiento premium, una experiencia compatible y una guía personalizada para explorar juntos.",
          details: [
            { label: "Duración", value: "4 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value:
                "Tren, barco o avión, según la ruta y aceptación de tu mascota",
              kind: "transport",
            },
            { label: "Alojamiento", value: "Premium · 4★ · pet-friendly" },
            {
              label: "Incluye",
              value: "1 experiencia compatible + Guía Destination Decoded*",
            },
          ],
          eyebrow: "Más mundo para compartir.",
          footnotes: [
            "* Destination Decoded: guía personalizada con lugares pet-friendly para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Dos viajeros compartiendo un picnic al aire libre con su perro.",
          revealNote: "Destino revelado 48 h antes",
          tag: "PAWS™ · VUELVE DISTINTO",
          transportNote: "Según ruta y mascota",
        },
      },
      photoPosition: "center 63%",
      transport: { modes: ["train-front", "ship", "plane"] },
    },
    bivouac: {
      copy: {
        en: {
          ctaLabel: "TRAVEL DIFFERENTLY",
          description:
            "Five nights to slow down in the best company. Pet-friendly design accommodation and thoughtful details to enjoy the trip at your own pace.",
          details: [
            { label: "Duration", value: "5 nights" },
            { label: "Destinations", value: "Within the continent" },
            {
              label: "Transport",
              value:
                "Plane, boat, train or vehicle, depending on the route and pet acceptance",
              kind: "transport",
            },
            {
              label: "Accommodation",
              value: "Design and service · 4–5★ · pet-friendly",
            },
            {
              label: "Includes",
              value:
                "1 pet-compatible experience + Destination Decoded+* guide + Randomtrip accommodation perks**",
            },
          ],
          eyebrow: "Care in every detail, for both of you.",
          footnotes: [
            "* Destination Decoded+: a pet-friendly guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Late check-out, early check-in, an upgrade or a welcome amenity may be offered. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt: "A traveler petting his dog on the shore of a lake.",
          revealNote: "Destination revealed 48 h before",
          tag: "PAWS™ · TOTAL DISCONNECTION",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "VIAJA DISTINTO",
          description:
            "Cinco noches para bajar el ritmo en la mejor compañía. Alojamientos de diseño pet-friendly y detalles cuidados para disfrutar del viaje, a su propio paso.",
          details: [
            { label: "Duración", value: "5 noches" },
            { label: "Destinos", value: "Dentro del continente" },
            {
              label: "Transporte",
              value:
                "Avión, barco, tren o vehículo, según la ruta y aceptación de tu mascota",
              kind: "transport",
            },
            {
              label: "Alojamiento",
              value: "Diseño y servicio · 4–5★ · pet-friendly",
            },
            {
              label: "Incluye",
              value:
                "1 experiencia compatible + Guía Destination Decoded+* + Beneficios Randomtrip en alojamiento**",
            },
          ],
          eyebrow: "Cuidado al detalle, para ambos.",
          footnotes: [
            "* Destination Decoded+: guía pet-friendly curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Pueden ofrecerse salida tardía, entrada anticipada, upgrade o amenidad de bienvenida. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt: "Un viajero acariciando a su perro a la orilla de un lago.",
          revealNote: "Destino revelado 48 h antes",
          tag: "PAWS™ · DESCONEXIÓN TOTAL",
          transportNote: "Según ruta y mascota",
        },
      },
      photoPosition: "center 50%",
      transport: { modes: ["plane", "ship", "train-front", "car-front"] },
    },
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "LET’S CREATE THE UNREPEATABLE",
          description:
            "Every bond has its own way of traveling. Let’s design a getaway around your interests and your pet’s needs, with a dedicated Tripper Travel Advisor.",
          details: [
            { label: "Duration", value: "Tailor-made" },
            { label: "Destinations", value: "Based on your travel project" },
            {
              label: "Transport",
              value: "Designed for traveling with your pet",
              kind: "transport",
            },
            {
              label: "Accommodation",
              value: "High-end and boutique hotels · pet-friendly",
            },
            {
              label: "Includes",
              value: "One-to-one design with a Tripper Travel Advisor",
            },
          ],
          eyebrow: "Your Tripper Travel Advisor PAWS™ EDITION.",
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "A couple and their dog sharing a quiet moment by a fireplace.",
          revealNote: "Destination revealed 48 h before",
          tag: "PAWS™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "CREEMOS LO IRREPETIBLE",
          description:
            "Cada vínculo tiene su forma de viajar. Diseñemos una escapada alrededor de tus intereses y las necesidades de tu mascota, con un Tripper Travel Advisor dedicado.",
          details: [
            { label: "Duración", value: "A medida" },
            { label: "Destinos", value: "Según tu proyecto de viaje" },
            {
              label: "Transporte",
              value: "Diseñado para viajar con tu mascota",
              kind: "transport",
            },
            {
              label: "Alojamiento",
              value: "Alta gama y hoteles de autor · pet-friendly",
            },
            {
              label: "Incluye",
              value: "Diseño uno a uno con un Tripper Travel Advisor",
            },
          ],
          eyebrow: "Tu Tripper Travel Advisor PAWS™ EDITION.",
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Una pareja y su perro compartiendo una pausa junto a una chimenea.",
          revealNote: "Destino revelado 48 h antes",
          tag: "PAWS™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center 70%",
    },
  },
};

const LEVEL_SLUG_BY_EXPERIENCE_ID = {
  atelier: "atelier-getaway",
  bivouac: "bivouac",
  essenza: "essenza",
  explora: "modo-explora",
  "explora-plus": "explora-plus",
} as const satisfies Record<string, LevelSlug>;

/** Map a planner / URL / pricing level id to the card's LevelSlug. */
function toCardLevelSlug(levelId: string): LevelSlug | null {
  if (levelId.toLowerCase() === "xsed") return "xsed";
  const normalized = normalizeExperienceLevelId(levelId);
  return normalized ? LEVEL_SLUG_BY_EXPERIENCE_ID[normalized] : null;
}

/** Public path of the header photo for a traveler type × level. */
export function getExperienceCardPhotoSrc(
  type: TravelerTypeSlug,
  level: LevelSlug,
): string {
  return `/images/experience-cards/${type}/${level}.jpg`;
}

/**
 * Card content for (type, level, locale), or `null` when the pair has no card
 * (e.g. honeymoon × essenza). `levelId` accepts LevelSlug ("modo-explora"),
 * experience ids ("explora") and "xsed".
 */
export function getExperienceCard(
  type: string,
  levelId: string,
  locale?: string,
): ExperienceCardContent | null {
  const level = toCardLevelSlug(levelId);
  if (!level || !(type in EXPERIENCE_CARDS)) return null;
  const typeSlug = type as TravelerTypeSlug;
  const source = EXPERIENCE_CARDS[typeSlug][level];
  if (!source) return null;
  const copy = locale?.startsWith("en") ? source.copy.en : source.copy.es;
  return {
    ...copy,
    ctaStyle: source.ctaStyle ?? "primary",
    photoPosition: source.photoPosition,
    photoSrc: getExperienceCardPhotoSrc(typeSlug, level),
    transport: source.transport,
  };
}
