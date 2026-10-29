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
          ctaLabel: "SEE THE NEXT DROP",
          description:
            "A one-night weekend within 300 km of home, in your own car, with dinner and a local experience to get a change of scenery at your own pace.",
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
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt: "A traveler next to her vehicle on a road-trip getaway",
          revealNote: "Destination revealed 48 hours before you leave.",
          availabilityNote:
            "Only 10 getaways per country. Sales open every Sunday at 6:00 p.m.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "VER EL PRÓXIMO DROP",
          description:
            "Un fin de semana de una noche a menos de 300 km de casa, en tu propio auto, con cena y una experiencia local para cambiar de aire a tu ritmo.",
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
          footnotes: [],
          kicker: "X suerte es domingo",
          name: "XSED™",
          photoAlt: "Viajera junto a su vehículo en una escapada por carretera",
          revealNote: "Destino revelado 48 horas antes de salir.",
          availabilityNote:
            "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
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
          ctaLabel: "CHOOSE ESSENZA",
          description:
            "A two-night getaway, with transport and accommodation sorted, to take a break, change scenery and enjoy some time for yourself.",
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
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "A traveler enjoys a coffee at her own pace",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "SOLUM™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR ESSENZA",
          description:
            "Una escapada de dos noches, con transporte y alojamiento resueltos, para hacer una pausa, cambiar de escenario y disfrutar de tiempo para ti.",
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
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt: "Una viajera disfruta de un café a su propio ritmo",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE MODO EXPLORA",
          description:
            "Three nights to follow your curiosity, with a stay full of character and a destination guide to explore on your own, at your own pace.",
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
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt: "A traveler takes in the landscape from the train",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "SOLUM™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR MODO EXPLORA",
          description:
            "Tres noches para seguir tu curiosidad, con un alojamiento con personalidad y una guía del destino para explorar por tu cuenta y a tu ritmo.",
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
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Una viajera contempla el paisaje desde el tren",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE EXPLORA+",
          description:
            "Four nights to get to know the destination more deeply, with premium accommodation, an included experience and a personalized guide to discover more of what interests you.",
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
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt: "A traveler gazes at the clouds from a lookout",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "SOLUM™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR EXPLORA+",
          description:
            "Cuatro noches para conocer el destino más a fondo, con alojamiento premium, una experiencia incluida y una guía personalizada para descubrir más de lo que te interesa.",
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
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt: "Un viajero contempla las nubes desde un mirador",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE BIVOUAC",
          description:
            "Five nights to slow down and make time for yourself, with design stays, an exclusive experience and a curated guide to discover the destination unhurried.",
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
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt: "A traveler enjoys the sea from a balcony",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "SOLUM™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR BIVOUAC",
          description:
            "Cinco noches para bajar el ritmo y dedicarte tiempo, con alojamientos de diseño, una experiencia exclusiva y una guía curada para descubrir el destino con calma.",
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
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt: "Una viajera disfruta del mar desde un balcón",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "START MY TAILOR-MADE TRIP",
          description:
            "A trip tailored to your interests, timing and way of traveling, created with a dedicated advisor to make room for what you want to experience.",
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
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "A traveler alone facing the sea in a design space",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "SOLUM™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "EMPEZAR MI VIAJE A MEDIDA",
          description:
            "Un viaje a medida de tus intereses, tiempos y forma de viajar, creado junto a un asesor dedicado para darle espacio a eso que quieres vivir.",
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
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt: "Un viajero a solas frente al mar en un espacio de diseño",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "SEE THE NEXT DROP",
          description:
            "A one-night weekend within 300 km of home, in your own car, with dinner and a local experience to share.",
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
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "A couple planning their route with a map next to their vehicle.",
          revealNote: "Destination revealed 48 hours before you leave.",
          availabilityNote:
            "Only 10 getaways per country. Sales open every Sunday at 6:00 p.m.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "VER EL PRÓXIMO DROP",
          description:
            "Un fin de semana de una noche a menos de 300 km de casa, en su propio auto, con cena y una experiencia local para compartir.",
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
          footnotes: [],
          kicker: "X suerte es domingo",
          name: "XSED™",
          photoAlt:
            "Pareja preparando su recorrido con un mapa junto a su vehículo.",
          revealNote: "Destino revelado 48 horas antes de salir.",
          availabilityNote:
            "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
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
          ctaLabel: "CHOOSE ESSENZA",
          description:
            "A two-night getaway, with transport and accommodation sorted, to get a change of scenery and make time for each other.",
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
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "Two men in a couple sharing a close moment outdoors.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "BOND™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR ESSENZA",
          description:
            "Una escapada de dos noches, con transporte y alojamiento resueltos, para cambiar de aire y dedicarse tiempo juntos.",
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
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt:
            "Dos hombres en pareja compartiendo un momento de complicidad al aire libre.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE MODO EXPLORA",
          description:
            "Three nights to discover a new destination together, with a stay full of character and a guide to explore at your own pace.",
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
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt:
            "A couple embracing as they take in a green landscape from a train window.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "BOND™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR MODO EXPLORA",
          description:
            "Tres noches para descubrir juntos un nuevo destino, con un alojamiento con personalidad y una guía para explorar a su ritmo.",
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
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt:
            "Pareja abrazada contemplando un paisaje verde desde la ventana de un tren.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE EXPLORA+",
          description:
            "Four nights to get to know the destination more deeply, with premium accommodation, an included experience and a personalized guide to enjoy together.",
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
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt:
            "A couple sitting together facing a valley of green mountains.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "BOND™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR EXPLORA+",
          description:
            "Cuatro noches para conocer el destino más a fondo, con alojamiento premium, una experiencia incluida y una guía personalizada para disfrutar juntos.",
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
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Pareja sentada junta frente a un valle de montañas verdes.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE BIVOUAC",
          description:
            "Five nights to travel unhurried, with design stays, an exclusive experience and a curated guide to share time and discover new places together.",
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
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt:
            "A couple embracing as they relax in a pool overlooking green surroundings.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "BOND™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR BIVOUAC",
          description:
            "Cinco noches para viajar sin prisa, con alojamientos de diseño, una experiencia exclusiva y una guía curada para compartir tiempo y descubrir nuevos lugares juntos.",
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
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt:
            "Pareja abrazada descansando en una piscina con vista a un entorno verde.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "START OUR TAILOR-MADE TRIP",
          description:
            "A trip tailored to your interests, timing and way of traveling, created with a dedicated advisor to shape what you imagine.",
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
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "Two women in a couple embracing by the sea.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "BOND™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "EMPEZAR NUESTRO VIAJE A MEDIDA",
          description:
            "Un viaje a medida de sus intereses, tiempos y forma de viajar, creado junto a un asesor dedicado para darle forma a lo que imaginan.",
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
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt: "Dos mujeres en pareja abrazándose junto al mar.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "SEE THE NEXT DROP",
          description:
            "A one-night weekend within 300 km of home, in your own vehicles, with dinner and a local experience to finally get that plan out of the group chat.",
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
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt: "Four friends playing cards next to their vehicle.",
          revealNote: "Destination revealed 48 hours before you leave.",
          availabilityNote:
            "Only 10 getaways per country. Sales open every Sunday at 6:00 p.m.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicles",
        },
        es: {
          ctaLabel: "VER EL PRÓXIMO DROP",
          description:
            "Un fin de semana de una noche a menos de 300 km de casa, en sus propios vehículos, con cena y una experiencia local para sacar ese plan del chat.",
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
          footnotes: [],
          kicker: "X suerte es domingo",
          name: "XSED™",
          photoAlt:
            "Cuatro amigos compartiendo una partida de cartas junto a su vehículo.",
          revealNote: "Destino revelado 48 horas antes de salir.",
          availabilityNote:
            "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
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
          ctaLabel: "CHOOSE ESSENZA",
          description:
            "A two-night getaway, with transport and accommodation sorted, to bring the group together, catch up and enjoy it without organizing everything.",
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
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "Three friends sharing coffee and conversation outdoors.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "CREW™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR ESSENZA",
          description:
            "Una escapada de dos noches, con transporte y alojamiento resueltos, para reunir al grupo, ponerse al día y disfrutar sin organizarlo todo.",
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
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt:
            "Tres amigos compartiendo un café y una conversación al aire libre.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE MODO EXPLORA",
          description:
            "Three nights to discover new places with friends, with a stay full of character and a destination guide to explore at the group’s pace.",
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
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt:
            "A group of friends looking out over a lake among the mountains.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "CREW™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR MODO EXPLORA",
          description:
            "Tres noches para descubrir nuevos lugares con amigos, con un alojamiento con personalidad y una guía del destino para explorar al ritmo del grupo.",
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
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Grupo de amigos contemplando un lago entre montañas.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE EXPLORA+",
          description:
            "Four nights to add stories to the group, with premium accommodation, an included experience and a personalized guide to discover and enjoy together.",
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
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt: "Four friends sharing food and conversation on a terrace.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "CREW™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR EXPLORA+",
          description:
            "Cuatro noches para sumar historias al grupo, con alojamiento premium, una experiencia incluida y una guía personalizada para descubrir y disfrutar juntos.",
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
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Cuatro amigos compartiendo sabores y conversación en una terraza.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE BIVOUAC",
          description:
            "Five nights to share without rushing, with design stays, an exclusive experience and a curated guide to turn the get-together into a special trip.",
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
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt:
            "A group of friends relaxing on a wooden deck facing a green landscape.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "CREW™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR BIVOUAC",
          description:
            "Cinco noches para compartir sin prisas, con alojamientos de diseño, una experiencia exclusiva y una guía curada para hacer del encuentro un viaje especial.",
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
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt:
            "Grupo de amigos descansando en una terraza de madera frente a un paisaje verde.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "START OUR TAILOR-MADE TRIP",
          description:
            "A trip tailored to the group’s interests, timing and plans, created with a dedicated advisor to turn that someday idea into a shared experience.",
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
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "Friends sharing a break on the deck of a boat at sunset.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "CREW™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "EMPEZAR NUESTRO VIAJE A MEDIDA",
          description:
            "Un viaje a medida de los intereses, tiempos y planes del grupo, creado junto a un asesor dedicado para convertir esa idea pendiente en una experiencia compartida.",
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
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Amigos compartiendo una pausa en la cubierta de una embarcación al atardecer.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "SEE THE NEXT DROP",
          description:
            "A one-night weekend within 300 km of home, in your own vehicle, with dinner and a local experience to break the routine as a family.",
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
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "A family getting their vehicle ready for an outdoor getaway.",
          revealNote: "Destination revealed 48 hours before you leave.",
          availabilityNote:
            "Only 10 getaways per country. Sales open every Sunday at 6:00 p.m.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "VER EL PRÓXIMO DROP",
          description:
            "Un fin de semana de una noche a menos de 300 km de casa, en su propio vehículo, con cena y una experiencia local para salir de la rutina en familia.",
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
          footnotes: [],
          kicker: "X suerte es domingo",
          name: "XSED™",
          photoAlt:
            "Familia preparando su vehículo para compartir una escapada al aire libre.",
          revealNote: "Destino revelado 48 horas antes de salir.",
          availabilityNote:
            "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
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
          ctaLabel: "CHOOSE ESSENZA",
          description:
            "A two-night getaway, with transport and accommodation sorted, to get a change of scenery, share time and enjoy the simple things together.",
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
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "A family sharing a break and a picnic in a park.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "KIN™ · EXPRESS",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR ESSENZA",
          description:
            "Una escapada de dos noches, con transporte y alojamiento resueltos, para cambiar de aire, compartir tiempo y disfrutar juntos de las cosas simples.",
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
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt: "Familia compartiendo una pausa y un picnic en un parque.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE MODO EXPLORA",
          description:
            "Three nights to spark curiosity as a family, with a stay full of character and a destination guide to discover together at your own pace.",
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
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt: "A family walking a forest trail among the trees.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "KIN™ · CONFIDENTIAL",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR MODO EXPLORA",
          description:
            "Tres noches para despertar la curiosidad en familia, con un alojamiento con personalidad y una guía del destino para descubrir juntos a su ritmo.",
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
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Familia recorriendo un sendero de bosque entre árboles.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE EXPLORA+",
          description:
            "Four nights to create new family memories, with premium accommodation, an included experience and a personalized guide to make the most of your time together.",
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
          footnotes: [
            "* Destination Decoded: a personalized guide so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt:
            "A mother and daughter sharing a moment in an apple orchard.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "KIN™ · COME BACK DIFFERENT",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR EXPLORA+",
          description:
            "Cuatro noches para crear nuevos recuerdos familiares, con alojamiento premium, una experiencia incluida y una guía personalizada para aprovechar el tiempo juntos.",
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
          footnotes: [
            "* Destination Decoded: guía personalizada para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Madre e hija compartiendo un momento en un huerto de manzanas.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE BIVOUAC",
          description:
            "Five nights to enjoy as a family without rushing, with design stays, an exclusive experience and a curated guide to share new discoveries.",
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
          footnotes: [
            "* Destination Decoded+: a guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Accommodation perks: may include late check-out, early check-in, an upgrade or a welcome amenity, among others. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt: "A family walking by the sea in the warm light of sunset.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "KIN™ · TOTAL DISCONNECTION",
          transportNote: "Depending on the route",
        },
        es: {
          ctaLabel: "ELEGIR BIVOUAC",
          description:
            "Cinco noches para disfrutar en familia sin prisas, con alojamientos de diseño, una experiencia exclusiva y una guía curada para compartir nuevos descubrimientos.",
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
          footnotes: [
            "* Destination Decoded+: guía curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Beneficios de alojamiento: pueden incluir salida tardía (late check-out), entrada anticipada (early check-in), upgrade o amenidad de bienvenida, entre otros. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt:
            "Familia caminando junto al mar con la luz cálida del atardecer.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "START OUR TAILOR-MADE TRIP",
          description:
            "A trip tailored to your family’s ages, interests and rhythms, created with a dedicated advisor to find a way to enjoy it together.",
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
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Grandparents and granddaughters sharing a break by the sea and the boats.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "KIN™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "EMPEZAR NUESTRO VIAJE A MEDIDA",
          description:
            "Un viaje a medida de las edades, intereses y ritmos de su familia, creado junto a un asesor dedicado para encontrar una forma de disfrutar juntos.",
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
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Abuelos y nietas compartiendo una pausa junto al mar y las embarcaciones.",
          revealNote: "Destino revelado 48 horas antes de salir.",
          tag: "KIN™ · TAILOR MADE",
        },
      },
      ctaStyle: "outline",
      photoPosition: "center 25%",
    },
  },
  honeymoon: {
    xsed: {
      copy: {
        en: {
          ctaLabel: "SEE THE NEXT DROP",
          description:
            "A one-night weekend within 300 km of home, in your own car, with dinner and a local experience to celebrate this new beginning.",
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
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "A couple planning their route with a map next to their vehicle.",
          revealNote: "Destination revealed 48 hours before you leave.",
          availabilityNote:
            "Only 10 getaways per country. Sales open every Sunday at 6:00 p.m.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "VER EL PRÓXIMO DROP",
          description:
            "Un fin de semana de una noche a menos de 300 km de casa, en su propio auto, con cena y una experiencia local para celebrar este nuevo comienzo.",
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
          footnotes: [],
          kicker: "X suerte es domingo",
          name: "XSED™",
          photoAlt:
            "Pareja preparando su recorrido con un mapa junto a su vehículo.",
          revealNote: "Destino revelado 48 horas antes de salir.",
          availabilityNote:
            "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "En tu propio vehículo",
        },
      },
      ctaStyle: "feature",
      photoType: "couple",
      photoPosition: "center 45%",
      transport: { modes: ["car-front"] },
    },
    "atelier-getaway": {
      copy: {
        en: {
          ctaLabel: "START OUR TAILOR-MADE TRIP",
          description:
            "A honeymoon designed around the two of you, with a dedicated advisor who shapes your interests, timing and ideas to celebrate this new beginning your way.",
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
          footnotes: [],
          kicker: "Your honeymoon, designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt: "A couple shares an intimate moment during their trip.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "NUPTIA™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "EMPEZAR NUESTRO VIAJE A MEDIDA",
          description:
            "Una luna de miel diseñada alrededor de ustedes, con un asesor dedicado que dará forma a sus intereses, tiempos e ideas para celebrar este nuevo comienzo a su manera.",
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
          footnotes: [],
          kicker: "Su honeymoon, diseñada uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Una pareja comparte un momento de intimidad durante su viaje.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "SEE THE NEXT DROP",
          description:
            "A one-night weekend within 300 km of home, in your own vehicle, with pet-friendly accommodation, dinner and a local experience to get a change of scenery together.",
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
          footnotes: [],
          kicker: "Thank God It’s Sunday",
          name: "TGIS™",
          photoAlt:
            "Two travelers taking a break next to their vehicle with their dog.",
          revealNote: "Destination revealed 48 hours before you leave.",
          availabilityNote:
            "Only 10 getaways per country. Sales open every Sunday at 6:00 p.m.",
          tag: "THE SUNDAY GLITCH",
          transportNote: "In your own vehicle",
        },
        es: {
          ctaLabel: "VER EL PRÓXIMO DROP",
          description:
            "Un fin de semana de una noche a menos de 300 km de casa, en tu propio vehículo, con alojamiento que admite mascotas, cena y una experiencia local para cambiar de aire en su compañía.",
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
          footnotes: [],
          kicker: "X suerte es domingo",
          name: "XSED™",
          photoAlt:
            "Dos viajeros compartiendo una pausa junto a su vehículo con su perro.",
          revealNote: "Destino revelado 48 horas antes de salir.",
          availabilityNote:
            "Solo 10 escapadas por país. La venta abre cada domingo a las 18:00.",
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
          ctaLabel: "CHOOSE ESSENZA",
          description:
            "A two-night getaway with your pet, with transport suited to their needs and accommodation that welcomes them, to change scenery without leaving them behind.",
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
          footnotes: [],
          kicker: "The essentials, with style",
          name: "ESSENZA™",
          photoAlt: "A traveler and her dog taking a break at a café.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "PAWS™ · EXPRESS",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "ELEGIR ESSENZA",
          description:
            "Una escapada de dos noches con tu mascota, con transporte adaptado a sus condiciones y alojamiento que la recibe, para cambiar de escenario sin dejarla atrás.",
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
          footnotes: [],
          kicker: "Lo esencial con estilo",
          name: "ESSENZA™",
          photoAlt: "Una viajera y su perro compartiendo una pausa en un café.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE MODO EXPLORA",
          description:
            "Three nights to discover new paths with your pet, with accommodation that welcomes them and a guide to routes and places to enjoy together.",
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
          footnotes: [],
          kicker: "More to discover",
          name: "MODO EXPLORA™",
          photoAlt: "A woman and her dog walking through a forest clearing.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "PAWS™ · CONFIDENTIAL",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "ELEGIR MODO EXPLORA",
          description:
            "Tres noches para descubrir nuevos caminos con tu mascota, con un alojamiento que la recibe y una guía de rutas y lugares para disfrutar en su compañía.",
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
          footnotes: [],
          kicker: "Más por descubrir",
          name: "MODO EXPLORA™",
          photoAlt: "Una mujer y su perro recorriendo un claro del bosque.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE EXPLORA+",
          description:
            "Four nights to share more discoveries with your pet, with premium accommodation that welcomes them, a pet-friendly experience and a personalized guide to explore.",
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
          footnotes: [
            "* Destination Decoded: a personalized guide with pet-friendly places so every day is a curated surprise.",
          ],
          kicker: "More layers, more moments",
          name: "EXPLORA+™",
          photoAlt: "Two travelers sharing an outdoor picnic with their dog.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "PAWS™ · COME BACK DIFFERENT",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "ELEGIR EXPLORA+",
          description:
            "Cuatro noches para compartir más descubrimientos con tu mascota, con alojamiento premium que la recibe, una experiencia compatible y una guía personalizada para explorar.",
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
          footnotes: [
            "* Destination Decoded: guía personalizada con lugares pet-friendly para que cada día sea una sorpresa curada.",
          ],
          kicker: "Más capas, más momentos",
          name: "EXPLORA+™",
          photoAlt:
            "Dos viajeros compartiendo un picnic al aire libre con su perro.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "CHOOSE BIVOUAC",
          description:
            "Five nights to slow down with your pet, with design stays that welcome them, a pet-friendly experience and a curated guide to enjoy together.",
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
          footnotes: [
            "* Destination Decoded+: a pet-friendly guide curated by our Tripper Travel Advisors, with insider tips few people know.",
            "** Late check-out, early check-in, an upgrade or a welcome amenity may be offered. Subject to availability; none are guaranteed.",
          ],
          kicker: "Handcrafted curation",
          name: "BIVOUAC™",
          photoAlt: "A traveler petting his dog on the shore of a lake.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "PAWS™ · TOTAL DISCONNECTION",
          transportNote: "Depending on route and pet",
        },
        es: {
          ctaLabel: "ELEGIR BIVOUAC",
          description:
            "Cinco noches para bajar el ritmo con tu mascota, con alojamientos de diseño que la reciben, una experiencia compatible y una guía curada para disfrutar en su compañía.",
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
          footnotes: [
            "* Destination Decoded+: guía pet-friendly curada por nuestros Tripper Travel Advisors, con claves que pocos conocen.",
            "** Pueden ofrecerse salida tardía, entrada anticipada, upgrade o amenidad de bienvenida. Sujetos a disponibilidad; ninguno está garantizado.",
          ],
          kicker: "Curaduría artesanal",
          name: "BIVOUAC™",
          photoAlt: "Un viajero acariciando a su perro a la orilla de un lago.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
          ctaLabel: "START MY TAILOR-MADE TRIP",
          description:
            "A trip tailored to your interests and your pet’s needs, created with a dedicated advisor so sharing the road becomes part of the plan.",
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
          footnotes: [],
          kicker: "Designed one to one",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "A couple and their dog sharing a quiet moment by a fireplace.",
          revealNote: "Destination revealed 48 hours before you leave.",
          tag: "PAWS™ · TAILOR MADE",
        },
        es: {
          ctaLabel: "EMPEZAR MI VIAJE A MEDIDA",
          description:
            "Un viaje a medida de tus intereses y las necesidades de tu mascota, creado junto a un asesor dedicado para que compartir el camino sea parte del plan.",
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
          footnotes: [],
          kicker: "Diseñado uno a uno",
          name: "ATELIER GETAWAY™",
          photoAlt:
            "Una pareja y su perro compartiendo una pausa junto a una chimenea.",
          revealNote: "Destino revelado 48 horas antes de salir.",
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
    photoSrc: getExperienceCardPhotoSrc(source.photoType ?? typeSlug, level),
    transport: source.transport,
  };
}
