import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export const HOME_TESTIMONIALS = {
  title: 'Lo que dicen sobre RandomTrip',
  items: [
    {
      author: 'Martín S.',
      country: 'Argentina',
      countryCode: 'AR',
      quote:
        'Mi primer viaje solo y me sentí acompañado por una organización impecable. Volví distinto.',
    },
    {
      author: 'María & Juan',
      country: 'Argentina',
      countryCode: 'AR',
      quote:
        'La luna de miel perfecta. Todo fue mágico desde el primer momento.',
    },
    {
      author: 'Familia López',
      country: 'Argentina',
      countryCode: 'AR',
      quote:
        'Viajar con niños puede ser caótico. Ellos lo hicieron fácil y divertido para todos.',
    },
    {
      author: 'Camila R.',
      country: 'Uruguay',
      countryCode: 'UY',
      quote:
        'La sorpresa fue un regalo. Me encontré con lugares y personas que no esperaba.',
    },
    {
      author: 'Laura & Pablo',
      country: 'España',
      countryCode: 'ES',
      quote: 'Cada detalle pensado para nosotros. Inolvidable.',
    },
    {
      author: 'Diego P.',
      country: 'Chile',
      countryCode: 'CL',
      quote:
        'Itinerario flexible y seguro. Pude moverme a mi ritmo sin perderme lo esencial.',
    },
  ] as Testimonial[],
};
