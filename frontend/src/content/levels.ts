export interface ExperienceLevel {
  id: string;
  name: { es: string; en: string };
  price: number;
  subtitle: { es: string; en: string };
  priceFootnote?: { es: string; en: string };
  cta?: { es: string; en: string };
  features: { es: string[]; en: string[] };
}

export const COUPLE_LEVELS: ExperienceLevel[] = [
  {
    id: "essenza",
    name: { es: "Essenza", en: "Essenza" },
    price: 350,
    subtitle: { es: "Lo esencial con estilo", en: "Essential with style" },
    priceFootnote: { es: "Precio por persona (base doble)", en: "Price per person (double occupancy)" },
    cta: { es: "Reservar", en: "Book now" },
    features: {
      es: [
        "Estancias cortas (1 a 2 noches)",
        "Alojamiento 3★ boutique",
        "Transporte económico",
        "Sorpresas esenciales del destino",
      ],
      en: [
        "Short stays (1 to 2 nights)",
        "3★ boutique accommodation",
        "Economy transport",
        "Essential destination surprises",
      ],
    },
  },
  {
    id: "luminosa",
    name: { es: "Luminosa", en: "Luminosa" },
    price: 700,
    subtitle: { es: "Lujo accesible", en: "Accessible luxury" },
    priceFootnote: { es: "Precio por persona (base doble)", en: "Price per person (double occupancy)" },
    cta: { es: "Reservar", en: "Book now" },
    features: {
      es: [
        "Estancias de 2 a 3 noches",
        "Hoteles 4★ seleccionados",
        "Experiencias locales incluidas",
        "Transporte estándar",
        "Atenciones sorpresa",
      ],
      en: [
        "Stays of 2 to 3 nights",
        "Selected 4★ hotels",
        "Local experiences included",
        "Standard transport",
        "Surprise touches",
      ],
    },
  },
  {
    id: "aurora",
    name: { es: "Aurora", en: "Aurora" },
    price: 1200,
    subtitle: { es: "Experiencia premium", en: "Premium experience" },
    priceFootnote: { es: "Precio por persona (base doble)", en: "Price per person (double occupancy)" },
    cta: { es: "Reservar", en: "Book now" },
    features: {
      es: [
        "Estancias de 3 a 4 noches",
        "Alojamiento 5★ boutique",
        "Excursiones guiadas premium",
        "Transporte privado en destino",
        "Detalles exclusivos",
      ],
      en: [
        "Stays of 3 to 4 nights",
        "5★ boutique accommodation",
        "Premium guided excursions",
        "Private transport in destination",
        "Exclusive details",
      ],
    },
  },
  {
    id: "infinita",
    name: { es: "Infinita", en: "Infinita" },
    price: 2000,
    subtitle: { es: "El viaje sin límites", en: "The limitless journey" },
    priceFootnote: { es: "Precio por persona (base doble)", en: "Price per person (double occupancy)" },
    cta: { es: "Reservar", en: "Book now" },
    features: {
      es: [
        "Estancias de 4 a 5 noches",
        "Hoteles de lujo 5★ superior",
        "Experiencias gastronómicas exclusivas",
        "Actividades de aventura o wellness",
        "Concierge personalizado",
      ],
      en: [
        "Stays of 4 to 5 nights",
        "5★ superior luxury hotels",
        "Exclusive gastronomic experiences",
        "Adventure or wellness activities",
        "Personalized concierge",
      ],
    },
  },
  {
    id: "divina",
    name: { es: "Divina", en: "Divina" },
    price: 3500,
    subtitle: { es: "La cima de Randomtrip", en: "The peak of Randomtrip" },
    priceFootnote: { es: "Precio por persona (base doble)", en: "Price per person (double occupancy)" },
    cta: { es: "Reservar", en: "Book now" },
    features: {
      es: [
        "Estancias de 5+ noches",
        "Resorts icónicos o propiedades únicas",
        "Experiencias irrepetibles diseñadas a medida",
        "Transporte premium o vuelos internos",
        "Atenciones de lujo sorpresa",
      ],
      en: [
        "Stays of 5+ nights",
        "Iconic resorts or unique properties",
        "Unrepeatable tailor-made experiences",
        "Premium transport or domestic flights",
        "Luxury surprise touches",
      ],
    },
  },
];