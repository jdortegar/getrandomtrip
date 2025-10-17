export interface Testimonial {
  author: string;
  city: string;
  quote: string;
}

export interface TestimonialsData {
  testimonials: Testimonial[];
  title: string;
}

const coupleTestimonials: Testimonial[] = [
  {
    author: 'María & Carlos',
    city: 'Buenos Aires',
    quote:
      'Fue la experiencia más increíble de nuestras vidas. No sabíamos a dónde íbamos hasta 48 horas antes, y fue perfecto.',
  },
  {
    author: 'Ana & Diego',
    city: 'Madrid',
    quote:
      'Randomtrip nos llevó a lugares que nunca hubiéramos descubierto por nuestra cuenta. Una aventura única.',
  },
  {
    author: 'Sofia & Miguel',
    city: 'Barcelona',
    quote:
      'La sorpresa fue total. Cada día era una nueva aventura. Definitivamente lo repetiremos.',
  },
  {
    author: 'Laura & Pablo',
    city: 'Valencia',
    quote:
      'Increíble cómo conocieron nuestros gustos sin que les dijéramos nada. El viaje fue perfecto.',
  },
  {
    author: 'Carmen & Roberto',
    city: 'Sevilla',
    quote:
      'Una experiencia única que nos unió aún más como pareja. Altamente recomendado.',
  },
  {
    author: 'Isabel & Fernando',
    city: 'Málaga',
    quote:
      'Randomtrip superó todas nuestras expectativas. Un viaje que recordaremos para siempre.',
  },
];

const soloTestimonials: Testimonial[] = [
  {
    quote:
      'Mi primer viaje solo y me sentí acompañado por una organización impecable. Volví distinto.',
    author: 'Martín S.',
    city: 'Buenos Aires',
  },
  {
    quote:
      'La sorpresa fue un regalo. Me encontré con lugares y personas que no esperaba.',
    author: 'Camila R.',
    city: 'Montevideo',
  },
  {
    quote:
      'Itinerario flexible y seguro. Pude moverme a mi ritmo sin perderme lo esencial.',
    author: 'Diego P.',
    city: 'Santiago',
  },
  {
    quote:
      'Me animé a probar cosas nuevas. Gran equilibrio entre actividad y calma.',
    author: 'Luisa G.',
    city: 'Córdoba',
  },
  {
    quote: 'La curaduría me hizo sentir protagonista del viaje, no espectador.',
    author: 'Tomás L.',
    city: 'Mendoza',
  },
  {
    quote: 'Volví con historias que me dieron ganas de seguir viajando solo.',
    author: 'Ivana Q.',
    city: 'Rosario',
  },
];

const familyTestimonials: Testimonial[] = [
  {
    quote:
      'Randomtrip hizo que nuestro viaje familiar fuera inolvidable. ¡Todo fue perfecto, desde la planificación hasta las actividades!',
    author: 'Familia García',
    city: 'Buenos Aires',
  },
  {
    quote:
      'Nunca pensamos que viajar con niños podría ser tan relajante. Descubrimos lugares increíbles sin estrés.',
    author: 'Los Rodríguez',
    city: 'Córdoba',
  },
  {
    quote:
      'La atención al detalle y las recomendaciones personalizadas superaron nuestras expectativas. ¡Vamos por el próximo!',
    author: 'Familia Pérez',
    city: 'Mendoza',
  },
  {
    quote:
      'Logística impecable con cochecito y siestas. Todo fluyó para grandes y chicos.',
    author: 'Familia Suárez',
    city: 'Rosario',
  },
  {
    quote: 'Actividades pensadas para cada edad. Nadie se quedó afuera.',
    author: 'Familia Romero',
    city: 'Montevideo',
  },
  {
    quote: 'Nos sorprendieron con detalles que todavía recordamos en casa.',
    author: 'Familia Benítez',
    city: 'La Plata',
  },
];

const groupTestimonials: Testimonial[] = [
  {
    quote:
      'Éramos 12 con ritmos y presupuestos distintos. No hubo fricciones: cada día tuvo "ese" momento en común.',
    author: 'Valentín R.',
    city: 'Mendoza',
  },
  {
    quote:
      'Offsite con foco en estrategia y team-bonding. Logística impecable y actividades con intención.',
    author: 'Carolina M.',
    city: 'Valle de Uco',
  },
  {
    quote:
      'Graduación sorpresa para 10. Aventura, playa y un cierre al atardecer que no vamos a olvidar.',
    author: 'Sofía P.',
    city: 'Bahía',
  },
  {
    quote:
      'Fuimos a fotografiar fauna y volvimos con historias. Los timings y permisos fueron clave.',
    author: 'Nicolás T.',
    city: 'Esteros',
  },
  {
    quote:
      'Retiros con pausa real. La curaduría de lugares, comida y silencios nos cambió el pulso.',
    author: 'Mariana A.',
    city: 'Sierras',
  },
  {
    quote:
      'Mesa larga, mercados y cocina local. La sorpresa estuvo en los detalles.',
    author: 'Germán C.',
    city: 'Salta',
  },
];

