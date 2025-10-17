import type { Testimonial } from '@/lib/data/shared/testimonial-types';

export const familyTestimonialsData = {
  title: 'Lo que dicen nuestras familias',
  items: [
    { quote: 'Todos disfrutaron, desde el más chico hasta los abuelos. Muy bien balanceado.', author: 'Familia Gómez', city: 'Rosario' },
    { quote: 'Actividades para todas las edades. Se nota que pensaron en cada detalle.', author: 'Familia López', city: 'Córdoba' },
    { quote: 'Los chicos querían quedarse un día más. Hermosos recuerdos para todos.', author: 'Familia Fernández', city: 'Buenos Aires' },
    { quote: 'Flexibilidad sin perder estructura. Fue fácil movernos con los nenes.', author: 'Familia Martínez', city: 'Mendoza' },
    { quote: 'Un viaje del que todavía hablamos en las cenas. Vale cada peso.', author: 'Familia Silva', city: 'Santiago' },
    { quote: 'Descubrimos lugares que no hubiéramos encontrado solos. Gran experiencia.', author: 'Familia Rodríguez', city: 'Lima' },
  ] as Testimonial[],
};

export const familyTestimonialsTitle = familyTestimonialsData.title;
export const familyTestimonials = familyTestimonialsData.items;
