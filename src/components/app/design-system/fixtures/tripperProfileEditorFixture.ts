/**
 * Gallery-only fixture for the Tripper profile editor example page.
 *
 * "Nico Aranda" is a fictional Tripper (from the product prototype); the
 * content is sample user input, not UI copy, so it lives here as a
 * locale-keyed map instead of the dictionaries. Never import this from
 * production routes.
 */
import { buildEmptyTripperProfileDraft } from "@/lib/helpers/tripperProfileEditor";
import type { Locale } from "@/lib/i18n/config";
import type {
  ProfileEditorCatalogDict,
  TripperProfileEditorDict,
  TripperPublicProfileDict,
} from "@/lib/types/dictionary";
import type {
  TripperProfileDraft,
  TripperProfileGalleryItem,
  TripperProfilePlace,
  TripperProfileStoryOption,
} from "@/types/tripper";

const IMG = "/images/brand-book";

interface FixtureText {
  bio: Pick<TripperProfileDraft["bio"], "body" | "lead" | "more" | "title">;
  coverAlt: string;
  coverCaption: string;
  gallery: string[];
  headline: string;
  mediaTitles: [string, string, string];
  stories: { category: string; title: string }[];
  travelerTypes: { couple: string; group: string; solo: string };
}

const TEXT: Record<Locale, FixtureText> = {
  en: {
    bio: {
      body: "Those are the things I look for when I travel. I live in Mendoza and I'm drawn to places you understand by walking, talking and sitting down at the table.\n\nAs a Tripper, I turn that curiosity into experiences with intent. I bring the perspective and the curation; Randomtrip makes sure the trip is well taken care of.",
      lead: "A long after-dinner chat. A detour that was worth it. Someone telling you: “This way.”",
      more: "I travel with a notebook, a camera and plenty of room to change my mind. I like morning markets, mountain roads and bars where someone ends up recommending the next place.",
      title: "I'm the kind who comes back\nby a different street.",
    },
    coverAlt: "Vineyards at the foot of the Andes at sunset, Mendoza",
    coverCaption: "Mendoza, where I always come back.",
    gallery: ["Lunch that turned into the afternoon.", "Looking out of the train window.", "A van, a lookout and no rush."],
    headline: "I believe in back roads.\nAnd in the stories that show up\nwhen you stop checking the clock.",
    mediaTitles: ["A pause to look\nat things differently.", "One idea can change the trip.", "A short video reference."],
    stories: [
      { category: "Nico's view", title: "A table can change your trip." },
      { category: "Road notes", title: "The plan was to head back early." },
      { category: "Slow travel", title: "Things happen between two stops, too." },
      { category: "Mendoza / Local tables", title: "Mendoza is told over dessert." },
      { category: "Rhythm / Slow travel", title: "What shows up when you travel slowly." },
      { category: "Rituals", title: "I always carry a notebook." },
      { category: "Roads / Chile", title: "Stories that come in through the window." },
      { category: "Oaxaca / Mexico", title: "A market and a conversation in Oaxaca." },
      { category: "Friends / CREW", title: "The best plan starts with a message." },
    ],
    travelerTypes: {
      couple: "Less juggling calendars.\nMore meeting somewhere new.",
      group: "You bring the energy.\nWe sort out the plan.",
      solo: "Switch off the noise.\nReconnect with what moves you.",
    },
  },
  es: {
    bio: {
      body: "Esas son las cosas que busco cuando viajo. Vivo en Mendoza y me interesan los lugares que se entienden caminando, conversando y sentándose a la mesa.\n\nComo Tripper, convierto esa curiosidad en experiencias con intención. Yo aporto la mirada y la curaduría; Randomtrip se ocupa de que el viaje esté bien resuelto.",
      lead: "Una sobremesa larga. Un desvío que valió la pena. Alguien que te dice: «Por acá».",
      more: "Viajo con una libreta, una cámara y bastante margen para cambiar de idea. Me gustan los mercados por la mañana, los caminos de montaña y los bares donde alguien termina recomendando el próximo lugar.",
      title: "Soy de los que vuelven\npor otra calle.",
    },
    coverAlt: "Viñedos al pie de la cordillera de los Andes al atardecer, Mendoza",
    coverCaption: "Mendoza, donde siempre vuelvo.",
    gallery: ["Un almuerzo que se volvió tarde.", "Mirar por la ventana del tren.", "Una combi, un mirador y nada de prisa."],
    headline: "Creo en los caminos secundarios.\nY en las historias que aparecen\ncuando dejas de mirar el reloj.",
    mediaTitles: ["Una pausa para\nmirar de otra manera.", "Una idea puede cambiar el viaje.", "Una referencia de video corto."],
    stories: [
      { category: "La mirada de Nico", title: "Una mesa puede cambiarte el viaje." },
      { category: "Notas de camino", title: "El plan era volver temprano." },
      { category: "Viajar sin prisa", title: "Entre dos paradas también pasan cosas." },
      { category: "Mendoza / Mesas locales", title: "Mendoza se cuenta en la sobremesa." },
      { category: "Ritmo / Viajar sin prisa", title: "Lo que aparece cuando viajas despacio." },
      { category: "Rituales", title: "Siempre llevo una libreta." },
      { category: "Caminos / Chile", title: "Historias que entran por la ventanilla." },
      { category: "Oaxaca / México", title: "Un mercado y una conversación en Oaxaca." },
      { category: "Amigos / CREW", title: "El mejor plan empieza con un mensaje." },
    ],
    travelerTypes: {
      couple: "Menos coordinar agendas.\nMás encontrarse en otro lugar.",
      group: "Ustedes ponen las ganas.\nNosotros resolvemos el plan.",
      solo: "Desconecta del ruido.\nReconecta con lo que te mueve.",
    },
  },
};