const honeymoonTestimonials: Testimonial[] = [
  {
    quote:
      'No elegimos un punto en el mapa; elegimos sorprendernos juntos. Fue el comienzo perfecto.',
    author: 'Sofía & Belu',
    city: 'Córdoba',
  },
  {
    quote:
      'Hubo detalles pensados para dos que hicieron la diferencia. Se sintió hecho a mano.',
    author: 'Valen & Tomi',
    city: 'Mendoza',
  },
  {
    quote:
      'El mejor regalo después del "sí": tiempo sin fricción y momentos que todavía nombramos.',
    author: 'Carla & Nico',
    city: 'Buenos Aires',
  },
  {
    quote:
      'Playas, viñedos y un ritmo que fue nuestro. Volvimos con rituales nuevos.',
    author: 'Gaby & Leo',
    city: 'Montevideo',
  },
  {
    quote:
      'Nos dieron pistas y nosotros escribimos el resto. Intimidad y sorpresa, en partes justas.',
    author: 'Flor & Juan',
    city: 'Rosario',
  },
  {
    quote:
      'Nunca pensamos que el "después del sí" podía tener tanta magia. Gracias por el guion invisible.',
    author: 'Lau & Fede',
    city: 'Santiago',
  },
];

const pawsTestimonials: Testimonial[] = [
  {
    quote:
      '¡Increíble experiencia! Mi perro y yo disfrutamos cada momento. La logística fue perfecta y los alojamientos superaron nuestras expectativas.',
    author: 'Ana & Max (Golden Retriever)',
    city: 'Buenos Aires',
  },
  {
    quote:
      'Siempre fue un desafío encontrar lugares donde mi gato fuera bienvenido. PAWS© lo hizo posible. Un viaje sin estrés y con mimos para mi felino.',
    author: 'Carlos & Luna (Siamesa)',
    city: 'Rosario',
  },
  {
    quote:
      'Nunca pensé que viajar con mi hurón sería tan fácil. Gracias a PAWS©, tuvimos unas vacaciones inolvidables. ¡Totalmente recomendado!',
    author: 'Sofía & Rocky (Hurón)',
    city: 'Mendoza',
  },
  {
    quote:
      'Senderos pet-friendly, playas sin restricciones y alojamientos de primera. Mi Border Collie no paraba de correr.',
    author: 'Diego & Thor (Border Collie)',
    city: 'Bariloche',
  },
  {
    quote:
      'La atención a los detalles pet-friendly fue impresionante. Desde las caminatas hasta los restaurantes, todo pensado.',
    author: 'Lucía & Coco (Beagle)',
    city: 'Mar del Plata',
  },
  {
    quote:
      'Viajar con mi mascota nunca fue tan fácil. PAWS© entendió que ella es parte de la familia.',
    author: 'Martín & Negra (Labrador)',
    city: 'Córdoba',
  },
];

export function getTestimonialsByType(type: string): TestimonialsData {
  switch (type) {
    case 'couple':
      return {
        testimonials: coupleTestimonials,
        title: 'Lo que dicen las parejas',
      };
    case 'solo':
      return {
        testimonials: soloTestimonials,
        title: 'Lo que dicen quienes viajaron solos',
      };
    case 'family':
    case 'families':
      return {
        testimonials: familyTestimonials,
        title: 'Lo que dicen las familias',
      };
    case 'group':
      return {
        testimonials: groupTestimonials,
        title: 'Lo que dicen los grupos',
      };
    case 'honeymoon':
      return {
        testimonials: honeymoonTestimonials,
        title: 'Lo que dicen las parejas recién casadas',
      };
    case 'paws':
      return {
        testimonials: pawsTestimonials,
        title: 'Lo que dicen nuestros viajeros con huellas',
      };
    default:
      return {
        testimonials: coupleTestimonials,
        title: 'Lo que dicen nuestros viajeros',
      };
  }
}
