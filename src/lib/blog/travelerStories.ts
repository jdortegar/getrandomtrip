import type { BlogPost } from "@/lib/data/shared/blog-types";
import type { Locale } from "@/lib/i18n/config";

type StoryLocale = "en" | "es";

interface StoryCopy {
  category: string;
  paragraphs: [string, string];
  subtitle: string;
  title: string;
}

interface TravelerStory {
  en: StoryCopy;
  es: StoryCopy;
  image: string;
  slug: string;
  travelType: "couple" | "group" | "solo";
}

const PUBLISHED_AT = "2026-03-01T00:00:00.000Z";

const TRAVELER_STORIES: TravelerStory[] = [
  {
    slug: "viajar-solo-la-mejor-decision",
    travelType: "solo",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
    es: {
      category: "Independencia",
      title: "Viajar Solo: La Mejor Decisión que Puedes Tomar",
      subtitle: "Salir sin compañía cambia el ritmo del viaje y también el tuyo.",
      paragraphs: [
        "Viajar solo no es quedarse aislado. Es elegir el horario, el desvío y el silencio sin pedirle permiso a nadie. El primer día se siente raro. Al segundo, el mapa empieza a ser tuyo.",
        "No hace falta un destino lejano para probarlo. Una noche fuera, una caminata sin itinerario y una mesa para uno alcanzan para entender por qué tanta gente vuelve a hacerlo.",
      ],
    },
    en: {
      category: "Independence",
      title: "Traveling Solo: The Best Decision You Can Make",
      subtitle: "Leaving without company changes the pace of the trip, and yours.",
      paragraphs: [
        "Traveling solo is not the same as staying isolated. It means choosing the hour, the detour, and the quiet without asking anyone. The first day feels strange. By the second, the map is yours.",
        "You do not need a far-off destination to try it. One night away, a walk without an itinerary, and a table for one are enough to see why people do it again.",
      ],
    },
  },
  {
    slug: "consejos-de-seguridad-para-viajeros-solitarios",
    travelType: "solo",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    es: {
      category: "Seguridad",
      title: "Consejos de Seguridad para Viajeros Solitarios",
      subtitle: "Un viaje solo se disfruta más cuando las precauciones ya están resueltas.",
      paragraphs: [
        "Compartí el recorrido con alguien de confianza, guardá copias de los documentos y evitá mostrar en el momento dónde estás durmiendo. La precaución no le quita magia al viaje: te deja prestar atención al lugar.",
        "De día, caminá como si conocieras la cuadra. De noche, volvé por calles con gente y usá transporte que puedas rastrear. Si algo no cierra, cambiá de plan. Eso también es viajar bien.",
      ],
    },
    en: {
      category: "Safety",
      title: "Safety Tips for Solo Travelers",
      subtitle: "A solo trip is easier to enjoy once the precautions are already handled.",
      paragraphs: [
        "Share the route with someone you trust, keep copies of your documents, and avoid posting where you are sleeping in real time. Caution does not drain the trip. It lets you pay attention to the place.",
        "By day, walk as if you know the block. At night, return along busy streets and use transport you can track. If something feels off, change the plan. That is part of traveling well.",
      ],
    },
  },
  {
    slug: "mejores-destinos-para-tu-primer-viaje-solo",
    travelType: "solo",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
    es: {
      category: "Destinos",
      title: "Los Mejores Destinos para tu Primer Viaje Solo",
      subtitle: "El primer viaje solo pide un lugar fácil de recorrer y difícil de olvidar.",
      paragraphs: [
        "Para empezar, conviene un destino con transporte claro, caminable y con gente acostumbrada a recibir viajeros. Una ciudad mediana o un pueblo con plaza, mercado y una salida de un día suele funcionar mejor que un circuito enorme.",
        "Elegí un lugar donde puedas volver al alojamiento sin pensarlo demasiado. La aventura está en lo que pasa en el medio: el café, la conversación, la calle que no estaba en la lista.",
      ],
    },
    en: {
      category: "Destinations",
      title: "The Best Destinations for Your First Solo Trip",
      subtitle: "A first solo trip wants a place that is easy to move through and hard to forget.",
      paragraphs: [
        "Start with somewhere walkable, with clear transport and people used to welcoming travelers. A mid-size city or a town with a square, a market, and one day trip usually works better than a huge circuit.",
        "Pick a place where getting back to your stay does not take much thought. The adventure is what happens in between: the coffee, the conversation, the street that was not on the list.",
      ],
    },
  },
  {
    slug: "viajar-solo-sin-gastar-de-mas",
    travelType: "solo",
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3",
    es: {
      category: "Presupuesto",
      title: "Cómo Viajar Solo Sin Gastar de Más",
      subtitle: "Viajar solo puede ser más simple, y también más barato, si el plan es claro.",
      paragraphs: [
        "El gasto extra suele estar en comer fuera todos los días y en moverte sin mirar el precio. Un mercado, un menú del día y caminar los tramos cortos cambian la cuenta sin convertir el viaje en una restricción.",
        "Reservá lo que importa, como el alojamiento y el traslado largo, y dejá el resto abierto. Así el presupuesto alcanza para lo inesperado, que es justo lo que hace que el viaje valga la pena.",
      ],
    },
    en: {
      category: "Budget",
      title: "How to Travel Solo Without Overspending",
      subtitle: "Solo travel can be simpler, and cheaper, when the plan is clear.",
      paragraphs: [
        "The extra cost usually comes from eating out every day and moving without looking at the price. A market, a set lunch, and walking the short stretches change the bill without turning the trip into a restriction.",
        "Book what matters, such as the stay and the long transfer, and leave the rest open. Then the budget still has room for the unexpected, which is what makes the trip worth it.",
      ],
    },
  },
  {
    slug: "conociendo-personas-en-el-camino",
    travelType: "solo",
    image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60",
    es: {
      category: "Experiencias",
      title: "Conociendo Personas en el Camino",
      subtitle: "Viajar solo abre conversaciones que en grupo casi no ocurren.",
      paragraphs: [
        "Una mesa compartida, una pregunta en la fila o una caminata al mismo mirador alcanzan para conocer a alguien. No hace falta forzar un plan social. Al ir solo, la gente te habla porque hay un lugar vacío al lado.",
        "Quedate con las charlas que suman y seguí cuando no. El viaje no se mide por cuántas personas conociste, sino por las que te cambiaron la tarde.",
      ],
    },
    en: {
      category: "Experiences",
      title: "Meeting People Along the Way",
      subtitle: "Traveling solo opens conversations that rarely happen in a group.",
      paragraphs: [
        "A shared table, a question in line, or a walk to the same viewpoint is enough to meet someone. You do not need to force a social plan. When you are alone, people talk to you because there is an empty seat.",
        "Keep the conversations that add something and move on when they do not. A trip is not measured by how many people you met, but by the ones who changed your afternoon.",
      ],
    },
  },
  {
    slug: "el-arte-de-viajar-en-solitario",
    travelType: "solo",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    es: {
      category: "Inspiración",
      title: "El Arte de Viajar en Solitario",
      subtitle: "Viajar solo es una forma de prestar atención, no de desaparecer.",
      paragraphs: [
        "Hay un arte en no llenar cada hora. Sentarte a mirar una plaza, perder un colectivo y encontrar otro camino forma parte del viaje tanto como el lugar al que ibas.",
        "Volvés con menos fotos compartidas y con más detalles propios. Esa es la gracia: el relato no necesita testigos para ser verdadero.",
      ],
    },
    en: {
      category: "Inspiration",
      title: "The Art of Traveling Solo",
      subtitle: "Traveling solo is a way of paying attention, not of disappearing.",
      paragraphs: [
        "There is an art to not filling every hour. Sitting to watch a square, missing a bus, and finding another way belong to the trip as much as the place you were going.",
        "You come back with fewer shared photos and more details of your own. That is the point: the story does not need witnesses to be true.",
      ],
    },
  },
  {
    slug: "momentos-que-solo-pasan-viajando-en-grupo",
    travelType: "group",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    es: {
      category: "Historias",
      title: "10 momentos que solo pasan viajando en grupo",
      subtitle: "Hay escenas que no existen si cada uno viaja por su cuenta.",
      paragraphs: [
        "El desayuno que se alarga, la foto donde nadie mira a la cámara y la decisión absurda que después se vuelve el chiste del año. Viajar en grupo fabrica momentos que una persona sola no puede inventar.",
        "También está el silencio compartido en una ruta, cuando nadie necesita explicar por qué el paisaje alcanza. Esos diez minutos, repetidos, son el viaje.",
      ],
    },
    en: {
      category: "Stories",
      title: "10 moments that only happen when traveling in a group",
      subtitle: "Some scenes do not exist if everyone travels on their own.",
      paragraphs: [
        "The breakfast that runs long, the photo where nobody looks at the camera, and the absurd decision that becomes the joke of the year. Group travel makes moments one person cannot invent alone.",
        "There is also the shared quiet on a road, when nobody needs to explain why the view is enough. Those ten minutes, repeated, are the trip.",
      ],
    },
  },
  {
    slug: "organizar-un-viaje-con-amigos-sin-drama",
    travelType: "group",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    es: {
      category: "Consejos",
      title: "Cómo organizar un viaje con amigos sin drama",
      subtitle: "El grupo funciona cuando las decisiones grandes se cierran antes de salir.",
      paragraphs: [
        "Definan presupuesto, ritmo y una persona que confirme reservas. Lo demás puede votarse en el camino. El drama aparece cuando nadie sabe quién paga, quién elige o hasta qué hora se sale.",
        "Dejen aire para que cada uno se separe un rato. Un grupo que puede partirse y volver a juntarse viaja mejor que uno que hace todo en bloque.",
      ],
    },
    en: {
      category: "Tips",
      title: "How to organize a trip with friends without drama",
      subtitle: "A group works when the big decisions are settled before you leave.",
      paragraphs: [
        "Agree on budget, pace, and one person who confirms bookings. The rest can be voted on the road. Drama shows up when nobody knows who pays, who chooses, or what time you head out.",
        "Leave room for people to split off for a while. A group that can separate and come back together travels better than one that does everything as a block.",
      ],
    },
  },
  {
    slug: "la-ruta-del-vino-entre-ocho",
    travelType: "group",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    es: {
      category: "Experiencias",
      title: "La ruta del vino que hicimos entre 8",
      subtitle: "Ocho personas, una ruta y la regla de no apurar la mesa.",
      paragraphs: [
        "Entre ocho, una ruta del vino se vuelve logística y también fiesta. Hace falta un conductor que rote, una reserva que alcance para todos y la paciencia de no convertir cada bodega en una carrera.",
        "Lo que quedó no fue una cata perfecta. Fue la mesa larga, el brindis repetido y la sensación de que el lugar se entendía mejor porque había con quién comentarlo.",
      ],
    },
    en: {
      category: "Experiences",
      title: "The wine route we did with 8 of us",
      subtitle: "Eight people, one route, and a rule against rushing the table.",
      paragraphs: [
        "With eight people, a wine route becomes logistics and a party. You need a driver who rotates, a booking that fits everyone, and the patience not to turn each winery into a race.",
        "What stayed was not a perfect tasting. It was the long table, the repeated toast, and the sense that the place made more sense because there was someone to talk about it with.",
      ],
    },
  },
  {
    slug: "destinos-ideales-para-grupos-grandes",
    travelType: "group",
    image: "https://images.unsplash.com/photo-1543248939-ff40856f65d4",
    es: {
      category: "Guías",
      title: "Destinos ideales para grupos grandes",
      subtitle: "Un grupo grande necesita espacio, mesas largas y planes que no dependan de un solo horario.",
      paragraphs: [
        "Funcionan los lugares con casas para varias personas, pueblos donde se puede caminar y actividades que acepten horarios distintos. Una ciudad saturada, con filas y reservas de a dos, cansa más de lo que divierte.",
        "Busquen un punto de encuentro fijo y dejen que el día se arme en torno a eso. El destino ideal no es el más famoso. Es el que sigue siendo cómodo cuando son diez.",
      ],
    },
    en: {
      category: "Guides",
      title: "Ideal destinations for large groups",
      subtitle: "A large group needs space, long tables, and plans that do not depend on one schedule.",
      paragraphs: [
        "Places with houses for several people, towns you can walk, and activities that allow different hours work well. A crowded city, with lines and tables for two, tires a group out faster than it entertains them.",
        "Pick a fixed meeting point and let the day form around it. The ideal destination is not the most famous one. It is the one that still feels comfortable when you are ten.",
      ],
    },
  },
  {
    slug: "trekking-en-grupo",
    travelType: "group",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    es: {
      category: "Aventura",
      title: "Trekking en grupo: tips y risas",
      subtitle: "En el sendero, el grupo se ordena solo si el ritmo está hablado.",
      paragraphs: [
        "Antes de salir, pongan el paso del que va más tranquilo y un punto para reagruparse. Las risas vienen después, cuando nadie se quedó atrás ni se fue demasiado adelante.",
        "Lleven agua de más y una meta clara. Un trekking en grupo se recuerda por la cima y por la conversación que apareció en la subida, no por haber apurado a alguien.",
      ],
    },
    en: {
      category: "Adventure",
      title: "Group trekking: tips and laughs",
      subtitle: "On the trail, the group sorts itself out once the pace is agreed.",
      paragraphs: [
        "Before you start, set the pace of the person who walks more slowly and a point to regroup. The laughs come after, when nobody was left behind and nobody raced too far ahead.",
        "Carry extra water and a clear goal. A group trek is remembered for the summit and for the conversation on the way up, not for rushing someone.",
      ],
    },
  },
  {
    slug: "festivales-para-ir-con-la-barra",
    travelType: "group",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
    es: {
      category: "Cultura",
      title: "Festivales para ir con la barra",
      subtitle: "Un festival con amigos pide alojamiento cerca y un plan para volver juntos.",
      paragraphs: [
        "Elijan un festival donde el pueblo aguante al grupo: comida, sombra y un lugar para dormir a distancia caminable. Llegar todos a la misma base importa más que el cartel del escenario.",
        "Combinen un punto y una hora para reencontrarse. La barra se dispersa, y eso está bien, siempre que a la noche sepa dónde se junta de nuevo.",
      ],
    },
    en: {
      category: "Culture",
      title: "Festivals to go with your crew",
      subtitle: "A festival with friends needs a stay nearby and a plan for getting back together.",
      paragraphs: [
        "Choose a festival where the town can hold the group: food, shade, and a place to sleep within walking distance. Arriving at the same base matters more than the name on the stage.",
        "Agree on a place and a time to meet again. The crew will scatter, and that is fine, as long as everyone knows where to gather at night.",
      ],
    },
  },
  {
    slug: "razones-para-un-viaje-sorpresa-en-pareja",
    travelType: "couple",
    image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff",
    es: {
      category: "Romance",
      title: "5 Razones para Amar un Viaje Sorpresa en Pareja",
      subtitle: "La sorpresa le devuelve al viaje la parte que la planificación le saca.",
      paragraphs: [
        "No discutir el destino, descubrirlo juntos y tener a alguien que ya resolvió el traslado cambia el tono de la salida. La pareja se ocupa de estar, no de armar la logística.",
        "La quinta razón es la que más se recuerda: los dos llegan sin la foto previa. El lugar se ve por primera vez con la otra persona al lado.",
      ],
    },
    en: {
      category: "Romance",
      title: "5 Reasons to Love a Surprise Trip as a Couple",
      subtitle: "A surprise gives the trip back the part that planning takes away.",
      paragraphs: [
        "Not debating the destination, discovering it together, and having someone else handle the transfer changes the tone of the getaway. The couple gets to be there, not to build the logistics.",
        "The fifth reason is the one people remember: you both arrive without the preview photo. You see the place for the first time with the other person beside you.",
      ],
    },
  },
  {
    slug: "valija-para-un-destino-desconocido",
    travelType: "couple",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    es: {
      category: "Consejos",
      title: "Cómo Hacer la Valija para un Destino Desconocido",
      subtitle: "Si el destino es sorpresa, la valija tiene que servir para más de un clima.",
      paragraphs: [
        "Armen capas, un calzado que camine y algo para la noche que no ocupe media valija. Pregunten el rango de temperatura y si hay que caminar, no el nombre del lugar.",
        "Dejen espacio. Un viaje sorpresa siempre suma una compra chica o una prenda que no estaba prevista, y la valija cerrada a la fuerza arruina la vuelta.",
      ],
    },
    en: {
      category: "Tips",
      title: "How to Pack for an Unknown Destination",
      subtitle: "If the destination is a surprise, the bag has to work for more than one climate.",
      paragraphs: [
        "Pack layers, shoes you can walk in, and something for the evening that does not take half the bag. Ask for the temperature range and whether you will walk, not for the name of the place.",
        "Leave space. A surprise trip always adds a small purchase or a layer you did not plan, and a bag forced shut ruins the way home.",
      ],
    },
  },
  {
    slug: "randomtrip-a-los-alpes",
    travelType: "couple",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    es: {
      category: "Experiencias",
      title: "La Historia de un Randomtrip a los Alpes",
      subtitle: "Llegaron sin saber el valle y se quedaron por el silencio de la mañana.",
      paragraphs: [
        "El traslado los dejó en un pueblo chico, con montaña adelante y un desayuno que duró más que el plan. No hicieron cumbre. Caminaron, comieron y miraron cómo cambiaba la luz.",
        "La historia que cuentan no es la del destino famoso. Es la de haberse sorprendido juntos y no haber necesitado llenar el día para que valiera.",
      ],
    },
    en: {
      category: "Experiences",
      title: "The Story of a Randomtrip to the Alps",
      subtitle: "They arrived without knowing the valley and stayed for the quiet of the morning.",
      paragraphs: [
        "The transfer left them in a small town, mountain in front and a breakfast that lasted longer than the plan. They did not summit. They walked, ate, and watched the light change.",
        "The story they tell is not about a famous destination. It is about being surprised together and not needing to fill the day for it to count.",
      ],
    },
  },
  {
    slug: "sabores-del-sudeste-asiatico",
    travelType: "couple",
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3",
    es: {
      category: "Guías",
      title: "Sabores del Sudeste Asiático",
      subtitle: "Comer de a dos es la mejor forma de probar más sin pedir de más.",
      paragraphs: [
        "En el sudeste asiático, la mesa se comparte. Pidán de a varios platos chicos, empiecen por el mercado y dejen el restaurante famoso para cuando ya sepan qué les gusta.",
        "Anoten el puesto al que quieren volver. El viaje se recuerda por un caldo, una fruta o una salsa más que por la lista de ciudades.",
      ],
    },
    en: {
      category: "Guides",
      title: "Flavors of Southeast Asia",
      subtitle: "Eating as a pair is the best way to taste more without ordering too much.",
      paragraphs: [
        "In Southeast Asia, the table is shared. Order several small dishes, start at the market, and save the famous restaurant for when you already know what you like.",
        "Note the stall you want to return to. The trip is remembered for a broth, a fruit, or a sauce more than for the list of cities.",
      ],
    },
  },
  {
    slug: "recorriendo-la-carretera-austral",
    travelType: "couple",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
    es: {
      category: "Aventura",
      title: "Recorriendo la Carretera Austral",
      subtitle: "La Austral se recorre despacio, con tiempo para bajarse en cada curva.",
      paragraphs: [
        "No intenten verla toda. Elijan un tramo, un pueblo para dormir y un día sin kilómetros. El paisaje cambia tanto que apurarlo es la forma más fácil de no verlo.",
        "Lleven abrigo aunque salga el sol y paren donde haya un mirador sin nombre. Esos son los que después no aparecen en el mapa y sí en el relato.",
      ],
    },
    en: {
      category: "Adventure",
      title: "Along the Carretera Austral",
      subtitle: "The Austral is driven slowly, with time to pull over at every bend.",
      paragraphs: [
        "Do not try to see all of it. Choose a stretch, a town to sleep in, and a day without kilometers. The landscape changes so much that rushing is the easiest way to miss it.",
        "Pack a layer even if the sun is out, and stop where there is a viewpoint with no name. Those are the ones that never make the map and always make the story.",
      ],
    },
  },
  {
    slug: "playas-escondidas-de-america-latina",
    travelType: "couple",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    es: {
      category: "Inspiración",
      title: "Playas Escondidas de América Latina",
      subtitle: "La playa que vale la pena suele estar un poco después del camino fácil.",
      paragraphs: [
        "No siempre está escondida en el mapa. A veces está escondida en el horario: temprano, antes de que llegue el resto. Caminen veinte minutos más de lo previsto.",
        "Lleven agua y vuelvan con luz. Una playa chica, sin servicio y con la otra persona como única compañía, alcanza para todo el viaje.",
      ],
    },
    en: {
      category: "Inspiration",
      title: "Hidden Beaches of Latin America",
      subtitle: "The beach worth finding is usually a little past the easy path.",
      paragraphs: [
        "It is not always hidden on the map. Sometimes it is hidden in the hour: early, before everyone else arrives. Walk twenty minutes farther than you planned.",
        "Bring water and head back while there is still light. A small beach, with no services and the other person as your only company, is enough for the whole trip.",
      ],
    },
  }
];

