interface Testimonial {
  author: string;
  city: string;
  quote: string;
}

interface TestimonialsData {
  testimonials: Testimonial[];
  title: string;
}

export function getTestimonialsByType(type: string): TestimonialsData {
  const testimonials: Testimonial[] = [
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

  return {
    testimonials,
    title: 'Lo que dicen las parejas',
  };
}