const STORY_IMAGES = [
  "lunch-table.jpg",
  "van-overlook.jpg",
  "train-window.jpg",
  "stone-street.jpg",
  "coastal-town.jpg",
  "camera-map.jpg",
  "alley-sea.jpg",
  "blue-door-portrait.jpg",
  "sunset-swim.jpg",
];

/** The prototype's twelve sample places, with approximate coordinates for the atlas map. */
const PLACES: TripperProfilePlace[] = [
  { city: "Mendoza", coordinates: { lat: -32.89, lng: -68.84 }, countryCode: "AR", id: "example-place-1", isLocalExpert: true, storyId: "example-story-1" },
  { city: "Chacras de Coria", coordinates: { lat: -32.99, lng: -68.87 }, countryCode: "AR", id: "example-place-2", isLocalExpert: true },
  { city: "Potrerillos", coordinates: { lat: -32.95, lng: -69.19 }, countryCode: "AR", id: "example-place-3", isLocalExpert: true },
  { city: "Buenos Aires", coordinates: { lat: -34.6, lng: -58.38 }, countryCode: "AR", id: "example-place-4", isLocalExpert: true },
  { city: "Santiago", coordinates: { lat: -33.45, lng: -70.66 }, countryCode: "CL", id: "example-place-5", isLocalExpert: true },
  { city: "Valparaíso", coordinates: { lat: -33.05, lng: -71.62 }, countryCode: "CL", id: "example-place-6", isLocalExpert: true },
  { city: "San Pedro de Atacama", coordinates: { lat: -22.91, lng: -68.2 }, countryCode: "CL", id: "example-place-7", isLocalExpert: false },
  { city: "Ciudad de México", coordinates: { lat: 19.43, lng: -99.13 }, countryCode: "MX", id: "example-place-8", isLocalExpert: false },
  { city: "Oaxaca", coordinates: { lat: 17.06, lng: -96.73 }, countryCode: "MX", id: "example-place-9", isLocalExpert: true, storyId: "example-story-8" },
  { city: "San Cristóbal de las Casas", coordinates: { lat: 16.74, lng: -92.64 }, countryCode: "MX", id: "example-place-10", isLocalExpert: false },
  { city: "Lisboa", coordinates: { lat: 38.72, lng: -9.14 }, countryCode: "PT", id: "example-place-11", isLocalExpert: false },
  { city: "Porto", coordinates: { lat: 41.15, lng: -8.61 }, countryCode: "PT", id: "example-place-12", isLocalExpert: false },
];

const STORY_MINUTES = [3, 2, 3, 2, 2, 2, 2, 2, 2];

/** Nine fictional published posts — enough to exercise search and 3-per-page paging. */
export function tripperProfileStoriesFixture(locale: Locale): TripperProfileStoryOption[] {
  return TEXT[locale].stories.map((story, index) => ({
    ...story,
    href: "#",
    id: `example-story-${index + 1}`,
    imageUrl: `${IMG}/${STORY_IMAGES[index % STORY_IMAGES.length]}`,
    minutes: STORY_MINUTES[index],
  }));
}