const STORIES_BY_SLUG = new Map(TRAVELER_STORIES.map((story) => [story.slug, story]));

function copyFor(story: TravelerStory, locale: string): StoryCopy {
  return locale === "en" ? story.en : story.es;
}

function articleHtml(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

export function travelerStoryCards(slugs: string[], locale: StoryLocale): BlogPost[] {
  return slugs.map((slug) => {
    const story = STORIES_BY_SLUG.get(slug);
    if (!story) throw new Error(`Missing traveler story: ${slug}`);
    const copy = copyFor(story, locale);
    return {
      category: copy.category,
      href: `/blog/${story.slug}`,
      image: story.image,
      title: copy.title,
    };
  });
}

export function travelerStorySlugs(): string[] {
  return TRAVELER_STORIES.map((story) => story.slug);
}

export interface TravelerStoryArticle {
  availableLocales: Locale[];
  content: string;
  coverUrl: string;
  createdAt: string;
  id: string;
  publishedAt: string;
  slug: string;
  subtitle: string;
  tags: string[];
  title: string;
  updatedAt: string;
}

export function getTravelerStoryArticle(
  slug: string,
  locale: string,
): TravelerStoryArticle | null {
  const story = STORIES_BY_SLUG.get(slug);
  if (!story) return null;
  const copy = copyFor(story, locale);
  return {
    availableLocales: ["es", "en"],
    content: articleHtml(copy.paragraphs),
    coverUrl: story.image,
    createdAt: PUBLISHED_AT,
    id: `story-${story.slug}`,
    publishedAt: PUBLISHED_AT,
    slug: story.slug,
    subtitle: copy.subtitle,
    tags: [copy.category],
    title: copy.title,
    updatedAt: PUBLISHED_AT,
  };
}
