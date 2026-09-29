import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";

// Synthetic, offline-only authored data. Provider policies below are fixture data,
// not defaults. Public example.com destinations are never fetched by the renderer.
const metadata = {
  templateVersion: 1 as const,
  label: "TEST / NOT FOR TRAVEL",
  country: "AR",
  locale: "es" as const,
};
const booking = {
  holder: "Alex Ejemplo",
  issueDate: "2026-08-13",
  reservationReference: "DEMO-2026-89413",
  paymentWording: "Confirmado / Incluido",
  supplierConfirmation: "RESERVA CONFIRMADA",
  supplierConfirmationUrl: "https://example.com/confirmation/demo",
};
const provider = {
  name: "CABAÑA RURAL EL ENCUENTRO",
  address: "Próximo a RN 8",
  locality: "San Antonio de Areco",
  region: "Buenos Aires, Argentina",
  contact: "+54 (000) 0000-0000",
  email: "contact@example.com",
  locationUrl: "https://example.com/location",
};
export const hotelFixture: HotelVoucherDocument = {
  ...metadata,
  template: "hotel-voucher",
  data: {
    ...booking,
    holder: "Alex Ejemplo",
    guests: "2 Personas",
    property: provider,
    checkInDate: "2026-08-15",
    checkOutDate: "2026-08-16",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    inclusions: [
      {
        id: "breakfast",
        title: "Desayuno",
        description: "Servicio tradicional incluido",
      },
      {
        id: "wifi",
        title: "Internet",
        description: "Conexión Wi-Fi sin costo",
      },
      {
        id: "parking",
        title: "Estacionamiento",
        description: "Privado en el predio",
      },
      {
        id: "facilities",
        title: "Instalaciones",
        description: "Piscina y zona de parrillas",
      },
    ],
    localActivities:
      "Cabalgatas guiadas por senderos rurales y estancias tradicionales.\nVisitas a talleres artesanales de platería, soguería y cuero.\nRecorridos históricos por la Plaza Ruiz de Arellano y museos criollos.\nGastronomía local en pulperías y restaurantes de campo tradicionales.",
    instructions:
      "Horario de recepción de este alojamiento de muestra: 15:00 - 20:00 hs.",
  },
};
export const dinnerFixture: DinnerVoucherDocument = {
  ...metadata,
  template: "dinner-voucher",
  data: {
    ...booking,
    guests: "2 Personas",
    restaurant: {
      ...provider,
      name: "RESTAURANTE ROSSITA",
      address: "Centro Histórico",
      email: "",
    },
    date: "2026-08-15",
    time: "20:30",
    service: "Cena de Pasos",
    menuItems: [
      {
        id: "starter",
        title: "Entrada",
        description:
          "A elección de la carta (opciones tradicionales e individuales por persona).",
      },
      {
        id: "main",
        title: "Plato Principal",
        description:
          "A elección de la carta (especialidades de la casa y carnes/pastas).",
      },
      {
        id: "dessert",
        title: "Postre",
        description: "Un postre a elección para finalizar la velada.",
      },
      {
        id: "drink",
        title: "Bebida",
        description:
          "1 Bebida sin alcohol por persona (agua mineral o gaseosa).",
      },
    ],
    conditions:
      "Se solicita puntualidad. La mesa se mantendrá reservada durante un margen máximo de 15 minutos.\nConsumos adicionales no contemplados en el menú especificado (bebidas alcohólicas adicionales o café) se abonarán en el establecimiento.\nSi requiere modificaciones de horario o avisar sobre alguna alergia alimentaria, comuníquese con anticipación al restaurante.",
  },
};
export const activityFixture: ActivityVoucherDocument = {
  ...metadata,
  template: "activity-voucher",
  data: {
    ...booking,
    participants: "2 Personas",
    provider: {
      ...provider,
      name: "PAMPAS DE ARECO HOTEL & SPA",
      address: "Ruta Provincial 41, Km 271",
      email: "",
    },
    date: "2026-08-16",
    time: "10:00",
    endTime: "18:00",
    service: "Day Spa Relax & Campo",
    program: [
      {
        id: "water",
        title: "Circuito de Agua & Sauna",
        description:
          "Acceso a piscina climatizada, sauna seco, sauna húmedo y ducha escocesa.",
      },
      {
        id: "massage",
        title: "Masaje Relajante",
        description:
          "Sesión de masaje corporal descontracturante de 45 minutos por persona.",
      },
      {
        id: "lunch",
        title: "Almuerzo o Merienda Saludable",
        description:
          "Infusiones, jugos naturales, frutería y propuesta gastronómica de campo.",
      },
      {
        id: "equipment",
        title: "Equipamiento & Blancos",
        description:
          "Uso de batas, toallas, ojotas y lockers individuales incluidos.",
      },
    ],
    recommendations:
      "Se recomienda llegar con 15 minutos de anticipación al horario fijado para su primera sesión de masajes.\nEs obligatorio el uso de traje de baño en la zona de piscinas y circuitos húmedos.\nPara reprogramaciones o avisos sobre condiciones médicas/alergias, contactar a la recepción del spa previamente.",
  },
};
export const xsedFixture: XsedRoadmapDocument = {
  ...metadata,
  template: "xsed-roadmap",
  data: {
    origin: "Pilar",
    destination: "San Antonio de Areco",
    departureDate: "2026-08-15",
    departureTime: "10:30",
    drivingDuration: "~1h 15m",
    reservationReference: "DEMO-2026-89413",
    mapUrl: "https://example.com/route",
    stops: [
      {
        id: "start",
        title: "Salida de Pilar",
        time: "10:30",
        directions:
          "Ruta: Autopista Panamericana Ramal Pilar (RN 8) con sentido al norte.\nDetalle: Viaje tranquilo y a velocidad regulada para disfrutar el paisaje rural que empieza a abrirse paso.",
      },
      {
        id: "optional",
        title: "Parada Opcional: Los Cardales",
        time: "11:00",
        directions:
          "Cómo desviar: En el Km 61,5 de la Ruta 8, tomar la Ruta Provincial 6 unos kilómetros a la derecha.\nQué ver: Un pueblo verde y ferroviario ideal para estirar las piernas temprano, ver el mural de Maradona en la vieja estación o abastecerse de provisiones en almacenes locales.",
      },
      {
        id: "star",
        title: "Parada Estrella: Capilla del Señor",
        time: "12:00",
        directions:
          "Cómo llegar: Volviendo a la Ruta 8, avanzar hasta el Km 68 y tomar la Ruta Provincial 39 hacia la derecha.\nQué hacer:\n• Caminar por las calles antiguas sin ochavas alrededor de la Plaza Mitre.\n• Almuerzo: Reservar en El Mirador 1862 (casona histórica con cocina gourmet) o almorzar en la clásica parrilla informal La Carreta del Gato.\n• Cafecito: Pastelería francesa y café de especialidad en el patio colonial de Réveillez.",
      },
      {
        id: "final",
        title: "Destino Final: San Antonio de Areco",
        time: "15:30",
        directions:
          "El tramo final: Retomar la RN 8 hasta el Km 113.\nActividades de tarde:\n• Mates en la costanera del Río Areco cruzando el icónico Puente Viejo.\n• Visitar platerías tradicionales (como el Museo Draghi) y el Museo Gauchesco Ricardo Güiraldes.\n• Cierre del día: Tomar un vermut clásico en el histórico Boliche de Bessonart o en el Almacén de Ramos Generales.",
      },
    ],
  },
};
export const experienceFixture: ExperienceRoadmapDocument = {
  ...metadata,
  template: "experience-roadmap",
  data: {
    origin: "Buenos Aires",
    destination: "San Antonio de Areco",
    startDate: "2026-08-15",
    endDate: "2026-08-16",
    duration: "~1h 15m",
    heading: "San Antonio de Areco",
    travelerLabel: "PAREJA",
    experienceLabel: "Modo Explora +",
    reservationReference: "DEMO-2026-89413",
    mapUrl: "https://example.com/experience",
    activities: xsedFixture.data.stops.map((stop, index) => ({
      id: stop.id,
      title: [
        "Casita del Pilar",
        "Almuerzo en Los Cardales",
        "Actividades en El viejo tiroleto",
        "Cena en La capita",
      ][index],
      time: stop.time,
      description:
        index === 3 ? xsedFixture.data.stops[0].directions : stop.directions,
    })),
  },
};
export const referenceFixtures = [
  hotelFixture,
  dinnerFixture,
  activityFixture,
  xsedFixture,
  experienceFixture,
];