/** A complete sample draft: essentials done, plus places, media and featured stories. */
export function tripperProfileDraftFixture(locale: Locale): TripperProfileDraft {
  const text = TEXT[locale];
  const draft = buildEmptyTripperProfileDraft();

  draft.identity = {
    city: "Mendoza",
    countryCode: "AR",
    coverAlt: text.coverAlt,
    coverCaption: text.coverCaption,
    coverUrl: `${IMG}/van-overlook.jpg`,
    headline: text.headline,
    name: "Nico Aranda",
    portraitUrl: `${IMG}/mateo.jpg`,
    slug: "nico-aranda",
  };
  draft.bio = { ...text.bio, affinities: ["backRoads", "localTables", "slowTravel"] };
  draft.travelerTypes = {
    couple: { enabled: true, imageUrl: `${IMG}/sunset-swim.jpg`, text: text.travelerTypes.couple },
    group: { enabled: true, imageUrl: `${IMG}/van-overlook.jpg`, text: text.travelerTypes.group },
    solo: { enabled: true, imageUrl: `${IMG}/train-window.jpg`, text: text.travelerTypes.solo },
  };
  draft.places = PLACES.map((place) => ({ ...place }));
  draft.media = {
    gallery: [
      { caption: text.gallery[0]!, id: "example-gallery-1", kind: "photo", url: `${IMG}/lunch-table.jpg` },
      { caption: text.gallery[1]!, id: "example-gallery-2", kind: "photo", url: `${IMG}/train-window.jpg` },
      { caption: text.gallery[2]!, id: "example-gallery-3", kind: "photo", url: `${IMG}/van-overlook.jpg` },
      ...tripperProfileFullGalleryFixture(locale).slice(3, 6),
    ],
    items: [
      {
        id: "example-media-1",
        isVisible: true,
        posterUrl: `${IMG}/van-overlook.jpg`,
        provider: "youtube",
        title: text.mediaTitles[0],
        url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      },
      {
        id: "example-media-2",
        isVisible: true,
        posterUrl: `${IMG}/camera-map.jpg`,
        provider: "instagram",
        title: text.mediaTitles[1],
        url: "https://www.instagram.com/p/DXiYOKaFxwb/",
      },
      {
        id: "example-media-3",
        isVisible: true,
        posterUrl: `${IMG}/coastal-town.jpg`,
        provider: "tiktok",
        title: text.mediaTitles[2],
        url: "https://www.tiktok.com/@scout2015/video/6718335390845095173",
      },
    ],
    linkedinUrl: "",
    websiteUrl: "",
  };
  draft.featuredStoryIds = ["example-story-1", "example-story-2", "example-story-3"];
  return draft;
}

const GALLERY_IMAGES = [
  "lunch-table.jpg",
  "train-window.jpg",
  "van-overlook.jpg",
  "stone-street.jpg",
  "coastal-town.jpg",
  "alley-sea.jpg",
  "sunset-swim.jpg",
  "camera-map.jpg",
];

/** Eight photos — the gallery's maximum, for the "full" state. */
export function tripperProfileFullGalleryFixture(locale: Locale): TripperProfileGalleryItem[] {
  const captions = TEXT[locale].gallery;
  return GALLERY_IMAGES.map((image, index) => ({
    caption: captions[index % captions.length]!,
    id: `example-full-gallery-${index + 1}`,
    kind: "photo",
    url: `${IMG}/${image}`,
  }));
}

/** Props shared by every section of the profile editor component catalog. */
export interface ProfileCatalogExampleProps {
  catalog: ProfileEditorCatalogDict;
  copy: TripperProfileEditorDict;
  locale: Locale;
  publicCopy: TripperPublicProfileDict;
}

/** Randomtrip editorial picks for the "no featured stories" fallback, credited to Randomtrip. */
export function tripperProfileEditorialStoriesFixture(locale: Locale): TripperProfileStoryOption[] {
  return tripperProfileStoriesFixture(locale)
    .slice(3, 6)
    .map((story, index) => ({ ...story, author: "Randomtrip", id: `example-editorial-${index + 1}` }));
}
