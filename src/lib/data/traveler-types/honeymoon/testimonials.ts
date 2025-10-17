import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export const honeymoonTestimonialsData = {
  title: 'Lo que dicen nuestras parejas recién casadas',
  items: [
    { quote: 'La luna de miel perfecta. Todo fue mágico desde el primer momento.', author: 'María & Juan', city: 'Buenos Aires' },
    { quote: 'Cada detalle pensado para nosotros. Inolvidable.', author: 'Laura & Pablo', city: 'Madrid' },
    { quote: 'Superó nuestras expectativas. Comenzamos nuestra vida juntos de la mejor manera.', author: 'Ana & Diego', city: 'Barcelona' },
    { quote: 'Romántico, sorprendente y perfecto. Gracias por tanto.', author: 'Sofia & Miguel', city: 'Valencia' },
    { quote: 'Un comienzo de matrimonio que jamás olvidaremos.', author: 'Carmen & Roberto', city: 'Sevilla' },
    { quote: 'La experiencia más romántica que hemos vivido juntos.', author: 'Isabel & Fernando', city: 'Málaga' },
  ] as Testimonial[],
};

export const honeymoonTestimonialsTitle = honeymoonTestimonialsData.title;
export const honeymoonTestimonials = honeymoonTestimonialsData.items;
